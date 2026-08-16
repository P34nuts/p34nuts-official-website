import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useEffect } from "react";
import { Link } from "wouter";
import { assets } from "@/data/artistData";
import { isExternalShopHref, shopHref } from "@/lib/shopLink";

const redirectDelayMs = 1200;

/**
 * A branded handoff between the static artist site and the isolated commerce app.
 * The fallback remains inert when no trusted external shop URL was built in.
 */
export default function ShopRedirect() {
  useEffect(() => {
    if (!isExternalShopHref) return;

    const timeout = window.setTimeout(() => {
      window.location.replace(shopHref);
    }, redirectDelayMs);

    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <main className="subpage-shell info-page info-page--portrait">
      <header className="subpage-header">
        <Link href="/" className="brand-lockup brand-home-wordmark"><img src={assets.headerWordmark} alt="P34nuts" /></Link>
        <Link href="/" className="subpage-back"><ArrowLeft size={16} /> HOME</Link>
      </header>
      <section className="info-page-content">
        <img className="info-page-portrait" src={assets.hero} alt="" />
        <div className="info-page-portrait-veil" />
        <div className="info-page-content-inner">
          <p className="eyebrow">Merch / independent storefront</p>
          <h1><span>NO//SIGNAL<br /></span><span>MERCH<br /></span><span>ARCHIVE.</span></h1>
          <p>Der Merch-Store öffnet in einem eigenen, serverfähigen Frame. Katalog, Warenkorb und spätere Bestellprozesse bleiben technisch vom Artist-Archiv getrennt.</p>
          {isExternalShopHref ? (
            <p className="info-page-notice" aria-live="polite">SHOP-SIGNAL AKTIV. Die Storefront öffnet automatisch.</p>
          ) : (
            <p className="info-page-notice">Die Storefront wird vorbereitet. Dieser sichere Übergang bleibt auf der Artist-Seite, bis eine externe Shopadresse hinterlegt ist.</p>
          )}
          <a href={shopHref} className="info-page-action">SHOP JETZT ÖFFNEN <ArrowUpRight size={17} /></a>
        </div>
      </section>
    </main>
  );
}
