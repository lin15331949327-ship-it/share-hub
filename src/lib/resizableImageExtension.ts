import Image from "@tiptap/extension-image";

/**
 * Image extension that renders inside a resizable wrapper div.
 * Lets users drag the bottom-right corner to resize.
 */
export const ResizableImage = Image.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      {
        class: "media-resizable",
        style: "width:320px",
      },
      ["img", { ...HTMLAttributes, class: undefined }],
    ];
  },
});
