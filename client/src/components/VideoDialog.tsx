
/**
 * NOIR CUT DESIGN REMINDER — A quiet, viewport-scoped preview runs inside the card.
 * The full No-Cookie player with sound is created only after an active click and removed on close.
 */

import { Play, X } from "lucide-react";
import { useState } from "react";
import { InlineVideoPreview } from "@/components/InlineVideoPreview";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type VideoDialogProps = {
  title: string;
  category: string;
  poster?: string;
  youtubeId: string;
  className?: string;
};

export function VideoDialog({ title, category, poster, youtubeId, className = "" }: VideoDialogProps) {
  const [open, setOpen] = useState(false);
  const embedUrl = `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className={`visual-card ${className}`}>
        <InlineVideoPreview youtubeId={youtubeId} title={title} poster={poster} enabled={!open} />
        <DialogTrigger asChild>
          <button type="button" className="visual-card-trigger" aria-label={`${category}: ${title} groß mit Ton öffnen`}>
            <span className="visual-dim" aria-hidden="true" />
            <span className="visual-card-meta">
              <span>{category}</span>
              <strong>{title}</strong>
            </span>
            <span className="visual-play" aria-hidden="true"><Play size={18} fill="currentColor" /></span>
          </button>
        </DialogTrigger>
      </div>
      <DialogContent className="video-dialog">
        <DialogClose className="dialog-close" aria-label="Dialog schließen"><X size={18} /></DialogClose>
        <div className="video-dialog-player">
          {open ? (
            <iframe
              src={embedUrl}
              title={`${title} – offizielles YouTube-Video von P34nuts`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : null}
        </div>
        <div className="video-dialog-copy">
          <p className="eyebrow">{category} / direct player</p>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Die Vorschau läuft stumm. Nach deinem Klick wird das Video groß geöffnet und mit Ton wiedergegeben. Beim Schließen wird der große Player wieder entfernt.
          </DialogDescription>
        </div>
      </DialogContent>
    </Dialog>
  );
}
