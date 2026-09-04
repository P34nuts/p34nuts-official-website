import { useReducedMotion } from "framer-motion";
import { useEffect } from "react";

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const flowProperties = [
  "--flow-progress",
  "--flow-focus",
  "--flow-lift",
  "--flow-scale",
  "--flow-edge",
  "--flow-edge-alpha",
  "--flow-shadow-alpha",
  "--flow-content-lift",
  "--flow-radius",
  "--flow-lift-negative",
  "--flow-lift-mobile",
  "--flow-edge-negative",
  "--flow-edge-mobile",
  "--flow-content-lift-mobile",
] as const;

/**
 * Adds a restrained desktop-only scroll timeline to real homepage surfaces.
 * Mobile keeps the stable static section flow; the watermark is independent.
 */
export function ScrollFlowController() {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;

    const main = document.querySelector<HTMLElement>("#main-content");
    if (!main) return;

    const items = Array.from(
      main.querySelectorAll<HTMLElement>(":scope > section:not(.hero):not(.section-transition-scene):not(.scroll-track-rail-section), :scope > .marquee"),
    );
    if (!items.length) return;

    const resetItems = () => {
      items.forEach((item) => {
        delete item.dataset.flowReady;
        flowProperties.forEach((property) => item.style.removeProperty(property));
      });
    };

    let frame = 0;
    const update = () => {
      frame = 0;
      if (window.matchMedia("(max-width: 820px)").matches) {
        resetItems();
        return;
      }

      const viewport = window.innerHeight || 800;
      items.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const progress = clamp((viewport - rect.top) / (viewport + Math.max(rect.height, 1)));
        const center = rect.top + rect.height / 2;
        const focus = clamp(1 - Math.abs(center - viewport / 2) / (viewport * 0.92));
        const liftRem = (1 - progress) * 4.2;
        const scale = 0.94 + focus * 0.06;
        const edgeRem = (1 - focus) * 1.4;
        const edgeAlpha = 0.25 + focus * 0.75;
        const shadowAlpha = 0.08 + focus * 0.22;
        const contentLiftRem = (1 - focus) * 1.35;
        const radiusRem = 2.5 + focus * 3.5;

        item.dataset.flowReady = "true";
        item.style.setProperty("--flow-progress", progress.toFixed(3));
        item.style.setProperty("--flow-focus", focus.toFixed(3));
        item.style.setProperty("--flow-lift", `${liftRem.toFixed(3)}rem`);
        item.style.setProperty("--flow-scale", scale.toFixed(4));
        item.style.setProperty("--flow-edge", `${edgeRem.toFixed(3)}rem`);
        item.style.setProperty("--flow-edge-alpha", edgeAlpha.toFixed(3));
        item.style.setProperty("--flow-shadow-alpha", shadowAlpha.toFixed(3));
        item.style.setProperty("--flow-content-lift", `${contentLiftRem.toFixed(3)}rem`);
        item.style.setProperty("--flow-radius", `${radiusRem.toFixed(3)}rem`);
        item.style.setProperty("--flow-lift-negative", `${(-liftRem).toFixed(3)}rem`);
        item.style.setProperty("--flow-lift-mobile", `${(-liftRem * 0.38).toFixed(3)}rem`);
        item.style.setProperty("--flow-edge-negative", `${(-edgeRem).toFixed(3)}rem`);
        item.style.setProperty("--flow-edge-mobile", `${(-edgeRem * 0.65).toFixed(3)}rem`);
        item.style.setProperty("--flow-content-lift-mobile", `${(contentLiftRem * 0.35).toFixed(3)}rem`);
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
      resetItems();
    };
  }, [reduceMotion]);

  return null;
}
