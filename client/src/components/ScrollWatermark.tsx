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
  const y = useTransform(scrollYProgress, [0, 1], ["-4vh", "48vh"]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-10, 560]);
  const scale = useTransform(scrollYProgress, [0, 0.45, 1], [0.92, 1.08, 0.96]);

  return (
    <motion.div
      className="scroll-follow-watermark"
      aria-hidden="true"
      style={reduceMotion ? undefined : { y, rotate, scale }}
    >
      <img src={assets.mark} alt="" />
    </motion.div>
  );
}

/**
 * A low-contrast, page-wide editorial layer. It gives the homepage a
 * continuous scroll language without covering actionable content.
 */
export function ScrollEditorialField() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const wordX = useTransform(scrollYProgress, [0, 0.25, 0.55, 0.8, 1], ["-14vw", "6vw", "-10vw", "8vw", "-16vw"]);
  const wordY = useTransform(scrollYProgress, [0, 1], ["-3vh", "18vh"]);
  const leadX = useTransform(scrollYProgress, [0, 0.5, 1], ["-7vw", "11vw", "-5vw"]);
  const leadY = useTransform(scrollYProgress, [0, 1], ["-9vh", "19vh"]);
  const middleX = useTransform(scrollYProgress, [0, 1], ["7vw", "-10vw"]);
  const middleY = useTransform(scrollYProgress, [0, 1], ["14vh", "-15vh"]);
  const lastX = useTransform(scrollYProgress, [0, 1], ["-3vw", "10vw"]);

  return (
    <div className="scroll-editorial-field" aria-hidden="true">
      <motion.div className="scroll-editorial-word scroll-editorial-word--one" style={reduceMotion ? undefined : { x: wordX, y: wordY }}>
        P34NUTS&nbsp;&nbsp;P34NUTS&nbsp;&nbsp;P34NUTS
      </motion.div>
      <motion.div className="scroll-editorial-word scroll-editorial-word--two" style={reduceMotion ? undefined : { x: wordX, y: wordY }}>
        MUSIC&nbsp;&nbsp;VISUALS&nbsp;&nbsp;ARCHIVE
      </motion.div>
      <motion.img className="scroll-editorial-frame scroll-editorial-frame--lead" src={assets.editorial} alt="" style={reduceMotion ? undefined : { x: leadX, y: leadY }} />
      <motion.img className="scroll-editorial-frame scroll-editorial-frame--middle" src={assets.galleryNight} alt="" style={reduceMotion ? undefined : { x: middleX, y: middleY }} />
      <motion.img className="scroll-editorial-frame scroll-editorial-frame--last" src={assets.performance} alt="" style={reduceMotion ? undefined : { x: lastX }} />
    </div>
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

/**
 * A P34nuts-native editorial scroll composition: oversized type stays legible
 * while existing visual frames drift through it at different scroll speeds.
 */
export function ScrollTypeComposition() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const leadX = useTransform(scrollYProgress, [0, 1], ["-7vw", "8vw"]);
  const leadY = useTransform(scrollYProgress, [0, 1], ["3rem", "-4rem"]);
  const middleY = useTransform(scrollYProgress, [0, 1], ["-3rem", "4rem"]);
  const lastX = useTransform(scrollYProgress, [0, 1], ["6vw", "-8vw"]);

  return (
    <section ref={sectionRef} className="scroll-type-composition" aria-labelledby="scroll-type-title">
      <div className="scroll-type-stage">
        <div className="scroll-type-heading">
          <span>03 / visual archive</span>
          <span>frames move with the signal</span>
        </div>
        <h2 id="scroll-type-title" className="scroll-type-title" aria-label="P34nuts visual archive">
          <span>P34</span>
          <em>NUTS</em>
          <small>VISUAL ARCHIVE</small>
        </h2>
        <motion.figure className="scroll-type-frame scroll-type-frame--lead" style={reduceMotion ? undefined : { x: leadX, y: leadY }}>
          <img src={assets.editorial} alt="P34nuts in einer dunklen, editoriellen Studioaufnahme" loading="lazy" />
          <figcaption>01 / raw signal</figcaption>
        </motion.figure>
        <motion.figure className="scroll-type-frame scroll-type-frame--middle" style={reduceMotion ? undefined : { y: middleY }}>
          <img src={assets.galleryNight} alt="Nächtliche urbane P34nuts-Bildwelt" loading="lazy" />
          <figcaption>02 / night frame</figcaption>
        </motion.figure>
        <motion.figure className="scroll-type-frame scroll-type-frame--last" style={reduceMotion ? undefined : { x: lastX }}>
          <img src={assets.performance} alt="P34nuts-Performancebild auf einer Brücke" loading="lazy" />
          <figcaption>03 / live perspective</figcaption>
        </motion.figure>
        <p className="scroll-type-note">Jeder Frame verschiebt sich. Die Geschichte bleibt im Fokus.</p>
      </div>
    </section>
  );
}
