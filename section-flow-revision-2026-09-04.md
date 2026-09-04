# Organische Homepage-Übergänge – P34nuts

## Changed

Die zuvor als globale Floating-Editorialebene umgesetzte Jomor-inspirierte Komposition wurde vollständig zurückgenommen. `ScrollEditorialField`, `ScrollTypeComposition` und die zugehörigen Styles werden nicht mehr verwendet. Das vom Nutzer ausdrücklich gewünschte runde P34nuts-Wasserzeichen mit Scrollbewegung, Drehung und Pulsieren sowie das bereits positiv bewertete Wasserzeichen-Zwischenspiel bleiben aktiv.

Die Übergangslogik liegt nun direkt auf den echten Homepagebereichen. Ein kleiner `ScrollFlowController` ermittelt über `requestAnimationFrame` den Fortschritt und Fokus jedes tatsächlichen Abschnitts sowie der Marquee-Bänder und schreibt nur CSS-Variablen an diese Elemente. Nicht-Hero-Sektionen überlappen leicht, erhalten weiche gerundete Oberkanten, eine gebogene Licht-/Schattenkante und eine kontrollierte Aufwärtsbewegung beim Verlassen des Viewports. Marquee-Bänder liegen als verbindende Klammern zwischen den Bereichen.

## Reason

Der Nutzer empfand die frühere globale Editorialebene als nicht passend und wollte die eigentliche Jomor-Wirkung: eine zusammenhängende vertikale Dramaturgie, bei der ein Bereich in den nächsten hineinläuft. Die Umsetzung verwendet das Prinzip von Überlappung, weichen Flächenkanten und fortlaufenden Inhaltsbändern, ohne fremde Assets, Texte oder eine Kopie der Jomor-Seite zu übernehmen.

## Result

Die Seitenstruktur und alle vorhandenen Inhalte bleiben erhalten. Hero, Music, Manifest, Visuals, Gallery, Live, Contact, Guestbook, FAQ und Press werden beim Scrollen als benachbarte Flächen übergeben statt als harte Rechtecke getrennt. Links, Navigation, Musiksteuerungen, Formulare und Bildalternativtexte werden nicht durch eine globale Overlay-Ebene blockiert.

Auf Mobilgeräten werden Überlappung, Radius, Schatten und Bewegung reduziert. Der Controller verwendet keine zusätzlichen visuellen Ebenen und beendet sich bei `prefers-reduced-motion`; die CSS-Regeln setzen dann die Transformation zurück. Das gute runde Wasserzeichen bleibt eine separate, sichtbar kontrollierte Bewegung.

## Prüfung

`pnpm check`, `pnpm build` und `git diff --check` waren erfolgreich. Der Build meldet weiterhin den bereits bestehenden Manus-Storage-Hinweis für das Storm-Overlay und den bestehenden Chunk-Hinweis. Diese Meldungen sind nicht durch die Übergangskorrektur entstanden.

## Referenzen

- Oreo-Referenz für Wasserzeichenbewegung: https://oreo-the-playful-network.webflow.io/
- Jomor-Referenz für organische typografische und flächige Übergänge: https://www.jomor.design/
