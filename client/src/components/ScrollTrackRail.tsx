import { useReducedMotion } from "framer-motion";
import { type FocusEvent, useEffect, useRef } from "react";
import { Link } from "wouter";
import { type Track } from "@/data/artistData";
import { TrackDialog } from "@/components/TrackDialog";

type ScrollTrackRailProps = {
  tracks: readonly Track[];
  onListenRequest: (track: Track) => void;
};

function TrackCloneLink({ track, position }: { track: Track; position: "before" | "after" }) {
  return (
    <Link
      href={`/music/${track.slug}`}
      className={`release-tile ${track.coverStyle} scroll-track-card scroll-track-clone`}
      tabIndex={-1}
      aria-hidden="true"
      data-clone-position={position}
    >
      {track.cover ? <img src={track.cover} alt="" className="release-tile-image" loading="lazy" /> : <span className="release-generated-art" aria-hidden="true" />}
      <span className="tile-number">{track.id}</span>
      <span className="tile-state">ARCHIVE / 23</span>
      <span className="tile-title">{track.title}</span>
      <span className="tile-mood">{track.mood}</span>
    </Link>
  );
}

/**
 * An endless visual archive strip. Scroll down accelerates it to the left,
 * scroll up accelerates it to the right, then a slow directional drift remains.
 * The middle sequence is fully keyboard accessible; surrounding link copies
 * provide a seamless visible loop and remain clickable with pointer input.
 */
export function ScrollTrackRail({ tracks, onListenRequest }: ScrollTrackRailProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;

    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track || !tracks.length) return;

    let animationFrame = 0;
    let lastTimestamp = performance.now();
    let lastScrollY = window.scrollY;
    let loopWidth = 0;
    let offset = 0;
    let direction: -1 | 1 = -1;
    let boost = 0;
    let active = false;
    let keyboardPause = false;

    const measure = () => {
      loopWidth = track.scrollWidth / 3;
      if (!loopWidth) return;
      offset = -loopWidth;
      track.style.transform = `translate3d(${offset.toFixed(2)}px, 0, 0)`;
    };

    const wrapOffset = () => {
      if (!loopWidth) return;
      while (offset <= -loopWidth * 2) offset += loopWidth;
      while (offset >= 0) offset -= loopWidth;
    };

    const animate = (timestamp: number) => {
      const deltaSeconds = Math.min((timestamp - lastTimestamp) / 1000, .05);
      lastTimestamp = timestamp;

      if (active && !keyboardPause && loopWidth) {
        const idleSpeed = window.matchMedia("(max-width: 820px)").matches ? 13 : 18;
        offset += direction * (idleSpeed + boost) * deltaSeconds;
        boost *= Math.pow(.08, deltaSeconds);
        if (boost < .2) boost = 0;
        wrapOffset();
        track.style.transform = `translate3d(${offset.toFixed(2)}px, 0, 0)`;
      }

      animationFrame = window.requestAnimationFrame(animate);
    };

    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY;
      lastScrollY = currentY;
      if (!delta) return;

      direction = delta > 0 ? -1 : 1;
      boost = Math.min(950, boost + Math.abs(delta) * 18);
      section.dataset.trackDirection = direction < 0 ? "left" : "right";
    };

    const onResize = () => measure();
    const observer = new IntersectionObserver(
      ([entry]) => { active = entry.isIntersecting; },
      { rootMargin: "35% 0px 35% 0px" },
    );

    const onFocusIn = () => {
      keyboardPause = true;
      const focusedOffset = Number(track.dataset.focusOffset);
      if (Number.isFinite(focusedOffset)) {
        offset = focusedOffset;
        wrapOffset();
      }
    };
    const onFocusOut = () => { keyboardPause = false; lastTimestamp = performance.now(); };

    measure();
    section.dataset.trackRailReady = "true";
    section.dataset.trackDirection = "left";
    observer.observe(section);
    track.addEventListener("focusin", onFocusIn);
    track.addEventListener("focusout", onFocusOut);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      observer.disconnect();
      track.removeEventListener("focusin", onFocusIn);
      track.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.cancelAnimationFrame(animationFrame);
      delete section.dataset.trackRailReady;
      delete section.dataset.trackDirection;
      delete track.dataset.focusOffset;
      track.style.removeProperty("transform");
    };
  }, [reduceMotion, tracks.length]);

  const revealFocusedTrack = (event: FocusEvent<HTMLElement>) => {
    const viewport = windowRef.current;
    const track = trackRef.current;
    const card = (event.target as HTMLElement).closest<HTMLElement>(".scroll-track-card");
    if (!viewport || !track || !card) return;

    const targetOffset = Math.min(
      Math.max(card.offsetLeft - (viewport.clientWidth - card.clientWidth) / 2, 0),
      Math.max(track.scrollWidth - viewport.clientWidth, 0),
    );

    if (reduceMotion) {
      viewport.scrollTo({ left: targetOffset, behavior: "auto" });
      return;
    }

    const focusedOffset = -targetOffset;
    track.dataset.focusOffset = focusedOffset.toFixed(2);
    track.style.transform = `translate3d(${focusedOffset.toFixed(2)}px, 0, 0)`;
  };

  return (
    <section ref={sectionRef} className="scroll-track-rail-section" aria-labelledby="music-title">
      <div ref={windowRef} className="scroll-track-rail-window" role="region" aria-label="23 anklickbare Trackkader in einer richtungsabhängigen Endlosbewegung">
        <div ref={trackRef} className="scroll-track-rail" onFocusCapture={revealFocusedTrack}>
          <div className="scroll-track-rail-segment" aria-hidden="true">
            {tracks.map((track) => <TrackCloneLink key={`before-${track.id}`} track={track} position="before" />)}
          </div>
          <div className="scroll-track-rail-segment scroll-track-rail-segment--interactive">
            {tracks.map((track) => (
              <TrackDialog
                key={track.id}
                track={track}
                onListenRequest={onListenRequest}
                triggerClassName="scroll-track-card"
              />
            ))}
          </div>
          <div className="scroll-track-rail-segment" aria-hidden="true">
            {tracks.map((track) => <TrackCloneLink key={`after-${track.id}`} track={track} position="after" />)}
          </div>
        </div>
      </div>
      <p className="scroll-track-rail-note"><span>SCROLL DOWN</span> → faster left <i>·</i> <span>SCROLL UP</span> → faster right <i>·</i> idle keeps the last direction</p>
    </section>
  );
}
