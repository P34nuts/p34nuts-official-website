import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type InlineVideoPreviewProps = {
  youtubeId: string;
  title: string;
  poster?: string;
  enabled?: boolean;
};

/**
 * Quiet, viewport-scoped YouTube preview. The iframe exists only while its card
 * is near the viewport and never receives pointer events; the surrounding
 * dialog trigger remains the single interactive control.
 */
export function InlineVideoPreview({ youtubeId, title, poster, enabled = true }: InlineVideoPreviewProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || reduceMotion || !enabled) {
      setActive(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: "18% 0px", threshold: .12 },
    );
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [enabled, reduceMotion]);

  const previewUrl = `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1`;

  return (
    <span ref={wrapperRef} className="inline-video-preview" aria-hidden="true">
      {poster ? <img src={poster} alt="" loading="lazy" /> : <span className="visual-art" />}
      {active ? (
        <iframe
          src={previewUrl}
          title={`${title} – stumme Videovorschau`}
          tabIndex={-1}
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : null}
    </span>
  );
}
