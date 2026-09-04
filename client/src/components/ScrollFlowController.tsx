import { useReducedMotion } from "framer-motion";
import { useEffect } from "react";

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

/**
 * Connects the actual homepage sections to a lightweight scroll timeline.
 * No extra visual layer is rendered; each section receives CSS variables so
 * its own surface can flow into the next one.
 */
export function ScrollFlowController() {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;

    const main = document.querySelector<HTMLElement>("#main-content");
    if (!main) return;

    const items = Array.from(
      main.querySelectorAll<HTMLElement>(":scope > section:not(.hero), :scope > .marquee"),
    );
    if (!items.length) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const viewport = window.innerHeight || 800;

      items.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const progress = clamp((viewport - rect.top) / (viewport + Math.max(rect.height, 1)));
        const center = rect.top + rect.height / 2;
        const focus = clamp(1 - Math.abs(center - viewport / 2) / (viewport * 0.92));
        const liftRem = (1 - progress) * 1.55;
        const scale = 0.982 + focus * 0.018;
        const edgeRem = (1 - focus) * 0.7;
        const edgeAlpha = 0.45 + focus * 0.55;
        const shadowAlpha = 0.08 + focus * 0.12;

        item.dataset.flowReady = "true";
        item.style.setProperty("--flow-progress", progress.toFixed(3));
        item.style.setProperty("--flow-focus", focus.toFixed(3));
        item.style.setProperty("--flow-lift", `${liftRem.toFixed(3)}rem`);
        item.style.setProperty("--flow-scale", scale.toFixed(4));
        item.style.setProperty("--flow-edge", `${edgeRem.toFixed(3)}rem`);
        item.style.setProperty("--flow-edge-alpha", edgeAlpha.toFixed(3));
        item.style.setProperty("--flow-shadow-alpha", shadowAlpha.toFixed(3));
      });
    };

    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
      items.forEach((item) => {
        delete item.dataset.flowReady;
        ["--flow-progress", "--flow-focus", "--flow-lift", "--flow-scale", "--flow-edge", "--flow-edge-alpha", "--flow-shadow-alpha"].forEach((property) => item.style.removeProperty(property));
      });
    };
  }, [reduceMotion]);

  return null;
}
