import * as React from "react";
import { GuideForm } from "@/components/admin/guides/GuideForm";

export const dynamic = "force-dynamic";

export default function NewGuidePage() {
  return <GuideForm isNew />;
}
