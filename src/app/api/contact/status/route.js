import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { inquiryIds, email } = body || {};

    const cleanIds = Array.isArray(inquiryIds)
      ? inquiryIds
          .filter((id) => typeof id === 'string' && id.trim().length > 0)
          .slice(0, 50)
      : [];

    const cleanEmail =
      email && typeof email === 'string' && EMAIL_REGEX.test(email.trim())
        ? email.trim().toLowerCase()
        : null;

    if (cleanIds.length === 0 && !cleanEmail) {
      return NextResponse.json(
        { success: true, inquiries: [] },
        { status: 200 }
      );
    }

    const supabase = await createClient();
    let query = supabase
      .from('contact_inquiries')
      .select(
        'id, name, email, subject, message, status, reply_message, replied_at, replied_by_name, created_at'
      )
      .order('created_at', { ascending: false });

    if (cleanIds.length > 0 && cleanEmail) {
      // Return inquiries matching either the specific stored IDs OR the verified email
      query = query.or(`id.in.(${cleanIds.join(',')}),email.eq.${cleanEmail}`);
    } else if (cleanIds.length > 0) {
      query = query.in('id', cleanIds);
    } else if (cleanEmail) {
      query = query.eq('email', cleanEmail);
    }

    const { data, error } = await query;

    if (error) {
      console.warn(
        '[API Contact Status] Supabase query notice:',
        error.message
      );
      return NextResponse.json({ success: true, inquiries: [] });
    }

    return NextResponse.json({
      success: true,
      inquiries: data || [],
    });
  } catch (err) {
    console.error('[API Contact Status] Internal error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve inquiry status',
        inquiries: [],
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url || 'http://localhost');
    const idsParam = searchParams.get('ids');
    const emailParam = searchParams.get('email');

    const cleanIds = idsParam
      ? idsParam
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
          .slice(0, 50)
      : [];

    const cleanEmail =
      emailParam && EMAIL_REGEX.test(emailParam.trim())
        ? emailParam.trim().toLowerCase()
        : null;

    if (cleanIds.length === 0 && !cleanEmail) {
      return NextResponse.json({ success: true, inquiries: [] });
    }

    const supabase = await createClient();
    let query = supabase
      .from('contact_inquiries')
      .select(
        'id, name, email, subject, message, status, reply_message, replied_at, replied_by_name, created_at'
      )
      .order('created_at', { ascending: false });

    if (cleanIds.length > 0 && cleanEmail) {
      query = query.or(`id.in.(${cleanIds.join(',')}),email.eq.${cleanEmail}`);
    } else if (cleanIds.length > 0) {
      query = query.in('id', cleanIds);
    } else if (cleanEmail) {
      query = query.eq('email', cleanEmail);
    }

    const { data, error } = await query;

    if (error) {
      console.warn(
        '[API Contact Status GET] Supabase query notice:',
        error.message
      );
      return NextResponse.json({ success: true, inquiries: [] });
    }

    return NextResponse.json({
      success: true,
      inquiries: data || [],
    });
  } catch (err) {
    console.error('[API Contact Status GET] Internal error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve inquiry status',
        inquiries: [],
      },
      { status: 500 }
    );
  }
}
