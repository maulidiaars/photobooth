"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants";

/** Kelola Foto is now part of the Dashboard's photo grid — this route
 *  just forwards anyone with an old bookmark/link there. */
export default function AdminPhotosRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace(ROUTES.adminDashboard);
  }, [router]);
  return null;
}
