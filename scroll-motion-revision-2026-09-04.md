# Scrollbewegung Revision – P34nuts Homepage

## Changed

Das globale runde P34nuts-Wasserzeichen bewegt sich nun beim Scrollen deutlich nach unten, dreht sich über die gesamte Scrollstrecke mehrfach und pulsiert zusätzlich über eine langsame, unabhängige Skalierungs-/Deckkraftanimation. Die Bewegung wird auf Desktop und Mobilgeräten sichtbar gehalten und bei `prefers-reduced-motion` deaktiviert.

Zusätzlich wurde die frühere Abschnittskomposition zu einer homepageweiten dekorativen Editorialebene erweitert. Große P34NUTS-/MUSIC-/VISUALS-/ARCHIVE-Typografie und drei vorhandene P34nuts-Bildframes bewegen sich abhängig vom globalen Scrollfortschritt mit unterschiedlichen horizontalen und vertikalen Geschwindigkeiten. Die Ebene liegt hinter der Navigation und bleibt pointer-frei.

## Reason

Der Nutzer wollte für das runde Wasserzeichen die Kombination aus Abwärtsbewegung, Drehung und Pulsieren der Oreo-Referenz und anschließend eine Jomor-inspirierte Scrollsprache über die ganze Homepage. Die Umsetzung ist eine eigenständige P34nuts-Interpretation; es wurden keine fremden Assets oder Texte übernommen.

## Result

Das Wasserzeichen ist auf Mobilgeräten mit einer sichtbaren Größe und Deckkraft versehen. Die Editorialebene sorgt über die gesamte Seite für eine zusammenhängende Scrollbewegung, ohne Navigation, Musiksteuerung, Formulare oder Links zu blockieren. Auf Mobilgeräten sind die Typografie und Frames kleiner und transparenter. Bei reduzierter Bewegung wird die globale Editorialebene ausgeblendet und die Pulsanimation deaktiviert.

## Prüfung

`pnpm check`, `pnpm build` und `git diff --check` waren erfolgreich. Der Build meldet weiterhin die bereits bestehende Laufzeit-Auflösung des Manus-Storage-Storm-Assets sowie den bestehenden Chunk-Hinweis; beides wurde durch diese Änderung nicht verschlechtert. Die Root-Pages-Veröffentlichung muss nach dem Source-Push erneut über das Root-Pages-Repository ausgelöst werden.

## Referenzen

- Oreo-Referenz: https://oreo-the-playful-network.webflow.io/
- Jomor-Referenz: https://www.jomor.design/
