import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { assertPartnerAppEditable, auditPartnerEvent, ensurePartnerProfile, randomToken, requirePartnerIdentity } from "./partnerRuntime";
import { partnerAppClientTypeValidator } from "./schema";
import { assertPartnerOwnsApp, normalizeRedirectUris, normalizeScopes } from "./partnerAppPolicies";

const DEFAULT_AUTHORIZATION_EXPIRY_DAYS = 50;

async function requireOwnedApp(ctx: any, appId: string, authSubject: string) {
  const normalizedId = ctx.db.normalizeId("partnerApps", appId);
  const app = normalizedId ? await ctx.db.get(normalizedId) : null;
  assertPartnerOwnsApp(app, authSubject);
  return app;
}

export const createPartnerApp = mutationGeneric({
  args: {
    name: v.string(),
    publisherName: v.string(),
    iconUrl: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    clientType: partnerAppClientTypeValidator,
    redirectUris: v.array(v.string()),
    allowedScopes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const { identity } = await ensurePartnerProfile(ctx, now);
    const partnerOrganization = await ctx.db
      .query("partnerOrganizations")
      .withIndex("by_ownerAuthSubject", (q: any) => q.eq("ownerAuthSubject", identity.subject))
      .first();
    const clientId = randomToken("partners_client", 18);
    const clientSecret = args.clientType === "confidential" ? randomToken("partners_secret", 32) : undefined;
    const appId = await ctx.db.insert("partnerApps", {
      partnerAuthSubject: identity.subject,
      partnerOrganizationId: partnerOrganization?._id,
      clientId,
      clientSecretHash: clientSecret,
      name: args.name.trim(),
      publisherName: args.publisherName.trim(),
      iconUrl: args.iconUrl?.trim() || undefined,
      logoUrl: args.logoUrl?.trim() || undefined,
      clientType: args.clientType,
      redirectUris: normalizeRedirectUris(args.redirectUris),
      allowedScopes: normalizeScopes(args.allowedScopes),
      status: "draft",
      authorizationExpiresAfterDays: DEFAULT_AUTHORIZATION_EXPIRY_DAYS,
      createdAt: now,
      updatedAt: now,
    });
    await auditPartnerEvent(ctx, {
      actorAuthSubject: identity.subject,
      appId,
      eventType: "partner_app.created",
      payload: { clientId, clientType: args.clientType },
      now,
    });
    return { appId, clientId, clientSecret };
  },
});

export const listPartnerApps = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const identity = await requirePartnerIdentity(ctx);
    const apps = await ctx.db
      .query("partnerApps")
      .withIndex("by_partnerAuthSubject", (q: any) => q.eq("partnerAuthSubject", identity.subject))
      .collect();
    return apps
      .map((app: any) => ({
        id: app._id,
        clientId: app.clientId,
        name: app.name,
        publisherName: app.publisherName,
        iconUrl: app.iconUrl ?? app.logoUrl ?? null,
        logoUrl: app.logoUrl ?? null,
        clientType: app.clientType,
        status: app.status,
        redirectUris: app.redirectUris,
        allowedScopes: app.allowedScopes,
        authorizationExpiresAfterDays: app.authorizationExpiresAfterDays,
        reviewNotes: app.reviewNotes ?? null,
        submittedAt: app.submittedAt ?? null,
        reviewedAt: app.reviewedAt ?? null,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
      }))
      .sort((left: any, right: any) => right.updatedAt - left.updatedAt);
  },
});

export const updatePartnerApp = mutationGeneric({
  args: {
    appId: v.string(),
    name: v.string(),
    publisherName: v.string(),
    iconUrl: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    redirectUris: v.array(v.string()),
    allowedScopes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const { identity } = await ensurePartnerProfile(ctx, now);
    const app = await requireOwnedApp(ctx, args.appId, identity.subject);
    assertPartnerAppEditable(app.status);
    await ctx.db.patch(app._id, {
      name: args.name.trim(),
      publisherName: args.publisherName.trim(),
      iconUrl: args.iconUrl?.trim() || undefined,
      logoUrl: args.logoUrl?.trim() || undefined,
      redirectUris: normalizeRedirectUris(args.redirectUris),
      allowedScopes: normalizeScopes(args.allowedScopes),
      status: app.status === "rejected" ? "draft" : app.status,
      reviewNotes: undefined,
      updatedAt: now,
    });
    await auditPartnerEvent(ctx, { actorAuthSubject: identity.subject, appId: app._id, eventType: "partner_app.updated", now });
    return { ok: true };
  },
});

export const submitPartnerAppForReview = mutationGeneric({
  args: { appId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const { identity } = await ensurePartnerProfile(ctx, now);
    const app = await requireOwnedApp(ctx, args.appId, identity.subject);
    assertPartnerAppEditable(app.status);
    await ctx.db.patch(app._id, {
      status: "pending_review",
      submittedAt: now,
      reviewNotes: undefined,
      updatedAt: now,
    });
    await ctx.db.insert("partnerAppReviews", {
      appId: app._id,
      status: "pending_review",
      createdAt: now,
    });
    await auditPartnerEvent(ctx, { actorAuthSubject: identity.subject, appId: app._id, eventType: "partner_app.submitted", now });
    return { ok: true };
  },
});
