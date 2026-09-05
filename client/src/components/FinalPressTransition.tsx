import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type FinalPressTransitionProps = {
  mark: string;
  newspaper: string;
  newspaperSecondary: string;
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/**
 * A dedicated final hand-off from the dark FAQ surface into the press area:
 * one curved light sheet rises over the outgoing scene and a repeated PRESS KIT
 * line takes over. The composition is original to P34nuts.
 */
export function FinalPressTransition({ mark, newspaper, newspaperSecondary }: FinalPressTransitionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const kickerRef = useRef<HTMLParagraphElement>(null);
  const reduceMotion = useReducedMotion();
  const [newspapersLaunched, setNewspapersLaunched] = useState(false);

  useEffect(() => {
    const kicker = kickerRef.current;
    if (!kicker) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= .5) {
        setNewspapersLaunched(true);
        observer.disconnect();
      }
    }, { threshold: [.5] });
    observer.observe(kicker);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduceMotion) return;

    const section = sectionRef.current;
    if (!section) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const viewport = window.innerHeight || 800;
      const progress = clamp((viewport - rect.top) / (viewport + rect.height));
      const mobile = window.matchMedia("(max-width: 820px)").matches;
      const revealY = (1 - progress) * (mobile ? 70 : 82) - (mobile ? 4 : 8);
      const wordShift = (progress - .5) * (mobile ? 28 : 42);
      const markRotate = (progress - .5) * (mobile ? 72 : 130);
      const markScale = .78 + progress * .38;

      section.dataset.finalPressReady = "true";
      section.style.setProperty("--final-press-progress", progress.toFixed(3));
      section.style.setProperty("--final-press-reveal-y", `${revealY.toFixed(3)}%`);
      section.style.setProperty("--final-press-word-shift", `${wordShift.toFixed(3)}vw`);
      section.style.setProperty("--final-press-mark-rotate", `${markRotate.toFixed(3)}deg`);
      section.style.setProperty("--final-press-mark-scale", markScale.toFixed(3));
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
      delete section.dataset.finalPressReady;
      ["--final-press-progress", "--final-press-reveal-y", "--final-press-word-shift", "--final-press-mark-rotate", "--final-press-mark-scale", "--final-press-newspaper-x", "--final-press-newspaper-y", "--final-press-newspaper-rotate", "--final-press-newspaper-scale"].forEach((property) => section.style.removeProperty(property));
    };
  }, [reduceMotion]);

  return (
    <section ref={sectionRef} className={`final-press-transition${newspapersLaunched ? " is-newspapers-launched" : ""}`} aria-label="Übergang von Ask P34nuts zum Press Kit">
      <div className="final-press-transition__sticky">
        <div className="final-press-transition__source" aria-hidden="true">
          <span>ASK</span>
          <em>P34NUTS.</em>
        </div>
        <div className="final-press-transition__reveal">
          <p ref={kickerRef} className="final-press-transition__kicker">final frame / press archive</p>
          <div className="final-press-transition__ticker" aria-hidden="true">
            <span>PRESS KIT — PRESS KIT — PRESS KIT — PRESS KIT —</span>
            <em>PRESS KIT — PRESS KIT — PRESS KIT — PRESS KIT —</em>
          </div>
          <img className="final-press-transition__mark" src={mark} alt="" aria-hidden="true" />
          {newspapersLaunched ? (
            <>
              <img className="final-press-transition__newspaper final-press-transition__newspaper--primary" src={newspaper} alt="P34nuts in der Morgenpost – Press-Archiv" loading="lazy" />
              <img className="final-press-transition__newspaper final-press-transition__newspaper--secondary" src={newspaperSecondary} alt="P34nuts in der Berliner Zeitung – Press-Archiv" loading="lazy" />
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
