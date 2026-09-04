# Stabiler Szenenfluss und ALL-FRAMES-Songbahn – P34nuts

## Changed

Die allgemeine, dynamische Bereichssteuerung wird auf Mobilgeräten bis einschließlich 820 Pixel vollständig zurückgesetzt. Damit erhalten mobile Nutzer keine voneinander unabhängigen Skalen, Aufwärtsbewegungen und Inhaltsverschiebungen mehr. Das separate runde P34nuts-Wasserzeichen bleibt unverändert aktiv.

Stattdessen wurden drei kontrollierte Übergabebühnen zwischen den großen Inhaltsgruppen ergänzt:

1. Album-Intro zu Music/Discovery: `ENTER / THE FRAME.`
2. Featured Visual zu Artist-Profil: `CUT / DEEPER.`
3. Gallery zu Live: `KEEP / MOVING.`

Jede Szene nutzt ausschließlich vorhandene P34nuts-Bilder. Auf Desktop bleibt große Typografie als visuelle Bühne sichtbar, während eine eigene stark gerundete Medienfläche aus dem unteren Bereich in die nächste Inhaltsgruppe übergeht. Auf Mobilgeräten sind diese Szenen kompakte, statische Übergabekarten; es gibt dort keine scrollgebundene Transformation.

Der vorherige ALL-FRAMES-Rasterbereich wurde durch eine einzelne, horizontale Sticky-Songbahn ersetzt. Sie umfasst alle 23 vorhandenen Trackdialoge, also alle bestehenden klickbaren Song-Cover und deren Archiv-/Player-Ziele. Beim Scrollen nach unten bewegt der Fortschritt die Bahn von links nach rechts; beim Hochscrollen läuft sie in die Gegenrichtung zurück. Es existieren keine dekorativen Duplikate, sodass jedes sichtbare Cover ein echtes, fokussierbares Klickziel bleibt.

## Reason

Die vorige bereichsweite Bewegung wirkte auf Mobilgeräten wackelig, weil viele unterschiedlich hohe Inhaltsabschnitte gleichzeitig transformiert wurden. Die Jomor-Referenz wirkt dagegen durch wenige dominante, klar gebundene Übergabe-Szenen, in denen große Typografie und eine gerundete Medienfläche kontrolliert die nächste Komposition übernehmen.

Der Paul-Kalkbrenner-Newsletterbereich dient als Referenzprinzip für eine horizontale visuelle Inhaltsstrecke. Für P34nuts wurde dieses Prinzip als Songarchiv umgesetzt, ohne Inhalte, Bilder, Texte oder Code der Referenzseiten zu kopieren.

## Result

Die Homepage erhält nun stärkere, aber steuerbare Übergänge. Mobile besitzt eine ruhige, gut lesbare Hauptdramaturgie mit statischen Szenen, während Desktop die zusätzlicher scrollgebundene Wirkung der Übergabebühnen erhält. Die Songbahn bietet eine deutliche visuelle Bewegung und gleichzeitig eine klare, zugängliche Möglichkeit, jeden der 23 Titel zu öffnen.

Bei aktivierter Einstellung `prefers-reduced-motion` wird die Songbahn zur horizontal scrollbaren Liste ohne automatische Transformbewegung; die Übergabebühnen bleiben statisch. Tastaturfokus für jede Songkarte ist sichtbar.

## Prüfung

`pnpm check`, `pnpm build` und `git diff --check` sind erfolgreich. Die lokale Vite-Vorschau zeigt weiterhin bestehende TRPC-Anfragefehler, weil der reine Frontendserver keine API-Endpunkte bereitstellt. Das betrifft die bereits bestehende Datenabfrage und nicht die neuen Scroll-, Szenen- oder Songbahnkomponenten.

## Referenzen

- Jomor Design: https://www.jomor.design/
- Paul Kalkbrenner: https://www.paulkalkbrenner.net/
