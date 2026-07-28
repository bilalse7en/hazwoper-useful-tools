import { ContactPageClient } from '@/components/contact-page-client';

export const metadata = {
  title: 'Contact Content Suite | Technical Support & Inquiries',
  description:
    'Contact the Content Suite technical team. Have questions about HAZWOPER compliance, tool integration, or custom safety documentation generators? We look forward to helping you.',
  keywords:
    'contact safety tech, HAZWOPER help, safety training support, compliance documentation contact, business inquiries',
  alternates: {
    canonical: 'https://hazwoper-useful-tools.vercel.app/contact',
  },
};

export default function ContactPage() {
  return <ContactPageClient />;
}
