import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Track } from "@/data/artistData";

type CurrentTrackPlayerProps = {
  tracks: readonly Track[];
};

function nextIndex(current: number, length: number) {
  if (length <= 1) return current;
  let next = current;
  while (next === current) next = Math.floor(Math.random() * length);
  return next;
}

export function CurrentTrackPlayer({ tracks }: CurrentTrackPlayerProps) {
  const playableTracks = useMemo(() => tracks.filter((track) => track.audioSrc), [tracks]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const currentTrack = playableTracks[currentIndex] ?? playableTracks[0];

  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;
    const audio = audioRef.current;
    audio.src = currentTrack.audioSrc ?? "";
    audio.load();
    if (isPlaying) {
      void audio.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    };
  }, []);

  if (!currentTrack) return null;

  const toggleSound = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      setIsMuted(false);
      audio.muted = false;
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    setIsMuted(true);
    audio.muted = true;
  };

  const handleEnded = () => {
    setCurrentIndex((index) => nextIndex(index, playableTracks.length));
    setIsPlaying(true);
  };

  return (
    <section className="current-track-player" aria-label="P34nuts Audioplayer">
      <audio ref={audioRef} preload="metadata" onEnded={handleEnded} aria-hidden="true" />
      <div className="current-track-copy">
        <span className={`current-track-status ${isPlaying ? "is-live" : ""}`}>
          <i aria-hidden="true" /> AKTUELL LÄUFT
        </span>
        <strong className="current-track-title" aria-live="polite">{currentTrack.title}</strong>
        <span className="current-track-meta">{currentTrack.id} / {playableTracks.length || 1} DIRECT AUDIO</span>
      </div>
      <button
        type="button"
        className={`current-track-sound ${isMuted ? "is-muted" : "is-on"}`}
        onClick={toggleSound}
        aria-pressed={!isMuted}
        aria-label={isMuted ? "Ton einschalten" : "Ton ausschalten"}
      >
        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        <span>{isMuted ? "TON AN" : "TON AUS"}</span>
      </button>
      <span className="current-track-signal" aria-hidden="true"><i /><i /><i /><i /><i /></span>
    </section>
  );
}
