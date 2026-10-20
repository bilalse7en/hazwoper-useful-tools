'use client';

import dynamic from 'next/dynamic';
import BackgroundSpace from '@/components/background-space';

const GdprConsent = dynamic(() => import('@/components/gdpr-consent'), {
  ssr: false,
});

const EnvironmentalSetup = dynamic(
  () => import('@/components/environmental-setup'),
  { ssr: false }
);

const FloatingChatbot = dynamic(() => import('@/components/floating-chatbot'), {
  ssr: false,
});

const BlockedOverlay = dynamic(
  () => import('@/components/chat/BlockedOverlay'),
  { ssr: false }
);

const InquiryReplyNotifier = dynamic(
  () => import('@/components/inquiry-reply-notifier'),
  { ssr: false }
);

const AdBlockDetector = dynamic(() => import('@/components/adblock-detector'), {
  ssr: false,
});

export function ClientOverlays() {
  return (
    <>
      <BackgroundSpace />
      <GdprConsent />
      <EnvironmentalSetup />
      <FloatingChatbot />
      <BlockedOverlay />
      <InquiryReplyNotifier />
      <AdBlockDetector />
    </>
  );
}
