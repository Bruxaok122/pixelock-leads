import { useEffect } from "react";

/**
 * Client-side anti-cloning / anti-download hardening.
 * Blocks the common "save page / copy source" paths used by site rippers.
 */
export function SiteProtection() {
  useEffect(() => {
    // Frame busting: stop the page from being embedded/mirrored in an iframe.
    try {
      if (window.top && window.top !== window.self) {
        window.top.location.replace(window.location.href);
      }
    } catch {
      document.documentElement.style.display = "none";
    }

    const isEditable = (el: EventTarget | null) => {
      const node = el as HTMLElement | null;
      if (!node || !node.tagName) return false;
      const tag = node.tagName.toUpperCase();
      return tag === "INPUT" || tag === "TEXTAREA" || node.isContentEditable;
    };

    const onContextMenu = (e: MouseEvent) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
    };

    const onSelectStart = (e: Event) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
    };

    const onDragStart = (e: DragEvent) => e.preventDefault();

    const onCopy = (e: ClipboardEvent) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;

      // DevTools / view-source / save page / print / select-all shortcuts
      if (e.key === "F12") return e.preventDefault();
      if (ctrl && e.shiftKey && ["i", "j", "c", "k", "e"].includes(key)) return e.preventDefault();
      if (ctrl && ["u", "s", "p"].includes(key)) return e.preventDefault();
      if (ctrl && key === "a" && !isEditable(e.target)) return e.preventDefault();
      if (ctrl && key === "c" && !isEditable(e.target)) return e.preventDefault();
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("selectstart", onSelectStart);
    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("copy", onCopy);
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("selectstart", onSelectStart);
      document.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, []);

  return null;
}
