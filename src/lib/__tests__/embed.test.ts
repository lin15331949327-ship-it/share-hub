import { describe, it, expect } from "vitest";
import { parseVideoLink } from "../embed";

describe("parseVideoLink", () => {
  it("parses B站 video URL", () => {
    const r = parseVideoLink("https://www.bilibili.com/video/BV1xx411c7mD/");
    expect(r).not.toBeNull();
    expect(r!.kind).toBe("iframe");
    expect(r!.html).toContain("bvid=BV1xx411c7mD");
  });

  it("parses YouTube watch URL", () => {
    const r = parseVideoLink("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(r).not.toBeNull();
    expect(r!.kind).toBe("iframe");
    expect(r!.html).toContain("dQw4w9WgXcQ");
  });

  it("parses YouTube short URL", () => {
    const r = parseVideoLink("https://youtu.be/dQw4w9WgXcQ");
    expect(r).not.toBeNull();
    expect(r!.kind).toBe("iframe");
    expect(r!.html).toContain("dQw4w9WgXcQ");
  });

  it("detects direct MP4 links", () => {
    const r = parseVideoLink("https://example.com/video.mp4");
    expect(r).not.toBeNull();
    expect(r!.kind).toBe("video");
    expect(r!.html).toContain("<video");
  });

  it("falls back to link for unknown URLs", () => {
    const r = parseVideoLink("https://example.com/video.mkv");
    expect(r).not.toBeNull();
    expect(r!.kind).toBe("link");
  });
});
