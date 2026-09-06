import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

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
      const progress = Math.min(1, Math.max(0, (viewport * .9 - rect.top) / (rect.height + viewport * .35)));
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
      <div className="discovery-signal-art">
        <img className="discovery-signal-portrait" src="/uploads/page-images/file_00000000be888210b57e616cbd7e4ca0.png" alt="" loading="lazy" decoding="async" />
        <img className="discovery-smoke-art" src="/uploads/page-images/file_00000000afa88210a10761beb4abd568.png" alt="" loading="lazy" decoding="async" />
      </div>
      <span className="discovery-signal-caption">SIX WAYS IN / ONE SIGNAL</span>
    </div>
  );
}
