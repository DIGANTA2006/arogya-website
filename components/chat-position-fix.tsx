"use client";

import { useEffect } from "react";

function findChatPanel() {
  const nodes = Array.from(document.querySelectorAll("div, section, aside"));

  const titleNode = nodes.find((node) => {
    const text = node.textContent || "";
    return (
      text.includes("Clinic Help Bot") ||
      text.includes("Basic appointment and service support")
    );
  });

  if (!titleNode) {
    return null;
  }

  let current: HTMLElement | null = titleNode as HTMLElement;

  for (let i = 0; i < 10 && current; i += 1) {
    const rect = current.getBoundingClientRect();
    const style = window.getComputedStyle(current);

    if (
      style.position === "fixed" ||
      (rect.width >= 300 && rect.width <= 620 && rect.height >= 320)
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

  panel.classList.add("arogya-chat-scroll-fixed");

  panel.style.position = "fixed";
  panel.style.top = isMobile ? "78px" : "88px";
  panel.style.right = isMobile ? "12px" : "24px";
  panel.style.left = isMobile ? "12px" : "auto";
  panel.style.bottom = "auto";
  panel.style.width = isMobile ? "auto" : "min(460px, calc(100vw - 48px))";
  panel.style.maxWidth = isMobile ? "none" : "calc(100vw - 48px)";
  panel.style.height = isMobile ? "calc(100dvh - 102px)" : "calc(100dvh - 112px)";
  panel.style.maxHeight = isMobile ? "calc(100dvh - 102px)" : "calc(100dvh - 112px)";
  panel.style.overflowY = "auto";
  panel.style.overflowX = "hidden";
  panel.style.zIndex = "9998";
  panel.style.borderRadius = "24px";
  panel.style.scrollBehavior = "smooth";

  const children = Array.from(panel.querySelectorAll("*")) as HTMLElement[];

  children.forEach((child) => {
    child.style.boxSizing = "border-box";
  });

  const scrollCandidates = children.filter((child) => {
    const text = child.textContent || "";
    return (
      text.includes("How can I book appointment?") ||
      text.includes("Ask a question") ||
      text.includes("This bot gives basic clinic information")
    );
  });

  scrollCandidates.forEach((child) => {
    child.style.flexShrink = "0";
  });
}

export default function ChatPositionFix() {
  useEffect(() => {
    fixChatPanel();

    const interval = window.setInterval(fixChatPanel, 500);

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