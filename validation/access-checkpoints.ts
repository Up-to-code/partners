import { z } from "zod/v4";

export const COMMON_PERMISSION_GROUPS = [
  {
    id: "identity",
    title: "Identity",
    description: "Read basic organization and user identity after consent.",
    scopes: [
      { value: "openid", label: "OpenID identity" },
      { value: "profile", label: "Profile claims" },
      { value: "email", label: "Email claim" },
    ],
  },
  {
    id: "workspace",
    title: "Workspace data",
    description: "Access organization records required by the app workflow.",
    scopes: [
      { value: "clients:read_own", label: "Read authorized clients" },
      { value: "properties:read_own", label: "Read authorized properties" },
      { value: "organization:read_own", label: "Read organization settings" },
    ],
  },
  {
    id: "offline",
    title: "Token behavior",
    description: "Request refresh capability only when the app truly needs background access.",
    scopes: [
      { value: "offline_access", label: "Offline access" },
    ],
  },
] as const;

const scopePattern = /^[a-z][a-z0-9:_-]*$/u;

export function parseManualScopes(value: string) {
  return value
    .split(/[\n, ]+/u)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function mergeCheckpointScopes(selectedScopes: string[], manualScopes: string) {
  return [...new Set([...selectedScopes, ...parseManualScopes(manualScopes)])].sort();
}

export const accessCheckpointScopesSchema = z
  .array(z.string().regex(scopePattern, "Use lowercase scope names like clients:read_own."))
  .min(1, "Select at least one permission checkpoint.");
