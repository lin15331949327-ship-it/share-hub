/**
 * Parse a video URL and return embeddable HTML.
 * Supports B站 (bilibili), YouTube, and direct MP4 links.
 */

export type EmbedResult =
  | { kind: "iframe"; html: string }
  | { kind: "video"; html: string }
  | { kind: "link"; html: string };

export function parseVideoLink(url: string): EmbedResult | null {
  const biliMatch = url.match(/bilibili\.com\/video\/(BV\w+)/);
  if (biliMatch) {
    return {
      kind: "iframe",
      html: `<iframe src="https://player.bilibili.com/player.html?bvid=${biliMatch[1]}" style="width:100%;aspect-ratio:16/9;border:none;border-radius:8px" allowfullscreen></iframe>`,
    };
  }

  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) {
    return {
      kind: "iframe",
      html: `<iframe src="https://www.youtube.com/embed/${ytMatch[1]}" style="width:100%;aspect-ratio:16/9;border:none;border-radius:8px" allowfullscreen></iframe>`,
    };
  }

  if (/\.mp4$/i.test(url)) {
    return {
      kind: "video",
      html: `<video src="${url}" controls style="width:100%;max-width:100%;border-radius:8px"></video>`,
    };
  }

  return {
    kind: "link",
    html: `<p><a href="${url}">📺 查看视频</a></p>`,
  };
}
