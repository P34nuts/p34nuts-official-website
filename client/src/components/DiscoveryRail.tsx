/** NOIR CUT FINAL AUDIT — A fast, non-generic entry point for listeners who do not know P34nuts yet. */
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Link } from "wouter";
import { HomeShopConversion } from "@/components/HomeShopConversion";
import {
  DISCOVERY_ROTATION_INTERVAL_MS,
  discoveryPaths,
  getRotatingDiscoveryPaths,
  getTrackBySlug,
} from "@/data/artistData";

const smokePaths = [
  "M500 240 C470 330 190 390 90 820",
  "M500 240 C480 350 330 430 245 820",
  "M500 240 C495 360 445 485 400 820",
  "M500 240 C510 360 555 485 560 820",
  "M500 240 C530 350 680 430 720 820",
  "M500 240 C540 330 830 390 900 820",
] as const;

export function DiscoveryRail() {
  const reduceMotion = useReducedMotion();
  const [paths, setPaths] = useState(() => discoveryPaths);
  const [flippingSlots, setFlippingSlots] = useState<number[]>([]);
  const [navigationLocked, setNavigationLocked] = useState(false);
  const pathsRef = useRef(paths);
  const flipTimeoutsRef = useRef<number[]>([]);
  const smokeFieldRef = useRef<HTMLDivElement>(null);

  const prepareTopNavigation = () => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  const handleDiscoveryClick = () => {
    prepareTopNavigation();
    setNavigationLocked(true);
  };

  useEffect(() => {
    pathsRef.current = paths;
  }, [paths]);

  useEffect(() => {
    if (navigationLocked) return;
    const clearFlipTimeouts = () => {
      flipTimeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout));
      flipTimeoutsRef.current = [];
    };

    const runRotation = () => {
      clearFlipTimeouts();
      const nextPaths = getRotatingDiscoveryPaths(pathsRef.current.map((path) => path.trackSlug));

      if (reduceMotion) {
        pathsRef.current = nextPaths;
        setPaths(nextPaths);
        return;
      }

      nextPaths.forEach((nextPath, index) => {
        const startTimeout = window.setTimeout(() => {
          setFlippingSlots((slots) => Array.from(new Set([...slots, index])));

          const swapTimeout = window.setTimeout(() => {
            setPaths((currentPaths) => {
              const updatedPaths = currentPaths.map((path, pathIndex) => pathIndex === index ? nextPath : path);
              pathsRef.current = updatedPaths;
              return updatedPaths;
            });
          }, 280);

          const finishTimeout = window.setTimeout(() => {
            setFlippingSlots((slots) => slots.filter((slot) => slot !== index));
          }, 560);

          flipTimeoutsRef.current.push(swapTimeout, finishTimeout);
        }, index * 500);

        flipTimeoutsRef.current.push(startTimeout);
      });
    };

    const interval = window.setInterval(runRotation, DISCOVERY_ROTATION_INTERVAL_MS);
    return () => {
      window.clearInterval(interval);
      clearFlipTimeouts();
    };
  }, [navigationLocked, reduceMotion]);

  useEffect(() => {
    const field = smokeFieldRef.current;
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
    <>
      <section id="start-here" className="discovery-section" aria-labelledby="discovery-title">
        <div className="section-wrap">
          <div className="discovery-heading"><p className="eyebrow">Start here / new listener guide</p><h2 id="discovery-title">FIND YOUR<br /><em>ENTRY.</em></h2><p>Kein Kontext nötig. Such dir einen Einstieg nach Stimmung aus – der Rest folgt im Archiv.</p></div>
          <div ref={smokeFieldRef} className="discovery-signal-field" aria-hidden="true">
            <div className="discovery-signal-portrait"><img src="/uploads/page-images/file_00000000dc3481f483d76133fa226760.png" alt="" loading="lazy" decoding="async" /></div>
            <svg className="discovery-smoke-map" viewBox="0 0 1000 900" preserveAspectRatio="none">
              {smokePaths.map((path, index) => <path key={path} className={`discovery-smoke-path discovery-smoke-path--${index + 1}`} d={path} pathLength="1" />)}
            </svg>
            <span className="discovery-signal-caption">SIX WAYS IN / ONE SIGNAL</span>
          </div>
          <div className="discovery-grid">
            {paths.map((path, index) => {
              const track = getTrackBySlug(path.trackSlug);
              if (!track) return null;
              const isFlipping = flippingSlots.includes(index);
              return <Link key={index} href={`/music/${track.slug}`} onClick={handleDiscoveryClick} className={`discovery-card discovery-card--cover ${isFlipping ? "discovery-card--flipping" : ""} ${track.coverStyle}`}><img className="discovery-card-cover" src={track.cover} alt="" loading="lazy" decoding="async" /><span>0{index + 1} / {path.label}</span><strong>{track.title}</strong><p>{path.title}</p><ArrowUpRight size={17} /></Link>;
            })}
          </div>
        </div>
      </section>
      <HomeShopConversion />
    </>
  );
}
