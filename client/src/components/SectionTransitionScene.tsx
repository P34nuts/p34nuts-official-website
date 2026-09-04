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
const sceneProperties = [
  "--scene-progress",
  "--scene-image-y",
  "--scene-word-shift",
  "--scene-mask-scale",
  "--scene-image-scale",
  "--scene-image-shift",
  "--scene-mask-rotate",
  "--scene-mask-radius",
] as const;

/**
 * One controlled hand-off between major content groups. The large type remains
 * a stage while a rounded P34nuts image surface grows upward into the next
 * section. Mobile uses the same isolated scene with smaller amplitudes.
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
      const rect = scene.getBoundingClientRect();
      const viewport = window.innerHeight || 800;
      const progress = clamp((viewport - rect.top) / (viewport + rect.height));
      const mobile = window.matchMedia("(max-width: 820px)").matches;
      const imageY = (1 - progress) * (mobile ? 18 : 36) - (mobile ? 9 : 18);
      const wordShift = (progress - .5) * (mobile ? 11 : 24);
      const maskScale = (mobile ? .84 : .72) + progress * (mobile ? .32 : .52);
      const imageScale = (mobile ? 1.22 : 1.34) - progress * (mobile ? .1 : .18);
      const imageShift = (progress - .5) * (mobile ? 8 : 14);
      const maskRotate = (progress - .5) * (mobile ? 3.2 : 6);
      const maskRadius = (mobile ? 5.6 : 14.5) - progress * (mobile ? 2.3 : 7);

      scene.dataset.sceneReady = "true";
      scene.style.setProperty("--scene-progress", progress.toFixed(3));
      scene.style.setProperty("--scene-image-y", `${imageY.toFixed(3)}%`);
      scene.style.setProperty("--scene-word-shift", `${wordShift.toFixed(3)}vw`);
      scene.style.setProperty("--scene-mask-scale", maskScale.toFixed(3));
      scene.style.setProperty("--scene-image-scale", imageScale.toFixed(3));
      scene.style.setProperty("--scene-image-shift", `${imageShift.toFixed(3)}%`);
      scene.style.setProperty("--scene-mask-rotate", `${maskRotate.toFixed(3)}deg`);
      scene.style.setProperty("--scene-mask-radius", `${maskRadius.toFixed(3)}rem`);
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
      delete scene.dataset.sceneReady;
      sceneProperties.forEach((property) => scene.style.removeProperty(property));
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
