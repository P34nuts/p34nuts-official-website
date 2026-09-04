# Schnellere Songbahn und ASK→PRESS-Abschlussübergang

**Autor:** Manus AI  
**Datum:** 4. September 2026

## Changed – Reason – Result

| Changed | Reason | Result |
|---|---|---|
| Grundgeschwindigkeit der ALL-FRAMES-Bahn von 9/13 auf 13/18 Pixel pro Sekunde erhöht | Die langsame Bewegung sollte deutlicher wahrnehmbar sein | Die Cover bewegen sich in Ruhe sichtbar schneller, bleiben aber lesbar |
| Scrollbeschleunigung von Faktor 14 auf 18 und maximale Zusatzgeschwindigkeit von 760 auf 950 erhöht | Aktives Scrollen sollte deutlich mehr Energie übertragen | Die Bahn reagiert schneller auf Scrollimpulse und fällt anschließend weich auf die Grundgeschwindigkeit zurück |
| Drei vorhandene Übergabebühnen verstärkt | Die Übergänge sollten näher an der dramatischen räumlichen Wirkung der Referenz liegen | Größere Maskenbewegung, stärkere Tiefenverschiebung, größerer typografischer Gegenzug, mehr Rotation und längere Scrollstrecke |
| Eigene Schlussbühne zwischen ASK P34NUTS und PRESS KIT ergänzt | Gewünscht war das Prinzip des letzten Priestess→Kontakt-Übergangs | Eine helle stark gebogene Fläche wächst über die dunkle ASK-Ausgangsbühne; doppelte PRESS-KIT-Typografie übernimmt und führt in den echten Press-Bereich |
| PRESS KIT auf eine helle Abschlussfläche gestellt, Press-Kasten selbst dunkel gehalten | Der Referenzübergang lebt vom Kontrastwechsel hell/dunkel | Der tatsächliche Press-Inhalt bleibt gut lesbar und wirkt als Ziel der Übergabe |

## Referenzanalyse

Der letzte Übergang der Jomor-Priestess-Seite arbeitet mit einer großen hellen Fläche, die über eine stark gebogene Oberkante den letzten dunklen Bildinhalt überdeckt. Danach übernimmt eine doppelte, überbreite Kontakt-Typografie und führt in den reduzierten Footer.[1] Die P34nuts-Umsetzung überträgt dieses Prinzip eigenständig mit ASK P34NUTS als dunkler Ausgangsbühne, PRESS KIT als wiederholter Übergabetypografie und dem vorhandenen P34nuts-Zeichen als rotierender Schlussmarke.

## Barrierefreiheit und Stabilität

Die neue Schlussbühne ist aus der allgemeinen Bereichssteuerung ausgeschlossen und verwendet nur `transform`-basierte Scrollwerte. Auf Mobilgeräten sind Ausschläge, Typografie und Rundung angepasst. Bei `prefers-reduced-motion` wird die Bühne statisch dargestellt; die ASK-Ausgangsebene wird entfernt und der Press-Übergang bleibt als ruhige helle Karte sichtbar.

## Prüfung

`pnpm check`, `pnpm build` und `git diff --check` sind erfolgreich. Der vorhandene runde P34nuts-Wasserzeichen-Effekt bleibt unverändert.

## References

[1]: https://www.jomor.design/project/priestess "Priestess | Jomor Design"

## Veröffentlichung und Live-Verifikation

Der Funktionscommit `64790e3` wurde auf `main` veröffentlicht. Der Root-GitHub-Pages-Workflow `33877062256` ist erfolgreich abgeschlossen. Die öffentliche Homepage liefert danach `assets/index-8JlxIGwO.js` und `assets/index-G53czR5v.css` aus.

In den Live-Bundles wurden `final-press-transition`, `finalPressReady`, `--final-press-reveal-y`, der Textmarker der richtungsabhängigen Idle-Bewegung, `--scene-mask-radius` und das unveränderte `scroll-follow-watermark` verifiziert.
