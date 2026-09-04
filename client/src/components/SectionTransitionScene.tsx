import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

type SectionTransitionSceneProps = {
  index: string;
  eyebrow: string;
  firstWord: string;
  secondWord: string;
  image: string;
  tone: "light" | "red" | "dark";
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/**
 * A single controlled hand-off scene between major content groups.
 * It mirrors the compositional principle of the reference without copying
 * its media or navigation: typography stays as a stage while one P34nuts
 * image surface rounds upward into the next section.
 */
export function SectionTransitionScene({
  index,
  eyebrow,
  firstWord,
  secondWord,
  image,
  tone,
}: SectionTransitionSceneProps) {
  const reduceMotion = useReducedMotion();
  const sceneRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (reduceMotion) return;

    const scene = sceneRef.current;
    if (!scene) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      if (window.matchMedia("(max-width: 820px)").matches) {
        scene.removeAttribute("data-scene-ready");
        ["--scene-progress", "--scene-image-y", "--scene-word-shift", "--scene-mask-scale"].forEach((property) => scene.style.removeProperty(property));
        return;
      }

      const rect = scene.getBoundingClientRect();
      const viewport = window.innerHeight || 800;
      const progress = clamp((viewport - rect.top) / (viewport + rect.height));
      const imageY = (1 - progress) * 16 - 8;
      const wordShift = (progress - .5) * 11;
      const maskScale = .9 + progress * .18;

      scene.dataset.sceneReady = "true";
      scene.style.setProperty("--scene-progress", progress.toFixed(3));
      scene.style.setProperty("--scene-image-y", `${imageY.toFixed(3)}%`);
      scene.style.setProperty("--scene-word-shift", `${wordShift.toFixed(3)}vw`);
      scene.style.setProperty("--scene-mask-scale", maskScale.toFixed(3));
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
    };
  }, [reduceMotion]);

  return (
    <section ref={sceneRef} className={`section-transition-scene section-transition-scene--${tone}`} aria-label={eyebrow}>
      <div className="section-transition-scene__sticky">
        <p className="section-transition-scene__index">{index} / transition</p>
        <p className="section-transition-scene__eyebrow">{eyebrow}</p>
        <div className="section-transition-scene__words" aria-hidden="true">
          <span>{firstWord}</span>
          <em>{secondWord}</em>
        </div>
        <figure className="section-transition-scene__mask" aria-hidden="true">
          <img src={image} alt="" loading="lazy" />
        </figure>
      </div>
    </section>
  );
}
