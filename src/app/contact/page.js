import { ContactPageClient } from '@/components/contact-page-client';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Contact Support & Inquiries | All Useful Tools',
  description:
    'Contact the All Useful Tools technical team. Have questions about our tools, API integrations, or feedback? We look forward to helping you.',
  path: '/contact',
  keywords:
    'contact All Useful Tools, tool support, web tools help, PDF editor support, media converter questions, business inquiries',
});

export default function ContactPage() {
  return <ContactPageClient />;
}
