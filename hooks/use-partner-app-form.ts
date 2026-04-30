"use client";

import { useMemo } from "react";
import type { PartnerAppSummary } from "@/server/partnerApps";

export function usePartnerAppForm(app?: PartnerAppSummary) {
  const initialScopes = useMemo(
    () => app?.allowedScopes ?? ["offline_access", "clients:read_own", "properties:read_own"],
    [app?.allowedScopes],
  );

  return {
    initialScopes,
    initialRedirectUris: app?.redirectUris ?? [],
  };
}
