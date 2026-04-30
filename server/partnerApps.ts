import { partnerBackendRefs, partnerMutation, partnerQuery } from "@/server/partnerBackendRefs";

export type PartnerAppStatus = "draft" | "pending_review" | "active" | "rejected" | "suspended";
export type PartnerAppClientType = "public" | "confidential";

export type PartnerAppSummary = {
  id: string;
  clientId: string;
  name: string;
  publisherName: string;
  iconUrl?: string | null;
  logoUrl?: string | null;
  clientType: PartnerAppClientType;
  status: PartnerAppStatus;
  redirectUris: string[];
  allowedScopes: string[];
  authorizationExpiresAfterDays: number;
  reviewNotes?: string | null;
  submittedAt?: number | null;
  reviewedAt?: number | null;
  createdAt: number;
  updatedAt: number;
};

export const partnerAppsRepository = {
  async list(token: string) {
    return partnerQuery<PartnerAppSummary[]>(token, partnerBackendRefs.partnerApps.listPartnerApps);
  },

  async getById(token: string, appId: string) {
    const apps = await this.list(token);
    return apps.find((app) => app.id === appId || app.clientId === appId) ?? null;
  },

  async create(
    token: string,
    input: {
      name: string;
      publisherName: string;
      iconUrl?: string;
      logoUrl?: string;
      clientType: PartnerAppClientType;
      redirectUris: string[];
      allowedScopes: string[];
    },
  ) {
    return partnerMutation<{
      appId: string;
      clientId: string;
      clientSecret?: string;
    }>(token, partnerBackendRefs.partnerApps.createPartnerApp, input);
  },

  async update(
    token: string,
    input: {
      appId: string;
      name: string;
      publisherName: string;
      iconUrl?: string;
      logoUrl?: string;
      redirectUris: string[];
      allowedScopes: string[];
    },
  ) {
    await partnerMutation<{ ok: true }>(token, partnerBackendRefs.partnerApps.updatePartnerApp, input);
  },

  async submitForReview(token: string, appId: string) {
    await partnerMutation<{ ok: true }>(token, partnerBackendRefs.partnerApps.submitPartnerAppForReview, { appId });
  },
};
