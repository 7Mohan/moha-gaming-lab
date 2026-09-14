import * as React from "react";
import { notFound } from "next/navigation";
import { getGuideById, getGuideBySlug } from "@/lib/services/guide-service";
import { GuideForm } from "@/components/admin/guides/GuideForm";

export const dynamic = "force-dynamic";

interface GuideEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function GuideEditPage({ params }: GuideEditPageProps) {
  const { id } = await params;

  let guide = await getGuideById(id);
  if (!guide) {
    guide = await getGuideBySlug(id);
  }

  if (!guide) {
    notFound();
  }

  return <GuideForm initialData={guide} />;
}
