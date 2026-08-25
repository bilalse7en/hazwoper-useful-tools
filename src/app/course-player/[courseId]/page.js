'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProfessionalCoursePlayerModal } from '@/components/professional-course-player-modal';
import { getCourseAsync } from '@/lib/course-storage';
import { Loader2 } from 'lucide-react';

export default function DynamicCoursePlayerPage() {
  const params = useParams();
  const router = useRouter();
  const rawCourseId = params?.courseId;

  const [courseData, setCourseData] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!rawCourseId) return;

    let isMounted = true;
    async function loadCourse() {
      // Asynchronously load course data by ID or slug (handles Memory, IndexedDB, Supabase DB)
      const loadedCourse =
        (await getCourseAsync(rawCourseId)) ||
        (await getCourseAsync(String(rawCourseId)));
      if (isMounted) {
        if (loadedCourse) {
          setCourseData(loadedCourse);
        }
        setIsLoaded(true);
      }
    }

    loadCourse();

    return () => {
      isMounted = false;
    };
  }, [rawCourseId]);

  const handleClose = () => {
    router.push('/dashboard');
  };

  if (!isLoaded) {
    return (
      <div className="w-screen h-screen bg-[#090d16] flex flex-col items-center justify-center space-y-4 text-amber-500">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <div className="text-center space-y-1">
          <p className="text-xs font-black uppercase tracking-widest text-slate-200">
            Initializing Professional LMS Course Player
          </p>
          <p className="text-[11px] text-slate-500 font-mono">
            Loading OSHA & HAZWOPER Accredited Content...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#090d16]">
      <ProfessionalCoursePlayerModal
        isOpen={true}
        onClose={handleClose}
        initialCourseData={courseData}
      />
    </div>
  );
}
