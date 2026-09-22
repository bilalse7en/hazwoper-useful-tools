import { redirect } from 'next/navigation';

export default async function ToolDetailsPage({ params }) {
  const { tool: toolSlug } = await params;
  redirect(`/tools/${toolSlug}`);
}
