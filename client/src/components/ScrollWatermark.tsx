import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef } from "react";
import { assets } from "@/data/artistData";

/**
 * Decorative P34nuts watermark motion inspired by the user's Oreo reference.
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

export function ScrollWatermarkInterlude() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollY, scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const { scrollY: globalScrollY } = useScroll();
  const rotation = useMotionValue(0);
  const targetSpin = useRef(0.16);
  const lastScrollY = useRef<number | null>(null);
  const lastEventAt = useRef<number | null>(null);
  const textX = useTransform(scrollYProgress, [0, 1], ["7%", "-19%"]);
  const needleProgress = useSpring(useTransform(scrollYProgress, [0.06, 0.44, 0.82], [0, 1, 1]), {
    stiffness: 120,
    damping: 24,
    mass: 0.35,
  });
  const needleX = useTransform(needleProgress, [0, 1], ["18%", "58%"]);
  const needleY = useTransform(needleProgress, [0, 1], ["-25%", "1%"]);
  const needleRotate = useTransform(needleProgress, [0, 1], [-30, -7]);

  useMotionValueEvent(globalScrollY, "change", (latest) => {
    const now = performance.now();
    if (lastScrollY.current !== null && lastEventAt.current !== null) {
      const delta = latest - lastScrollY.current;
      const elapsed = Math.max(now - lastEventAt.current, 8);
      const velocity = delta / elapsed;
      const direction = velocity < 0 ? -1 : 1;
      const intensity = Math.min(Math.abs(velocity) * 0.95, 1.55);
      targetSpin.current = direction * Math.max(0.16, intensity);
    }
    lastScrollY.current = latest;
    lastEventAt.current = now;
  });

  useAnimationFrame((_, delta) => {
    if (reduceMotion) return;
    const frame = Math.min(delta, 40) / 16.67;
    const idle = targetSpin.current >= 0 ? 0.16 : -0.16;
    targetSpin.current += (idle - targetSpin.current) * Math.min(0.08 * frame, 0.22);
    rotation.set(rotation.get() + targetSpin.current * frame);
  });

  return (
    <section ref={sectionRef} className="scroll-watermark-interlude flow-section" aria-label="P34nuts Schallplatten-Zwischenspiel">
      <div className="scroll-watermark-stage">
        <motion.div className="scroll-watermark-word" aria-hidden="true" style={reduceMotion ? undefined : { x: textX }}>
          P34NUTS&nbsp;—&nbsp;P34NUTS&nbsp;—&nbsp;P34NUTS&nbsp;—&nbsp;P34NUTS
        </motion.div>
        <div className="scroll-turntable" aria-hidden="true">
          <div className="scroll-turntable-platter" />
          <motion.div className="scroll-watermark-disc" style={{ rotate: reduceMotion ? 0 : rotation }}>
            <span className="scroll-watermark-orbit">P34NUTS / NO BOX / NO MASK / NO FILTER / </span>
            <img src={assets.vinylRecord} alt="" />
          </motion.div>
          <motion.div
            className="scroll-turntable-tonearm"
            style={reduceMotion ? undefined : { x: needleX, y: needleY, rotate: needleRotate }}
          >
            <span className="scroll-turntable-pivot" />
            <span className="scroll-turntable-arm" />
            <span className="scroll-turntable-cartridge" />
            <span className="scroll-turntable-needle" />
          </motion.div>
        </div>
        <div className="scroll-watermark-caption">
          <span>02 / signal in motion</span>
          <span>scroll to rotate</span>
        </div>
      </div>
    </section>
  );
}
