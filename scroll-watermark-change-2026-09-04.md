# Scroll-Wasserzeichen – P34nuts Homepage

## Changed

Die Homepage verwendet nun das bestehende runde P34nuts-Wasserzeichen in zwei neuen, dekorativen Scroll-Inszenierungen. Ein kleines Wasserzeichen bewegt sich dezent abhängig vom globalen Scrollfortschritt. Zwischen dem Artist-Statement und dem Manifest wurde zusätzlich ein eigener visueller Zwischenabschnitt eingefügt. Dort dreht sich das runde Zeichen abhängig davon, wie weit der Abschnitt gescrollt wurde; ein großer, transparenter P34NUTS-Schriftzug bewegt sich gegenläufig im Hintergrund.

## Reason

Die Interaktion greift die vom Nutzer genannte Referenzseite auf, ohne deren Gestaltung zu kopieren. P34nuts soll stärker wie ein digitales, bewegtes Musikarchiv wirken, während die bestehende Skyline, die Person, die Navigation und die Inhalte erhalten bleiben.

## Result

Die Effekte sind rein dekorativ, pointer-frei und verändern keine Links oder Inhalte. Das runde Zeichen verwendet den bereits vorhandenen Asset-Pfad. Die Animationen arbeiten mit `transform` und `opacity` und berücksichtigen `prefers-reduced-motion`. Auf Mobilgeräten werden Größe, Bewegung und Sichtbarkeit reduziert, damit das Wasserzeichen die Lesbarkeit nicht beeinträchtigt.

Auf den öffentlichen Homepage-Inhaltsseiten wird weiterhin ausschließlich P34nuts verwendet. Der Name Frank Horn verbleibt in den rechtlichen Info-Seiten wie Impressum und Datenschutz.

## Prüfung

`pnpm check` und `pnpm build` waren erfolgreich. Die lokale Frontend-Vorschau konnte wegen fehlender serverseitiger API-Antworten nicht vollständig inhaltlich geladen werden; der Browser meldete hierfür bestehende TRPC-JSON-Fehler, die nicht durch die Wasserzeichen-Komponente verursacht werden. Die vorhandenen Gesamttests enthalten mehrere unabhängige Altfehler zu Shop-URL, Social-Preview und Kontakt-/Admin-Annahmen; sie wurden nicht durch diese Änderung gelockert oder verändert.

## Referenz

Die Interaktionsidee wurde anhand der öffentlich erreichbaren Oreo-Webflow-Referenzseite betrachtet: https://oreo-the-playful-network.webflow.io/
