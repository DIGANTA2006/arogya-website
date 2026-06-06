"use client";

import { useEffect } from "react";

function findChatPanel() {
  const nodes = Array.from(document.querySelectorAll("div, section, aside"));

  const titleNode = nodes.find((node) => {
    const text = node.textContent || "";
    return text.includes("Clinic Help Bot") || text.includes("Basic appointment and service support");
  });

  if (!titleNode) {
    return null;
  }

  let current: HTMLElement | null = titleNode as HTMLElement;

  for (let i = 0; i < 8 && current; i += 1) {
    const rect = current.getBoundingClientRect();
    const style = window.getComputedStyle(current);

    if (
      style.position === "fixed" ||
      (rect.width >= 300 && rect.width <= 560 && rect.height >= 350)
    ) {
      return current;
    }

    current = current.parentElement;
  }

  return titleNode as HTMLElement;
}

function fixChatPanel() {
  const panel = findChatPanel();

  if (!panel) {
    return;
  }

  const isMobile = window.innerWidth <= 768;

  panel.style.position = "fixed";
  panel.style.top = isMobile ? "74px" : "92px";
  panel.style.right = isMobile ? "12px" : "24px";
  panel.style.left = isMobile ? "12px" : "auto";
  panel.style.bottom = "auto";
  panel.style.width = isMobile ? "auto" : "min(460px, calc(100vw - 48px))";
  panel.style.maxWidth = isMobile ? "none" : "calc(100vw - 48px)";
  panel.style.maxHeight = isMobile ? "calc(100dvh - 98px)" : "calc(100dvh - 116px)";
  panel.style.overflow = "hidden";
  panel.style.zIndex = "9998";
  panel.style.borderRadius = "24px";
}

export default function ChatPositionFix() {
  useEffect(() => {
    fixChatPanel();

    const interval = window.setInterval(fixChatPanel, 700);

    window.addEventListener("resize", fixChatPanel);
    window.addEventListener("scroll", fixChatPanel, { passive: true });

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("resize", fixChatPanel);
      window.removeEventListener("scroll", fixChatPanel);
    };
  }, []);

  return null;
}