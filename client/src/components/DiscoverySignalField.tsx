import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const smokePaths = [
  "M500 240 C470 330 190 390 90 820",
  "M500 240 C480 350 330 430 245 820",
  "M500 240 C495 360 445 485 400 820",
  "M500 240 C510 360 555 485 560 820",
  "M500 240 C530 350 680 430 720 820",
  "M500 240 C540 330 830 390 900 820",
] as const;

export function DiscoverySignalField() {
  const reduceMotion = useReducedMotion();
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    if (reduceMotion) {
      field.style.setProperty("--smoke-progress", "1");
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = field.getBoundingClientRect();
      const viewport = window.innerHeight || 800;
      const progress = Math.min(1, Math.max(0, (viewport * .88 - rect.top) / (rect.height + viewport * .35)));
      field.style.setProperty("--smoke-progress", progress.toFixed(3));
    };
    const requestUpdate = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [reduceMotion]);

  return (
    <div ref={fieldRef} className="discovery-signal-field" aria-hidden="true">
      <div className="discovery-signal-portrait"><img src="/uploads/page-images/file_00000000dc3481f483d76133fa226760.png" alt="" loading="lazy" decoding="async" /></div>
      <svg className="discovery-smoke-map" viewBox="0 0 1000 900" preserveAspectRatio="none">
        {smokePaths.map((path, index) => <path key={path} className={`discovery-smoke-path discovery-smoke-path--${index + 1}`} d={path} pathLength="1" />)}
      </svg>
      <span className="discovery-signal-caption">SIX WAYS IN / ONE SIGNAL</span>
    </div>
  );
}
