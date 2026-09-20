import { Play, X } from "lucide-react";
import { useState } from "react";
import type { Track } from "@/data/artistData";

/** Spotify is loaded only after an explicit listen action, matching the Suno player behavior. */
export function SpotifyPlayer({ track }: { track: Track }) {
  const [loaded, setLoaded] = useState(false);
  if (!track.spotifyTrackId) return null;

  const embedUrl = `https://open.spotify.com/embed/track/${track.spotifyTrackId}?utm_source=generator`;
  return loaded ? (
    <div className="suno-player-frame spotify-player-frame">
      <iframe
        src={embedUrl}
        title={`${track.title} – Spotify-Player von P34nuts`}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <button type="button" className="suno-player-remove" onClick={() => setLoaded(false)}>
        <X size={13} /> PLAYER ENTFERNEN
      </button>
    </div>
  ) : (
    <button type="button" className="suno-player-trigger spotify-player-trigger" onClick={() => setLoaded(true)}>
      <Play size={14} fill="currentColor" /> PLAY FULL TRACK / SPOTIFY
    </button>
  );
}
