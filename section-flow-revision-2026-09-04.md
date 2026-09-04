# Organische Homepage-Übergänge – P34nuts

## Changed

Die zuvor als globale Floating-Editorialebene umgesetzte Jomor-inspirierte Komposition wurde vollständig zurückgenommen. `ScrollEditorialField`, `ScrollTypeComposition` und die zugehörigen Styles werden nicht mehr verwendet. Das vom Nutzer ausdrücklich gewünschte runde P34nuts-Wasserzeichen mit Scrollbewegung, Drehung und Pulsieren sowie das bereits positiv bewertete Wasserzeichen-Zwischenspiel bleiben aktiv.

Statt der entfernten Floating-Ebene wird die Übergangslogik direkt auf die echten Homepagebereiche angewandt. Nicht-Hero-Sektionen überlappen leicht, erhalten weiche gerundete Oberkanten und eine dezente gebogene Licht-/Schattenkante. Marquee-Bänder liegen als verbindende Klammern zwischen den Bereichen. Dadurch geht Hero, Musik, Archive, Visuals, Gallery, Live, Contact, Guestbook, FAQ und Press organischer ineinander über, ohne zusätzliche dauerhaft schwebende Bilder über den Inhalten.

## Reason

Der Nutzer empfand die vorherige globale Editorialebene als nicht passend und wollte die eigentliche Jomor-Wirkung: eine zusammenhängende vertikale Dramaturgie, bei der ein Bereich in den nächsten hineinläuft. Die Umsetzung verwendet das Prinzip von Überlappung, weichen Flächenkanten und fortlaufenden Inhaltsbändern, ohne die Jomor-Seite zu kopieren.

## Result

Die Seitenstruktur und alle vorhandenen Inhalte bleiben erhalten. Links, Navigation, Musiksteuerungen, Formulare und Bildalternativtexte werden nicht durch die Übergänge blockiert. Die vorhandene P34nuts-Farbwelt bleibt bestehen; der Übergang arbeitet mit den vorhandenen Hintergrundfarben und dezenten Kanten. Für mobile Geräte werden Überlappung, Radius und Abstände reduziert. Bei `prefers-reduced-motion` werden keine zusätzlichen bewegten Übergänge erzwungen.

## Prüfung

`pnpm check`, `pnpm build` und `git diff --check` waren erfolgreich. Der Build meldet weiterhin den bereits bestehenden Manus-Storage-Hinweis für das Storm-Overlay und den bestehenden Chunk-Hinweis. Diese Meldungen sind nicht durch die Übergangskorrektur entstanden.

## Referenzen

- Oreo-Referenz für Wasserzeichenbewegung: https://oreo-the-playful-network.webflow.io/
- Jomor-Referenz für organische typografische und flächige Übergänge: https://www.jomor.design/
