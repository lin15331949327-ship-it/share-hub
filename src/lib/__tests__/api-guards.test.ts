import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { requireAuth } from "../api-guards";

// Mock getSession
const mockGetSession = vi.fn();
vi.mock("../auth", () => ({
  getSession: () => mockGetSession(),
}));

describe("requireAuth", () => {
  beforeEach(() => {
    mockGetSession.mockReset();
  });

  it("returns 401 when not logged in", async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await requireAuth();
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });

  it("returns session when logged in (no role required)", async () => {
    mockGetSession.mockResolvedValue({ role: "editor" });
    const result = await requireAuth();
    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as any).role).toBe("editor");
  });

  it("returns 403 when editor tries admin-only route", async () => {
    mockGetSession.mockResolvedValue({ role: "editor" });
    const result = await requireAuth("admin");
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(403);
  });

  it("allows admin to admin-only route", async () => {
    mockGetSession.mockResolvedValue({ role: "admin" });
    const result = await requireAuth("admin");
    expect(result).not.toBeInstanceOf(NextResponse);
  });
});
