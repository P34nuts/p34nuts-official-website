import { useReducedMotion } from "framer-motion";
import { type FocusEvent, useEffect, useRef } from "react";
import { type Track } from "@/data/artistData";
import { TrackDialog } from "@/components/TrackDialog";

type ScrollTrackRailProps = {
  tracks: readonly Track[];
  onListenRequest: (track: Track) => void;
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/**
 * A single, fully interactive horizontal archive. The sticky scene maps its
 * vertical scroll progress to one horizontal transform: down moves the frames
 * right, up returns them left. No cloned decorative cards are used.
 */
export function ScrollTrackRail({ tracks, onListenRequest }: ScrollTrackRailProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;

    const section = sectionRef.current;
    const viewport = windowRef.current;
    const track = trackRef.current;
    if (!section || !viewport || !track || !tracks.length) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const screenHeight = window.innerHeight || 800;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(rect.height - screenHeight, 1);
      const progress = clamp(-rect.top / travel);
      const maxOffset = Math.max(track.scrollWidth - viewport.clientWidth + 2, 0);
      const offset = -maxOffset + progress * maxOffset;

      section.dataset.trackRailReady = "true";
      section.style.setProperty("--track-rail-progress", progress.toFixed(3));
      track.style.transform = `translate3d(${offset.toFixed(2)}px, 0, 0)`;
    };

    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    const onResize = () => requestUpdate();
    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", onResize);
      if (frame) window.cancelAnimationFrame(frame);
      delete section.dataset.trackRailReady;
      section.style.removeProperty("--track-rail-progress");
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

    track.style.transform = `translate3d(${-targetOffset.toFixed(2)}px, 0, 0)`;
  };

  return (
    <section ref={sectionRef} className="scroll-track-rail-section" aria-labelledby="music-title">
      <div ref={windowRef} className="scroll-track-rail-window" role="region" aria-label="23 anklickbare Trackkader, bewegen sich beim Scrollen in beide Richtungen">
        <div ref={trackRef} className="scroll-track-rail" onFocusCapture={revealFocusedTrack}>
          {tracks.map((track) => (
            <TrackDialog
              key={track.id}
              track={track}
              onListenRequest={onListenRequest}
              triggerClassName="scroll-track-card"
            />
          ))}
        </div>
      </div>
      <p className="scroll-track-rail-note"><span>SCROLL DOWN</span> → frames move right <i>·</i> <span>SCROLL UP</span> → frames move left</p>
    </section>
  );
}
