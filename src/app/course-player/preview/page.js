'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProfessionalCoursePlayerModal } from '@/components/professional-course-player-modal';

export default function CoursePlayerPreviewPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    router.push('/tools/web-content');
  };

  return (
    <ProfessionalCoursePlayerModal isOpen={isOpen} onClose={handleClose} />
  );
}
