'use client';

import dynamic from 'next/dynamic';

const BackgroundSpace = dynamic(
  () =>
    import('@/components/background-space').then((mod) => mod.BackgroundSpace),
  { ssr: false }
);

const GdprConsent = dynamic(
  () => import('@/components/gdpr-consent').then((mod) => mod.GdprConsent),
  { ssr: false }
);

const EnvironmentalSetup = dynamic(
  () =>
    import('@/components/environmental-setup').then(
      (mod) => mod.EnvironmentalSetup
    ),
  { ssr: false }
);

const FloatingChatbot = dynamic(
  () =>
    import('@/components/floating-chatbot').then((mod) => mod.FloatingChatbot),
  { ssr: false }
);

const BlockedOverlay = dynamic(
  () =>
    import('@/components/chat/BlockedOverlay').then(
      (mod) => mod.BlockedOverlay
    ),
  { ssr: false }
);

export function ClientOverlays() {
  return (
    <>
      <BackgroundSpace />
      <GdprConsent />
      <EnvironmentalSetup />
      <FloatingChatbot />
      <BlockedOverlay />
    </>
  );
}
