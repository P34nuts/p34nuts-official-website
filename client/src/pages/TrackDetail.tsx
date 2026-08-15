/** NOIR CUT FINAL AUDIT — Shareable, accessible music detail pages with a clear discovery continuation. */
import { ArrowLeft, ArrowUpRight, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useEffect } from "react";
import { Link, useRoute } from "wouter";
import { SunoPlayer } from "@/components/SunoPlayer";
import { ShareTrackButton } from "@/components/ShareTrackButton";
import { assets, getAdjacentTracks, getRelatedTracks, getTrackBySlug, getTrackStory } from "@/data/artistData";
import { rememberTrack } from "@/lib/musicHistory";
import NotFound from "@/pages/NotFound";

export default function TrackDetail() {
  const [, params] = useRoute("/music/:slug");
  const track = getTrackBySlug(params?.slug);
  useEffect(() => {
    if (!track) return;
    document.title = `${track.title} — P34nuts`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", `${track.title} von P34nuts: ${track.note}`);
    rememberTrack(track);
  }, [track]);
  if (!track) return <NotFound />;
  const related = getRelatedTracks(track);
  const story = getTrackStory(track);
  const { previous, next } = getAdjacentTracks(track);
  return <main className="subpage-shell track-page"><header className="subpage-header"><Link href="/" className="brand-lockup brand-home-wordmark" aria-label="P34nuts, zur Startseite"><img src={assets.headerWordmark} alt="P34nuts" /></Link><Link href="/music" className="subpage-back"><ArrowLeft size={16} /> ALL MUSIC</Link></header><section className="track-page-hero"><div className={`track-page-art ${track.coverStyle}`}>{track.cover ? <img src={track.cover} alt={`Cover-Artwork für ${track.title}`} fetchPriority="high" /> : <span className="release-generated-art" aria-hidden="true" />}<span>{track.id} / 23</span></div><div className="track-page-copy"><p className="eyebrow">{track.visualTheme} / track archive</p><h1>{track.title}</h1><p className="track-page-mood">{track.mood}</p><p className="track-page-note">{track.note}</p><div className="track-theme-list">{track.themes.map((theme) => <span key={theme}>{theme}</span>)}</div>{track.sunoId ? <><span className="track-source-badge">FULL TRACK AVAILABLE / SUNO</span><SunoPlayer track={track} /></> : <div className="track-listen-status"><Play size={16} fill="currentColor" /><span>STREAMING / QUELLE AUSSTEHEND</span><small>Die Audio- und Plattformquelle wird nach Freigabe ergänzt.</small></div>}<ShareTrackButton track={track} /></div></section><nav className="track-sequence" aria-label="Archivnavigation">{previous ? <Link href={`/music/${previous.slug}`}><ChevronLeft size={17} /><span>PREV / {previous.id}</span><strong>{previous.title}</strong></Link> : <span className="track-sequence-edge">01 / FIRST FRAME</span>}<Link href="/music" className="track-sequence-index">ALL / 23</Link>{next ? <Link href={`/music/${next.slug}`}><span>NEXT / {next.id}</span><strong>{next.title}</strong><ChevronRight size={17} /></Link> : <span className="track-sequence-edge">23 / LAST FRAME</span>}</nav><section className="track-story-section" aria-labelledby="track-story-title"><div className="track-story-heading"><p className="eyebrow">Track profile / {track.id}</p><h2 id="track-story-title">IN<br /><em>CONTEXT.</em></h2><span>{story.genre}</span></div><div className="track-story-copy"><p className="track-story-lede">{story.story}</p><p><strong>Gedanke des Rappers.</strong>{story.perspective}</p><p><strong>Kernbotschaft.</strong>{story.message}</p>{story.contentNote && <p className="track-story-note">{story.contentNote}</p>}</div></section><section className="related-section" aria-labelledby="related-title"><div className="related-heading"><p className="eyebrow">Continue the line</p><h2 id="related-title">MORE<br /><em>LIKE THIS.</em></h2></div><div className="related-grid">{related.map((item) => <Link href={`/music/${item.slug}`} className={`related-track ${item.coverStyle}`} key={item.id}>{item.cover && <img src={item.cover} alt="" loading="lazy" />}<span>{item.id} / {item.mood}</span><strong>{item.title}</strong><ArrowUpRight size={17} /></Link>)}</div></section></main>;
}
