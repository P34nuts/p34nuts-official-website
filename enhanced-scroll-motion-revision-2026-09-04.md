# Verstärkte Scrollchoreografie und Endlossongbahn

**Autor:** Manus AI  
**Datum:** 4. September 2026

## Changed

Die drei kontrollierten Übergabebühnen wurden deutlich intensiviert. Desktop verwendet nun eine längere Sticky-Bühne, größere Typografie, ein stärker wachsendes und leicht kippendes Medienfenster, eine dynamische Rundung sowie eine unabhängige Tiefenbewegung innerhalb des Bildes. Die Homepagebereiche selbst werden auf Mobilgeräten weiterhin nicht global transformiert.

Mobil erhalten die drei isolierten Übergabebühnen nun ebenfalls eine erkennbare Scrollchoreografie. Die Bühne bleibt während eines kurzen, klar abgegrenzten Scrollabschnitts sticky. Typografie, Medienmaske und Bildtiefe bewegen sich mit kleineren Ausschlägen als auf Desktop. Dadurch ist die Wirkung sichtbar stärker, ohne wieder mehrere Inhaltsbereiche gleichzeitig zu verschieben.

Die ALL-FRAMES-Bahn besteht nun aus drei nahtlos aneinandergesetzten Durchläufen der 23 Trackkader. Der mittlere Durchlauf enthält die vollständigen Trackdialoge und bleibt mit Tastatur erreichbar. Die beiden visuellen Wiederholungen führen als anklickbare Links auf die jeweiligen Trackseiten. Beim Herunterscrollen beschleunigt die Bahn nach links; beim Hochscrollen beschleunigt sie nach rechts. Nach dem Scrollen bleibt eine langsame Bewegung in der zuletzt verwendeten Richtung bestehen. Ein modularer Offset verhindert einen sichtbaren Anfang oder Schluss.

## Reason

Die erneute Referenzanalyse zeigte, dass die starke Wirkung der Jomor-Seite vor allem aus einer langen Typografiebühne, klarer Z-Tiefe und einer einzelnen stark gerundeten Medienfläche entsteht, die vom unteren Rand nach oben wächst.[1] Mehr gleichzeitige Bewegungen würden insbesondere auf Mobilgeräten wieder instabil wirken.

Für die Songbahn war ein rein fortschrittsgebundener Einzelstreifen nicht ausreichend, weil er am Anfang oder Ende stoppen konnte. Die neue Endlosschleife erfüllt den gewünschten vollständigen Lauf und ergänzt die geforderte richtungsabhängige Trägheit.

## Result

| Bereich | Ergebnis |
|---|---|
| Desktop-Übergänge | Größer, tiefer, kontrastreicher und deutlich dramatischer |
| Mobile Übergänge | Sichtbar scrollgebunden, aber auf drei isolierte Szenen begrenzt |
| Songbahn nach unten | Beschleunigt nach links und driftet anschließend langsam weiter |
| Songbahn nach oben | Beschleunigt nach rechts und driftet anschließend langsam weiter |
| Durchlauflänge | Nahtlose Endlosschleife ohne sichtbaren Anfang oder Schluss |
| Klickbarkeit | Alle Hauptkarten öffnen Trackdialoge; sichtbare Schleifenkarten führen zu Trackseiten |
| Tastatur | Fokus pausiert die Drift und zentriert die fokussierte Hauptkarte |
| Reduced Motion | Keine automatische Bahnbewegung; eine manuell horizontal scrollbare Trackliste bleibt erhalten |

## Technische Prüfung

`pnpm check`, `pnpm build` und `git diff --check` waren erfolgreich. Die Bewegung nutzt ausschließlich `transform`, CSS-Variablen, `requestAnimationFrame` und einen einzelnen `IntersectionObserver` für die Songbahn. Die bestehenden alten globalen Editorialeffekte bleiben entfernt.

## References

[1]: https://www.jomor.design/ "Jomor Design – High-End Digital Experiences"

## Veröffentlichung und Live-Verifikation

Der Funktionscommit `5effcb3` wurde auf `main` veröffentlicht. Der Root-GitHub-Pages-Workflow `33875461130` hat exakt diesen Quellcommit ausgecheckt, gebaut und erfolgreich unter https://p34nuts.github.io/ veröffentlicht.

Nach Abschluss der CDN-Propagation liefert die Homepage `assets/index-Dir8ovB5.js` und `assets/index-CXQY0E81.css`. In diesen öffentlichen Bundles wurden `data-clone-position`, `trackDirection`, der Laufzeittext `idle keeps the last direction`, `scroll-track-rail-segment`, `--scene-mask-radius`, `--scene-image-scale`, die mobile Szenenhöhe von `122vh` sowie das weiterhin vorhandene `scroll-follow-watermark` verifiziert. Die früher zurückgenommenen Marker `scroll-editorial-field` und `scroll-type-composition` bleiben entfernt.
