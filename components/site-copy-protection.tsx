"use client";

import { useEffect } from "react";

function isEditableTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;

  if (!element) {
    return false;
  }

  const tag = element.tagName?.toLowerCase();

  return (
    tag === "input" ||
    tag === "textarea" ||
    element.isContentEditable ||
    element.closest("input, textarea, [contenteditable='true']") !== null
  );
}

export default function SiteCopyProtection() {
  useEffect(() => {
    function blockContextMenu(event: MouseEvent) {
      if (!isEditableTarget(event.target)) {
        event.preventDefault();
      }
    }

    function blockCopy(event: ClipboardEvent) {
      if (!isEditableTarget(event.target)) {
        event.preventDefault();
      }
    }

    function blockDrag(event: DragEvent) {
      event.preventDefault();
    }

    function blockCommonShortcuts(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();

      const ctrlOrCmd = event.ctrlKey || event.metaKey;

      if (
        event.key === "F12" ||
        (ctrlOrCmd && ["u", "s", "p"].includes(key)) ||
        (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key))
      ) {
        event.preventDefault();
      }
    }

    document.addEventListener("contextmenu", blockContextMenu);
    document.addEventListener("copy", blockCopy);
    document.addEventListener("cut", blockCopy);
    document.addEventListener("dragstart", blockDrag);
    document.addEventListener("keydown", blockCommonShortcuts);

    return () => {
      document.removeEventListener("contextmenu", blockContextMenu);
      document.removeEventListener("copy", blockCopy);
      document.removeEventListener("cut", blockCopy);
      document.removeEventListener("dragstart", blockDrag);
      document.removeEventListener("keydown", blockCommonShortcuts);
    };
  }, []);

  return null;
}