/** NOIR CUT LEGAL FRAME — structured public information without inventing personal details. */
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useEffect } from "react";
import { Link } from "wouter";
import { assets, booking } from "@/data/artistData";

type InfoKind = "booking" | "press" | "shop" | "impressum" | "datenschutz";
type InfoSection = { heading: string; copy: string; value?: string };
type InfoContent = { label: string; title: string; copy: string; action: string; href?: string; notice?: string; sections?: InfoSection[] };

export const infoPageContent: Record<InfoKind, InfoContent> = {
  booking: {
    label: "Booking / business",
    title: "MAKE THE\nNEXT FRAME\nREAL.",
    copy: `Für Live-Shows, Kooperationen und Business-Anfragen. Das Booking-Formular übermittelt deine Angaben geschützt an den Projektkontakt; direkt erreichbar ist P34nuts außerdem unter ${booking.email}.`,
    action: "ZUM BOOKING-FORMULAR",
    href: "/#send-the-frame",
  },
  press: {
    label: "Press / EPK",
    title: "THE PRESS\nFRAME IS\nREADY.",
    copy: "Bildwelt, Basisinformationen und ein Downloadbereich sind vorbereitet. Ein EPK wird erst nach Freigabe verlinkt.",
    action: "EPK / IN FREIGABE",
  },
  shop: {
    label: "Merch / independent storefront",
    title: "NO//SIGNAL\nMERCH\nARCHIVE.",
    copy: "Der P34nuts-Merch-Shop wird als eigenständige Storefront betrieben. Dieser Einstieg bleibt Teil des Artist-Universums, während Katalog, Warenkorb, Bestellungen und Fulfillment technisch getrennt und abgesichert laufen.",
    action: "BACK TO HOME",
    sections: [
      { heading: "Storefront", copy: "Die Shopanwendung erhält einen eigenen serverfähigen Betrieb. Dadurch bleiben der Artist-Auftritt, die Musikarchive und die Commerce-Prozesse voneinander getrennt." },
      { heading: "Katalog", copy: "Caps, T-Shirts und Hoodies werden über die eigenständige Merch-Storefront bereitgestellt. Der sichtbare SHOP-Einstieg auf dieser Website bleibt der direkte Zugangspunkt zur Kollektion." },
      { heading: "Checkout", copy: "Der Kaufstart erfolgt erst nach abgeschlossener Shop-Bereitstellung sowie geprüfter Zahlungs- und Fulfillment-Konfiguration. Bis dahin werden keine Zahlungs- oder Bestelldaten über die Künstlerhomepage verarbeitet." },
    ],
  },
  impressum: {
    label: "Legal / Angaben ergänzen",
    title: "IMPRINT\nREADY TO\nCOMPLETE.",
    copy: "Diese Impressums-Vorlage ist strukturiert vorbereitet. Die persönlichen Angaben bleiben bewusst frei, bis sie von der verantwortlichen Stelle verbindlich eingetragen und geprüft wurden.",
    action: "BACK TO HOME",
    notice: "Vor der finalen Veröffentlichung müssen alle Felder mit den tatsächlichen Angaben der verantwortlichen Stelle ergänzt werden.",
    sections: [
      { heading: "Künstler- & Projekt-Hinweis: Über das Projekt „P34nuts“", copy: "Hinter dem Namen P34nuts steht kein klassischer Rapper aus Fleisch und Blut, sondern eine digitale Kunstfigur – konzipiert, erschaffen und gelenkt von Künstler und DJ Frank Horn." },
      { heading: "Die kreative Vision & der Einsatz von KI", copy: "Das Projekt „P34nuts“ verbindet moderne Technologie mit persönlicher Kreativität:" },
      { heading: "100 % Echte Texte", copy: "Sämtliche Songtexte, Geschichten, Konzepte und thematischen Botschaften stammen ausnahmslos und zu 100 % aus der Feder von Frank Horn. Hier fließt persönliche Lebenserfahrung, Herzblut, Gesellschaftskritik und Humor ein." },
      { heading: "KI-gestützte Produktion", copy: "Die finale musikalische Komposition und die stimmliche Umsetzung erfolgen über generative KI-Technologie (Suno AI)." },
      { heading: "Aufwand & Leidenschaft", copy: "Auch wenn künstliche Intelligenz als mächtiges Werkzeug dient, steckt in jedem fertigen Track unzählige Stunden an Songwriting, feinteiligem Prompt-Engineering, manuellem Arrangement, Kuration und Feinschliff. Es ist ein modernes Kunstprojekt, das neue digitale Wege im Musikbereich beschreitet." },
      { heading: "Buchungen & Live-Auftritte", copy: "Für Buchungen, Events und Live-Auftritte wird ausdrücklich der Künstler DJ Frank Horn (alias P34nuts) als Person und DJ verpflichtet. Das Live-Programm verbindet energiegeladene DJ-Sets mit den individuellen Sounds und Facetten des Projekts." },
      { heading: "Support & Wertschätzung", copy: "Ein eigenständiges Projekt dieser Art lebt von seiner Community. Ob durch das Streamen der Musik, Feedback, das Teilen der Songs, Merch-Käufe im Shop oder DJ-Buchungen: Jeder Support fließt direkt in die Weiterentwicklung des Sounds, neue Tracks und kommende Veröffentlichungen." },
      { heading: "Vielen Dank", copy: "Vielen Dank für jeden Support und das Begleiten dieser Reise!" },
      { heading: "Anbieter / verantwortliche Stelle", copy: "Vollständiger bürgerlicher Name oder Unternehmensname der verantwortlichen Person beziehungsweise Organisation.", value: "[ BITTE VOLLSTÄNDIGEN NAMEN / FIRMENNAMEN EINTRAGEN ]" },
      { heading: "Zustellfähige Anschrift", copy: "Straße, Hausnummer, Postleitzahl, Ort und Land der verantwortlichen Stelle.", value: "[ STRASSE · HAUSNUMMER · PLZ · ORT · LAND ]" },
      { heading: "Kontakt", copy: "Die bestätigte E-Mail-Adresse für Booking lautet:", value: booking.email },
      { heading: "Vertretung, Register & Steuerangaben", copy: "Bei einer Organisation oder einem Unternehmen: vertretungsberechtigte Person sowie nur falls vorhanden und erforderlich Registergericht, Registernummer, Umsatzsteuer- oder Wirtschafts-ID.", value: "[ GGF. VERTRETUNG · REGISTER · UST-ID ERGÄNZEN ]" },
    ],
  },
  datenschutz: {
    label: "Privacy / Angaben ergänzen",
    title: "PRIVACY\nWITH\nCONTEXT.",
    copy: "Diese Datenschutzhinweise beschreiben die derzeit technisch vorgesehenen Kontakt- und Videofunktionen. Für die finale Veröffentlichung müssen Verantwortliche, Rechtsgrundlagen, Speicherdauer und die tatsächlich genutzten Dienste verbindlich geprüft und ergänzt werden.",
    action: "BACK TO HOME",
    notice: "Vor einer finalen rechtlichen Freigabe sind die Angaben der verantwortlichen Stelle sowie die konkrete Auftragsverarbeitung der eingesetzten Dienste zu prüfen.",
    sections: [
      { heading: "Verantwortliche Stelle", copy: "Die Stelle, die über die Verarbeitung personenbezogener Daten entscheidet.", value: "[ NAME / FIRMENNAME · ANSCHRIFT · KONTAKT EINTRAGEN ]" },
      { heading: "Booking-Anfragen", copy: "Nach aktivem Absenden verarbeitet das Formular Name, E-Mail-Adresse, Datum, Veranstaltungsort, Ort, Format und optionale Angaben ausschließlich zur Bearbeitung der Anfrage. Die Angaben werden serverseitig gespeichert, dem Projekteigentümer gemeldet und zusätzlich an die Booking-Adresse übermittelt." },
      { heading: "E-Mail-Versand", copy: "Für den Versand der Booking-Benachrichtigung wird der verschlüsselte SMTP-Dienst von mail.de verwendet. Empfänger ist die Booking-Adresse; die angegebene E-Mail-Adresse der anfragenden Person wird als Antwortadresse eingesetzt." },
      { heading: "YouTube-Videos", copy: "Ein Video wird erst geladen, wenn du dessen Karte aktiv öffnest. Der dann eingebettete Player verwendet die Domain youtube-nocookie.com und wird beim Schließen des Fensters wieder entfernt." },
      { heading: "Hosting, Analyse & Betroffenenrechte", copy: "Hosting- und Analyseangaben, Rechtsgrundlagen, Speicherdauer sowie Hinweise auf Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch und Beschwerderecht werden mit der verantwortlichen Stelle und den tatsächlich eingesetzten Anbietern vor der finalen Freigabe konkret ergänzt." },
    ],
  },
};

export default function InfoPage({ kind }: { kind: InfoKind }) {
  const page = infoPageContent[kind];
  const hasPortrait = kind === "booking" || kind === "shop";

  useEffect(() => {
    document.title = `${page.label} — P34nuts`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", page.copy);
  }, [page]);

  const content = <>
    <p className="eyebrow">{page.label}</p>
    <h1>{page.title.split("\n").map((line) => <span key={line}>{line}<br /></span>)}</h1>
    <p>{page.copy}</p>
    {page.notice ? <aside className="info-page-notice">{page.notice}</aside> : null}
    {page.sections ? <div className="info-page-details">{page.sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2><p>{section.copy}</p>{section.value ? <code className="info-page-template-value">{section.value}</code> : null}</section>)}</div> : null}
    <Link href={page.href ?? "/"} className="info-page-action">{page.action}<ArrowUpRight size={17} /></Link>
  </>;

  return (
    <main className={`subpage-shell info-page ${hasPortrait ? "info-page--portrait" : ""}`}>
      <header className="subpage-header">
        <Link href="/" className="brand-lockup brand-home-wordmark"><img src={assets.headerWordmark} alt="P34nuts" /></Link>
        <Link href="/" className="subpage-back"><ArrowLeft size={16} /> HOME</Link>
      </header>
      <section className="info-page-content">
        {hasPortrait ? <><img className="info-page-portrait" src={assets.hero} alt="" /><div className="info-page-portrait-veil" /><div className="info-page-content-inner">{content}</div></> : content}
      </section>
    </main>
  );
}
