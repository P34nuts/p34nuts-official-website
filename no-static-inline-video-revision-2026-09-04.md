# NO-STATIC-Effekte und stumme Inline-Videovorschauen

**Autor:** Manus AI  
**Datum:** 4. September 2026

## Changed – Reason – Result

| Changed | Reason | Result |
|---|---|---|
| Scrollbeschleunigung der 23-Song-Bahn auf Faktor 14 und maximal 760 zurückgesetzt | Die zuletzt erhöhte Scrollreaktion war zu schnell | Aktives Scrollen reagiert wieder wie in der zuvor positiv bewerteten Version |
| Leerlaufgeschwindigkeit auf 17 px/s mobil und 24 px/s Desktop erhöht | Gewünscht war eine schnellere Bewegung ausschließlich außerhalb aktiver Scrollimpulse | Die Cover laufen im Stillstand sichtbar schneller in der zuletzt festgelegten Richtung weiter |
| NO STATIC mit sechs individuellen Bewegungsprofilen erweitert | Die Bilder sollten lebendiger wirken, ohne das stabile mobile Seitenverhalten wieder zu verlieren | Versetzte Vertikal-/Horizontalbewegung, geringe Rotation, innere Bildtiefe, rote Scanlinie und Fokusrahmen für das zentrale Bild |
| Mobile NO-STATIC-Ausschläge auf 36 % der Desktopwerte begrenzt | Mobil darf die Galerie nicht wackelig wirken | Effekt bleibt sichtbar, aber deutlich ruhiger als auf Desktop |
| Fünf VISUALS-Vorschauen plus WATCH THE CUT als stumme Inline-Videos umgesetzt | Die vorhandenen Poster sollten bereits Bewegung zeigen | Sichtbare Karten laden ihren YouTube-No-Cookie-Player stumm, inline und in Schleife |
| Inline-Player auf den sichtbaren Bereich begrenzt | Sechs permanente YouTube-Player würden unnötig Daten und Rechenleistung verbrauchen | `IntersectionObserver` erstellt Player nur in beziehungsweise nahe der sichtbaren Sektion und entfernt sie außerhalb wieder |
| Vorschau und Dialog-Trigger strukturell getrennt | Ein iframe darf nicht innerhalb eines Buttons liegen | Valides HTML mit eigenständiger visueller Vorschau und vollflächigem Tastatur-/Klickbutton |
| Vorschau beim Öffnen der Großansicht entladen | Stumme Vorschau und Tonplayer sollen nicht gleichzeitig laufen | Nach Klick bleibt nur der große Player aktiv und startet über die Nutzerinteraktion mit Ton |
| Reduced-Motion-Fallback ergänzt | Nicht notwendige Bewegung muss abschaltbar bleiben | Posterbilder ersetzen automatische Videos; NO-STATIC-Transformationen und Scanlinie werden deaktiviert |

## Technische Prüfung

`pnpm check`, `pnpm build` und `git diff --check` wurden erfolgreich abgeschlossen. Im Katalog sind fünf VISUALS-YouTube-IDs und eine WATCH-THE-CUT-ID konfiguriert. Die große Dialogansicht verwendet eine eigene ungemutete Autoplay-URL und entfernt den Player beim Schließen.
