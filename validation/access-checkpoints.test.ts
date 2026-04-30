import { describe, expect, it } from "vitest";
import { mergeCheckpointScopes } from "./access-checkpoints";

describe("access checkpoints", () => {
  it("deduplicates selected and manual scopes into the existing allowedScopes payload", () => {
    expect(mergeCheckpointScopes(["properties:read_own", "clients:read_own"], "clients:read_own\noffline_access")).toEqual([
      "clients:read_own",
      "offline_access",
      "properties:read_own",
    ]);
  });
});
