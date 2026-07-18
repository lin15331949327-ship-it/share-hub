import { Node } from "@tiptap/core";

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
    return ["video", {
      src: src || "",
      controls: "true",
      preload: "metadata",
      playsinline: "true",
      style: "width:100%;max-width:720px;border-radius:8px;display:block",
      onerror: "this.style.display='none'",
    }];
  },

  addAttributes() {
    return {
      src: { default: null },
    };
  },
});
