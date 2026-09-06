import { useReducedMotion } from "framer-motion";
import { type CSSProperties, useEffect, useRef } from "react";
import { type Track } from "@/data/artistData";
import { TrackDialog } from "@/components/TrackDialog";

type ScrollTrackRailProps = {
  tracks: readonly Track[];
  onListenRequest: (track: Track) => void;
};

const noteLines = [2, 4, 1, 3, 0, 2, 4, 1, 3, 2, 0, 3, 1, 4, 2, 0, 2, 3, 1, 4, 2, 1, 3] as const;

function TrackCloneLink({ track, position, onListenRequest }: { track: Track; position: "before" | "after"; onListenRequest: (track: Track) => void }) {
  return (
    <TrackDialog track={track} onListenRequest={onListenRequest} triggerClassName={`scroll-track-card scroll-track-clone data-clone-${position}`} />
  );
}

function NotationSegment({ tracks, segment }: { tracks: readonly Track[]; segment: string }) {
  return (
    <div className="notation-segment">
      {tracks.map((track, index) => {
        const noteStyle = { "--note-line": noteLines[index % noteLines.length] } as CSSProperties;
        return (
          <span className="notation-note" key={`${segment}-${track.id}`} style={noteStyle}>
            <span className="notation-note-accidental">{index % 7 === 0 ? "♯" : index % 11 === 0 ? "♭" : ""}</span>
            <span className="notation-note-head" />
            <span className="notation-note-stem" />
            <span className="notation-note-flag" />
          </span>
        );
      })}
    </div>
  );
}

/**
 * An endless visual archive strip. Scroll down accelerates it to the left,
 * scroll up accelerates it to the right, then a slow directional drift remains.
 * The fixed staff below the cards uses the same direction and pixel velocity.
 */
export function ScrollTrackRail({ tracks, onListenRequest }: ScrollTrackRailProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const notationRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;

    const section = sectionRef.current;
    const track = trackRef.current;
    const notation = notationRef.current;
    if (!section || !track || !notation || !tracks.length) return;

    let animationFrame = 0;
    let lastTimestamp = performance.now();
    let lastScrollY = window.scrollY;
    let loopWidth = 0;
    let notationLoopWidth = 0;
    let offset = 0;
    let notationOffset = 0;
    let direction: -1 | 1 = -1;
    let boost = 0;
    // Start immediately; IntersectionObserver can deliver its first callback a
    // frame later, which otherwise makes the rail appear frozen on fast scrolls.
    let active = true;

    const measure = () => {
      loopWidth = track.scrollWidth / 3;
      notationLoopWidth = notation.scrollWidth / 3;
      if (!loopWidth || !notationLoopWidth) return;
      offset = -loopWidth;
      notationOffset = -notationLoopWidth;
      track.style.transform = `translate3d(${offset.toFixed(2)}px, 0, 0)`;
      notation.style.transform = `translate3d(${notationOffset.toFixed(2)}px, 0, 0)`;
    };

    const wrapOffset = () => {
      if (!loopWidth) return;
      while (offset <= -loopWidth * 2) offset += loopWidth;
      while (offset >= 0) offset -= loopWidth;
    };

    const wrapNotationOffset = () => {
      if (!notationLoopWidth) return;
      while (notationOffset <= -notationLoopWidth * 2) notationOffset += notationLoopWidth;
      while (notationOffset >= 0) notationOffset -= notationLoopWidth;
    };

    const animate = (timestamp: number) => {
      const deltaSeconds = Math.min((timestamp - lastTimestamp) / 1000, .05);
      lastTimestamp = timestamp;

      if (active && loopWidth && notationLoopWidth) {
        const idleSpeed = window.matchMedia("(max-width: 820px)").matches ? 34 : 48;
        const speed = idleSpeed + boost;
        offset += direction * speed * deltaSeconds;
        notationOffset += direction * speed * deltaSeconds;
        boost *= Math.pow(.055, deltaSeconds);
        if (boost < .2) boost = 0;
        wrapOffset();
        wrapNotationOffset();
        track.style.transform = `translate3d(${offset.toFixed(2)}px, 0, 0)`;
        notation.style.transform = `translate3d(${notationOffset.toFixed(2)}px, 0, 0)`;
      }

      animationFrame = window.requestAnimationFrame(animate);
    };

    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY;
      lastScrollY = currentY;
      if (!delta) return;

      direction = delta > 0 ? -1 : 1;
      boost = Math.min(760, boost + Math.abs(delta) * 14);
      section.dataset.trackDirection = direction < 0 ? "left" : "right";
    };

    const onResize = () => measure();
    const sizeObserver = new ResizeObserver(measure);
    const observer = new IntersectionObserver(
      ([entry]) => { active = entry.isIntersecting; },
      { rootMargin: "35% 0px 35% 0px" },
    );

    measure();
    section.dataset.trackRailReady = "true";
    section.dataset.trackDirection = "left";
    observer.observe(section);
    sizeObserver.observe(track);
    sizeObserver.observe(notation);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      observer.disconnect();
      sizeObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.cancelAnimationFrame(animationFrame);
      delete section.dataset.trackRailReady;
      delete section.dataset.trackDirection;
      track.style.removeProperty("transform");
      notation.style.removeProperty("transform");
    };
  }, [reduceMotion, tracks.length]);

  return (
    <section ref={sectionRef} className="scroll-track-rail-section" aria-labelledby="music-title">
      <div className="scroll-track-rail-window" role="region" aria-label="23 anklickbare Trackkader in einer richtungsabhängigen Endlosbewegung">
        <div ref={trackRef} className="scroll-track-rail">
          <div className="scroll-track-rail-segment" aria-hidden="true">
            {tracks.map((track) => <TrackCloneLink key={`before-${track.id}`} track={track} position="before" onListenRequest={onListenRequest} />)}
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
            {tracks.map((track) => <TrackCloneLink key={`after-${track.id}`} track={track} position="after" onListenRequest={onListenRequest} />)}
          </div>
        </div>
      </div>
      <div className="scroll-notation-system" aria-hidden="true">
        <span className="notation-clef">𝄞</span>
        <div className="notation-staff">
          <div ref={notationRef} className="notation-roll">
            <NotationSegment tracks={tracks} segment="before" />
            <NotationSegment tracks={tracks} segment="active" />
            <NotationSegment tracks={tracks} segment="after" />
          </div>
        </div>
      </div>
      <p className="scroll-track-rail-note"><span>SCROLL DOWN</span> → faster left <i>·</i> <span>SCROLL UP</span> → faster right <i>·</i> idle keeps the last direction</p>
    </section>
  );
}
