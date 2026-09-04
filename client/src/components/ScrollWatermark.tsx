import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { assets } from "@/data/artistData";

/**
 * Decorative P34nuts watermark motion inspired by scroll-led editorial sites.
 * The graphic remains non-interactive and never carries essential content.
 */
export function ScrollFollowWatermark() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["-8vh", "8vh"]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-5, 9]);

  return (
    <motion.div
      className="scroll-follow-watermark"
      aria-hidden="true"
      style={reduceMotion ? undefined : { y, rotate }}
    >
      <img src={assets.mark} alt="" />
    </motion.div>
  );
}

export function ScrollWatermarkInterlude() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const markY = useTransform(scrollYProgress, [0, 1], ["-2.5rem", "2.5rem"]);
  const markRotate = useTransform(scrollYProgress, [0, 1], [-22, 28]);
  const textX = useTransform(scrollYProgress, [0, 1], ["7%", "-19%"]);

  return (
    <section ref={sectionRef} className="scroll-watermark-interlude" aria-label="P34nuts visuelles Zwischenspiel">
      <div className="scroll-watermark-stage" aria-hidden="true">
        <motion.div className="scroll-watermark-word" style={reduceMotion ? undefined : { x: textX }}>
          P34NUTS&nbsp;—&nbsp;P34NUTS&nbsp;—&nbsp;P34NUTS&nbsp;—&nbsp;P34NUTS
        </motion.div>
        <motion.div className="scroll-watermark-disc" style={reduceMotion ? undefined : { y: markY, rotate: markRotate }}>
          <span className="scroll-watermark-orbit">P34NUTS / NO BOX / NO MASK / NO FILTER / </span>
          <img src={assets.mark} alt="" />
        </motion.div>
        <div className="scroll-watermark-caption">
          <span>02 / signal in motion</span>
          <span>scroll to rotate</span>
        </div>
      </div>
    </section>
  );
}
