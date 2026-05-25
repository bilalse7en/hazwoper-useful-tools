/**
 * Profile Update API Route
 * Uses @supabase/ssr for secure session handling and data updates.
 */
import { createClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const cookieNames = cookieStore.getAll().map((c) => c.name);
  console.log('API Route Cookie Names:', cookieNames);

  try {
    const {
      data: { user },
      error: authUserError,
    } = await supabase.auth.getUser();

    if (!user || authUserError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, avatarUrl, targetUserId } = body;
    let { username } = body;

    // 1. Determine Target User (Self or Administrative Override)
    const finalUserId = targetUserId || user.id;
    const isEditingSelf = finalUserId === user.id;

    if (!isEditingSelf) {
      // Verify Administrative Permissions
      const { data: actorProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (actorProfile?.role !== 'admin') {
        return NextResponse.json(
          {
            error:
              'Administrative clearance required for global synchronization.',
          },
          { status: 403 }
        );
      }
    }

    // 2. Auto-generate full name
    const fullName = `${firstName || ''} ${lastName || ''}`.trim();

    // 3. Comprehensive Username Uniqueness Check
    if (username) {
      username = username.toLowerCase().replace(/\s+/g, '_');

      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', finalUserId)
        .maybeSingle();

      if (existingUser) {
        const suggestions = [
          `${username}_${Math.floor(100 + Math.random() * 899)}`,
          `${username}${Math.floor(10 + Math.random() * 89)}`,
          `${username}_pro`,
        ];

        return NextResponse.json(
          {
            error: 'Identity Conflict',
            message: `The alias "${username}" is already assigned to another profile.`,
            suggestions,
          },
          { status: 409 }
        );
      }
    }

    // 4. Update Profile Table
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: finalUserId,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      username: username,
      email: isEditingSelf ? user.email : body.email || undefined,
      avatar_url:
        avatarUrl ||
        (isEditingSelf ? user.user_metadata?.avatar_url : undefined),
      profile_image:
        avatarUrl ||
        (isEditingSelf ? user.user_metadata?.avatar_url : undefined),
      updated_at: new Date().toISOString(),
    });

    if (profileError) throw profileError;

    // 5. Update Auth Metadata (Only if editing self, as we can't easily update other users' auth metadata via standard client)
    if (isEditingSelf) {
      await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          first_name: firstName,
          last_name: lastName,
          avatar_url: avatarUrl || user.user_metadata?.avatar_url,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: isEditingSelf
        ? 'Profile updated successfully.'
        : 'User identity synchronized by administrator.',
      user: isEditingSelf
        ? {
            ...user,
            user_metadata: {
              ...user.user_metadata,
              full_name: fullName,
              first_name: firstName,
              last_name: lastName,
            },
          }
        : null,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
