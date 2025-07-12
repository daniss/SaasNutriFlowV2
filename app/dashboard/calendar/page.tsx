"use client";

import { DashboardSkeleton } from "@/components/shared/skeletons";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CalendarRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the unified appointments page with month view
    router.replace("/dashboard/appointments?view=month");
  }, [router]);

  return <DashboardSkeleton />;
}
