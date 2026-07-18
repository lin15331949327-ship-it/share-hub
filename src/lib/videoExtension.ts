import { Node } from "@tiptap/core";

function guessType(src: string) {
  if (/\.mp4$/i.test(src)) return "video/mp4";
  if (/\.webm$/i.test(src)) return "video/webm";
  if (/\.ogg$/i.test(src)) return "video/ogg";
  return "video/mp4";
}

export const VideoExtension = Node.create({
  name: "video",
  group: "block",
  selectable: false,
  draggable: false,

  parseHTML() {
    return [{ tag: "video" }];
  },

  renderHTML({ HTMLAttributes }) {
    const src = HTMLAttributes.src as string;
    return [
      "video",
      { controls: "", preload: "metadata", playsinline: "", style: "width:100%;max-width:100%;border-radius:8px" },
      src ? ["source", { src, type: guessType(src) }] : ["p", "Video source not available"],
    ];
  },

  addAttributes() {
    return {
      src: { default: null },
    };
  },
});
