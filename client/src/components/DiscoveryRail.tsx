/** NOIR CUT FINAL AUDIT — A fast, non-generic entry point for listeners who do not know P34nuts yet. */
import { ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { discoveryPaths, getTrackBySlug } from "@/data/artistData";

export function DiscoveryRail() {
  return (
    <section id="start-here" className="discovery-section" aria-labelledby="discovery-title">
      <div className="section-wrap">
        <div className="discovery-heading"><p className="eyebrow">Start here / new listener guide</p><h2 id="discovery-title">FIND YOUR<br /><em>ENTRY.</em></h2><p>Kein Kontext nötig. Such dir einen Einstieg nach Stimmung aus – der Rest folgt im Archiv.</p></div>
        <div className="discovery-grid">
          {discoveryPaths.map((path, index) => {
            const track = getTrackBySlug(path.trackSlug);
            if (!track) return null;
            return <Link key={path.label} href={`/music/${track.slug}`} className={`discovery-card discovery-card--cover ${track.coverStyle}`}><img className="discovery-card-cover" src={track.cover} alt="" loading="lazy" decoding="async" /><span>0{index + 1} / {path.label}</span><strong>{track.title}</strong><p>{path.title}</p><ArrowUpRight size={17} /></Link>;
          })}
        </div>
      </div>
    </section>
  );
}
