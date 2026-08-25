import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[API Courses GET] Supabase query error:', error.message);
      return NextResponse.json(
        { success: false, error: error.message, courses: [] },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, courses: data || [] });
  } catch (err) {
    console.error('[API Courses GET] Internal error:', err);
    return NextResponse.json(
      { success: false, error: err.message, courses: [] },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body || !body.title) {
      return NextResponse.json(
        { success: false, error: 'Course title is required' },
        { status: 400 }
      );
    }

    const courseId =
      body.id ||
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'course-' + Date.now());
    const supabase = await createClient();

    const payload = {
      id: courseId,
      title: body.title,
      slug:
        body.slug ||
        body.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') +
          '-' +
          Date.now().toString(36),
      description: body.description || '',
      category: body.category || 'safety',
      duration: body.duration || 7200,
      duration_label: body.durationLabel || '2 Hours',
      thumbnail:
        body.thumbnail ||
        'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=800&auto=format&fit=crop&q=80',
      status: body.status || 'published',
      settings: body.settings || {},
      modules: body.modules || [],
      final_exam: body.finalExam || {},
      updated_at: new Date().toISOString(),
    };

    let { data, error } = await supabase
      .from('courses')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.warn(
        '[API Courses POST] Upsert conflict/notice, attempting direct update fallback:',
        error.message
      );
      const updateRes = await supabase
        .from('courses')
        .update(payload)
        .eq('id', payload.id)
        .select()
        .single();

      if (!updateRes.error) {
        data = updateRes.data;
        error = null;
      }
    }

    if (error) {
      console.error('[API Courses POST] Supabase save error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, course: data });
  } catch (err) {
    console.error('[API Courses POST] Internal error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save course' },
      { status: 500 }
    );
  }
}
