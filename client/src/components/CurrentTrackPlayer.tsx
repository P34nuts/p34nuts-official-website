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
    audio.muted = isMuted;
    audio.autoplay = true;

    audio.defaultMuted = true;

    const startWhenReady = () => {
      audio.muted = isMuted;
      void audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    };

    audio.addEventListener("loadedmetadata", startWhenReady);
    audio.addEventListener("canplay", startWhenReady);
    audio.load();
    if (audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) startWhenReady();

    return () => {
      audio.removeEventListener("loadedmetadata", startWhenReady);
      audio.removeEventListener("canplay", startWhenReady);
    };
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
      const position = audio.currentTime;
      audio.muted = false;
      try {
        await audio.play();
        if (position > 0 && Math.abs(audio.currentTime - position) > 0.25) audio.currentTime = position;
        setIsMuted(false);
        setIsPlaying(true);
      } catch {
        audio.muted = true;
        setIsMuted(true);
        setIsPlaying(false);
      }
      return;
    }

    audio.muted = true;
    setIsMuted(true);
  };

  const handleEnded = () => {
    setCurrentIndex((index) => nextIndex(index, playableTracks.length));
    setIsPlaying(true);
  };

  return (
    <section className="current-track-player" aria-label="P34nuts Audioplayer">
      <audio ref={audioRef} src={currentTrack.audioSrc} preload="auto" autoPlay playsInline onEnded={handleEnded} aria-hidden="true" />
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
