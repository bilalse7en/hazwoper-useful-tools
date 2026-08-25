'use client';

import { useEffect } from 'react';

export default function CoursePlayerLayout({ children }) {
  // Hide the main site header and footer for immersive player experience
  useEffect(() => {
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    const mainWrapper = document.querySelector('.flex.flex-col.min-h-screen');

    if (header) header.style.display = 'none';
    if (footer) footer.style.display = 'none';
    if (mainWrapper) {
      mainWrapper.style.minHeight = '100vh';
      mainWrapper.style.overflow = 'hidden';
    }

    // Set body to not scroll
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';

    return () => {
      if (header) header.style.display = '';
      if (footer) footer.style.display = '';
      if (mainWrapper) {
        mainWrapper.style.minHeight = '';
        mainWrapper.style.overflow = '';
      }
      document.body.style.overflow = '';
      document.body.style.height = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background text-foreground flex flex-col font-sans overflow-hidden">
      {children}
    </div>
  );
}
