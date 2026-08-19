import { useEffect, useState } from "react";
import { ArrowUpRight, BookOpen, ExternalLink, FilePenLine, Github, LockKeyhole, Package, Rocket, ShieldCheck, Store, Workflow } from "lucide-react";
import { Link } from "wouter";

const GITHUB = "https://github.com/P34nuts";
const OFFICIAL_REPO = `${GITHUB}/p34nuts-official-website`;
const SHOP_REPO = `${GITHUB}/p34nuts-merch-store`;
const SHOP = "https://p34nuts-merch-store.onrender.com";
const CONTROL_WORKER = "https://p34nuts-control-center.frank-horn.workers.dev";

function ActionLink({ href, children, external = true }: { href: string; children: React.ReactNode; external?: boolean }) {
  const className = "inline-flex min-h-11 items-center justify-between gap-3 rounded-none border border-white/15 bg-white/[.04] px-4 py-3 text-left text-sm text-[#f1eee5] transition hover:border-[#ff3b30] hover:bg-[#ff3b30] hover:text-[#101012] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff3b30]";
  if (external) return <a className={className} href={href} target="_blank" rel="noreferrer">{children}<ArrowUpRight className="size-4 shrink-0" aria-hidden="true" /></a>;
  return <Link className={className} href={href}>{children}<ArrowUpRight className="size-4 shrink-0" aria-hidden="true" /></Link>;
}

function Section({ eyebrow, title, description, icon, children }: { eyebrow: string; title: string; description: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="border-t border-white/15 pt-5">
    <div className="grid gap-5 lg:grid-cols-[minmax(15rem,.7fr)_minmax(0,1.3fr)]">
      <div>
        <div className="flex items-center gap-2 font-mono text-[.62rem] uppercase tracking-[.2em] text-[#ff3b30]">{icon}{eyebrow}</div>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-.04em] text-[#f1eee5] sm:text-3xl">{title}</h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-white/55">{description}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  </section>;
}

export default function ControlCenter() {
  const [session, setSession] = useState<"checking" | "signed-out" | "signed-in">("checking");

  useEffect(() => {
    let cancelled = false;
    fetch(`${CONTROL_WORKER}/session`, { credentials: "include" })
      .then(response => response.ok ? response.json() : null)
      .then(value => { if (!cancelled) setSession(value?.authenticated ? "signed-in" : "signed-out"); })
      .catch(() => { if (!cancelled) setSession("signed-out"); });
    return () => { cancelled = true; };
  }, []);

  const startLogin = () => { window.location.href = `${CONTROL_WORKER}/auth/start`; };

  return <main className="min-h-screen bg-[#101012] px-4 py-6 text-[#f1eee5] sm:px-8 sm:py-10 lg:px-14">
    <div className="mx-auto max-w-7xl">
      <header className="border-b border-white/15 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="font-mono text-xs uppercase tracking-[.18em] text-white/60 transition hover:text-[#ff3b30]">← Zur Homepage</Link>
          <div className="flex flex-wrap items-center gap-2">
            {session === "signed-in" ? <span className="inline-flex items-center gap-2 border border-emerald-400/30 bg-emerald-950/25 px-3 py-2 font-mono text-[.62rem] uppercase tracking-[.14em] text-emerald-200"><ShieldCheck className="size-3.5" aria-hidden="true" /> GitHub-Sitzung aktiv</span> : <button type="button" onClick={startLogin} className="inline-flex min-h-11 items-center gap-2 border border-[#ff3b30]/60 bg-[#ff3b30] px-3 py-2 font-mono text-[.62rem] uppercase tracking-[.14em] text-[#101012] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff3b30]">Mit GitHub anmelden <ArrowUpRight className="size-3.5" aria-hidden="true" /></button>}
            {session === "checking" && <span className="font-mono text-[.6rem] uppercase tracking-[.12em] text-white/40">Sitzung wird geprüft</span>}
          </div>
        </div>
        <p className="mt-12 font-mono text-xs uppercase tracking-[.28em] text-[#ff3b30]">P34NUTS / CONTROL CENTER</p>
        <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-[.88] tracking-[-.09em] sm:text-7xl lg:text-8xl">Deine Seiten.<br /><em className="font-serif font-normal">Deine Kontrolle.</em></h1>
        <p className="mt-7 max-w-2xl text-base leading-7 text-white/65">Hier startest du alle sicheren Änderungen an der Artist-Homepage und am Shop. Jeder Weg erklärt, wo die Änderung gespeichert wird und wann sie live geht.</p>
      </header>

      <div className="my-7 grid gap-3 md:grid-cols-4">
        <div className="border border-[#ff3b30]/35 bg-[#ff3b30]/[.07] p-4"><Github className="size-5 text-[#ff3b30]" aria-hidden="true" /><p className="mt-4 font-semibold">Serverseitig geschützt</p><p className="mt-1 text-xs leading-5 text-white/50">{session === "signed-in" ? "GitHub hat deine Betreiber-Sitzung bestätigt." : "Melde dich mit GitHub an, bevor eine sichere Änderung ausgeführt wird."}</p><button type="button" onClick={startLogin} className="mt-4 font-mono text-[.62rem] uppercase tracking-[.12em] text-[#ff3b30] underline-offset-4 hover:underline">{session === "signed-in" ? "Erneut anmelden" : "Login starten"}</button></div>
        <div className="border border-white/10 bg-white/[.035] p-4"><LockKeyhole className="size-5 text-[#ff3b30]" aria-hidden="true" /><p className="mt-4 font-semibold">Keine Schlüssel im Browser</p><p className="mt-1 text-xs leading-5 text-white/50">Private GitHub-, Stripe- und Printful-Daten werden nie in diese Seite eingebaut.</p></div>
        <div className="border border-white/10 bg-white/[.035] p-4"><Workflow className="size-5 text-[#ff3b30]" aria-hidden="true" /><p className="mt-4 font-semibold">Versioniert</p><p className="mt-1 text-xs leading-5 text-white/50">Homepage-Änderungen bleiben als GitHub-Commit nachvollziehbar und rücksetzbar.</p></div>
        <div className="border border-white/10 bg-white/[.035] p-4"><Rocket className="size-5 text-[#ff3b30]" aria-hidden="true" /><p className="mt-4 font-semibold">Kontrolliert live</p><p className="mt-1 text-xs leading-5 text-white/50">GitHub Actions veröffentlicht erst den geprüften Stand auf GitHub Pages.</p></div>
      </div>

      <div className="grid gap-12">
        <Section eyebrow="01 / Artist Homepage" title="Inhalte ändern" description="Diese direkten GitHub-Wege öffnen die vorhandenen Inhaltsquellen. Nach dem Speichern entsteht ein Commit; die Pages-Veröffentlichung folgt über den bestehenden Workflow." icon={<FilePenLine className="size-3.5" aria-hidden="true" />}>
          <ActionLink href={`${OFFICIAL_REPO}/edit/main/client/src/data/artistData.ts`}><span><FilePenLine className="mb-1 size-4" aria-hidden="true" /><strong className="block">Songs & Seiteninhalte</strong><small className="text-xs opacity-60">Artist-Daten bearbeiten</small></span></ActionLink>
          <ActionLink href={`${OFFICIAL_REPO}/edit/main/client/src/index.css`}><span><FilePenLine className="mb-1 size-4" aria-hidden="true" /><strong className="block">Design & Layout</strong><small className="text-xs opacity-60">Farben, Abstände, Mobile CSS</small></span></ActionLink>
          <ActionLink href={`${OFFICIAL_REPO}/actions/workflows/deploy-root-pages.yml`}><span><Rocket className="mb-1 size-4" aria-hidden="true" /><strong className="block">Homepage veröffentlichen</strong><small className="text-xs opacity-60">GitHub-Pages-Workflow öffnen</small></span></ActionLink>
          <ActionLink href={`${OFFICIAL_REPO}/issues/new`}><span><BookOpen className="mb-1 size-4" aria-hidden="true" /><strong className="block">Änderung beauftragen</strong><small className="text-xs opacity-60">Notiz oder Problem erfassen</small></span></ActionLink>
        </Section>

        <Section eyebrow="02 / Gästebuch & öffentliche Signale" title="Community verwalten" description="Das bestehende serverseitige Gästebuch bleibt geschützt. Öffne dafür den vorhandenen Adminweg; die öffentliche Homepage bleibt auf GitHub Pages." icon={<ShieldCheck className="size-3.5" aria-hidden="true" />}>
          <ActionLink href={`${OFFICIAL_REPO}/tree/main/client/src/pages/Admin.tsx`}><span><ShieldCheck className="mb-1 size-4" aria-hidden="true" /><strong className="block">Bestehenden Admincode</strong><small className="text-xs opacity-60">Sicherheitslogik einsehen</small></span></ActionLink>
          <ActionLink href={`${OFFICIAL_REPO}/issues`}><span><BookOpen className="mb-1 size-4" aria-hidden="true" /><strong className="block">Änderungsübersicht</strong><small className="text-xs opacity-60">Offene GitHub-Aufgaben</small></span></ActionLink>
        </Section>

        <Section eyebrow="03 / Merch Shop" title="Shop öffnen" description="Der Shop läuft als getrennte Render-Anwendung. Checkout, Clerk, Stripe, Printful, Bestellungen und TiDB bleiben dort geschützt und werden nicht über GitHub-Dateien manipuliert." icon={<Store className="size-3.5" aria-hidden="true" />}>
          <ActionLink href={`${SHOP}/admin`}><span><Store className="mb-1 size-4" aria-hidden="true" /><strong className="block">Shop-Administration</strong><small className="text-xs opacity-60">Clerk-geschützter Adminbereich</small></span></ActionLink>
          <ActionLink href={`${SHOP}/admin/printful-catalog`}><span><Package className="mb-1 size-4" aria-hidden="true" /><strong className="block">Printful-Katalog</strong><small className="text-xs opacity-60">Vorschau & kontrollierter Import</small></span></ActionLink>
          <ActionLink href={`${SHOP_REPO}/actions`}><span><Workflow className="mb-1 size-4" aria-hidden="true" /><strong className="block">Shop-Deploys</strong><small className="text-xs opacity-60">GitHub-Quellstand & Actions</small></span></ActionLink>
          <ActionLink href={`${SHOP}/health`}><span><ShieldCheck className="mb-1 size-4" aria-hidden="true" /><strong className="block">Shop-Status</strong><small className="text-xs opacity-60">Öffentliche Gesundheitsprüfung</small></span></ActionLink>
        </Section>

        <section className="border border-[#ff3b30]/45 bg-[#ff3b30]/[.07] p-5 sm:p-7">
          <div className="flex items-start gap-4"><Github className="mt-1 size-6 shrink-0 text-[#ff3b30]" aria-hidden="true" /><div><h2 className="text-xl font-semibold">Sicherer Ausbau als nächster Schritt</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-white/65">Die erste Version bündelt die vorhandenen sicheren Wege. Als nächstes können wir Formularfelder mit Vorschau ergänzen, die daraus automatisch einen GitHub-Commit erstellen. Dafür bleibt die private GitHub-App-Berechtigung ausschließlich auf dem Server; sie wird niemals in diesem Pages-Bundle ausgeliefert.</p><a className="mt-5 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[.12em] text-[#ff3b30] hover:text-white" href="https://github.com/settings/apps/p34nuts-control-center" target="_blank" rel="noreferrer">GitHub-App verwalten <ExternalLink className="size-3.5" aria-hidden="true" /></a></div></div>
        </section>
      </div>
    </div>
  </main>;
}
