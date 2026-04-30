import { describe, expect, it } from "vitest";
import { getStatusTone } from "@/lib/navigation";
import { partnerAppFormSchema } from "./partner-app";

describe("partner portal schemas", () => {
  it("normalizes redirect URIs and scopes from textarea input", () => {
    const parsed = partnerAppFormSchema.parse({
      name: "Partner CRM",
      publisherName: "Acme",
      clientType: "public",
      redirectUris: "https://app.example.com/oauth/callback\nhttp://localhost:3000/callback",
      allowedScopes: "clients:read_own\nproperties:read_own",
    });

    expect(parsed.redirectUris).toEqual([
      "https://app.example.com/oauth/callback",
      "http://localhost:3000/callback",
    ]);
    expect(parsed.allowedScopes).toEqual(["clients:read_own", "properties:read_own"]);
  });

  it("rejects insecure redirect URIs and malformed scopes", () => {
    expect(() =>
      partnerAppFormSchema.parse({
        name: "P",
        publisherName: "A",
        clientType: "public",
        redirectUris: "http://evil.example/callback",
        allowedScopes: "Clients Read",
      }),
    ).toThrow();
  });

  it("maps all partner app status tones", () => {
    expect(getStatusTone("active")).toBe("success");
    expect(getStatusTone("pending_review")).toBe("warning");
    expect(getStatusTone("rejected")).toBe("danger");
    expect(getStatusTone("draft")).toBe("default");
  });
});
