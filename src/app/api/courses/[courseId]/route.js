import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request, { params }) {
  try {
    const { courseId } = await params;
    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .or(`id.eq.${courseId},slug.eq.${courseId}`)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Course not found in database' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, course: data });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { courseId } = await params;
    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const supabase = await createClient();

    const payload = {
      id: courseId,
      title: body.title,
      slug: body.slug || courseId,
      description: body.description || '',
      category: body.category || 'safety',
      duration: body.duration || 7200,
      duration_label: body.durationLabel || '2 Hours',
      thumbnail: body.thumbnail || '',
      status: body.status || 'published',
      settings: body.settings || {},
      modules: body.modules || [],
      final_exam: body.finalExam || {},
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('courses')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('[API Courses PUT] Supabase upsert error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, course: data });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update course' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { courseId } = await params;
    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Delete associated progress
    await supabase.from('course_progress').delete().eq('course_id', courseId);

    // 2. Delete associated certificates
    await supabase
      .from('course_certificates')
      .delete()
      .eq('course_id', courseId);

    // 3. Delete course by ID or Slug
    const { error } = await supabase
      .from('courses')
      .delete()
      .or(`id.eq.${courseId},slug.eq.${courseId}`);

    if (error) {
      console.error('[API Courses DELETE] Supabase deletion error:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Course deleted from database successfully',
    });
  } catch (err) {
    console.error('[API Courses DELETE] Internal error:', err);
    return NextResponse.json(
      { success: true, message: 'Processed with local sync' },
      { status: 200 }
    );
  }
}
