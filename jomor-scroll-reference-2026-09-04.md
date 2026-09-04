# Jomor-Scrollreferenz – Beobachtung

Die mobile/vertikale Jomor-Startseite arbeitet mit einer übergroßen typografischen Komposition. Große Worte wie „HIGH END DIGITAL EXPERIENCES“ bilden die Bühne; mehrere Bildflächen liegen zwischen oder über den Buchstaben. Beim Scrollen verschieben sich die Bild-/Formelemente relativ zur Typografie und erzeugen den Eindruck einer lebenden Editorial-Komposition. Die Navigation bleibt reduziert und sichtbar.

Für P34nuts wird daraus keine Kopie. Die eigenständige Übertragung soll die vorhandene dunkle Skyline beibehalten und mit einem großen P34NUTS-Schriftzug, dem runden Wasserzeichen und wenigen eigenen Release-Bildflächen arbeiten. Die Bewegung wird scrollgebunden, langsam und mobile-first umgesetzt. Die Inhalte müssen auch ohne Bewegung verständlich bleiben; bei prefers-reduced-motion bleiben die Elemente statisch.

Referenz: https://www.jomor.design/

## Ergänzte Scrollbeobachtung

Die Referenz wirkt nicht wie eine Folge separater Karten, sondern wie ein langer, zusammenhängender visueller Raum. Die übergroße Typografie bleibt als räumliche Grundstruktur stehen, während einzelne Bildflächen beim Scrollen versetzt erscheinen, aus dem Bild laufen und durch andere Frames ersetzt werden. Ein Abschnitt geht dadurch in den nächsten über, ohne dass eine harte Kante oder ein komplett neues Layout die Bewegung stoppt. Die wiederkehrende Navigation bleibt an der Oberkante reduziert sichtbar.

Die sinnvolle P34nuts-Übertragung ist daher eine scrollgebundene, sticky-artige „Signal Stage“ zwischen den Hauptinhalten: ein dunkler visueller Raum mit P34NUTS-Typografie, Wasserzeichen und wenigen vorhandenen Bildframes, deren Position und Transparenz sich entlang des Scrollfortschritts verändern. Die Bühne bleibt innerhalb der Homepage begrenzt und wird zwischen den vorhandenen Inhaltsblöcken weich ein- und ausgeblendet, statt den gesamten Seiteninhalt mit einer dauerhaft schwebenden Ebene zu überdecken.

## Weitere Beobachtung

Im weiteren Verlauf wird die Typografie nicht einfach durch einen neuen rechteckigen Abschnitt ersetzt. Eine große, weich abgerundete Bild-/Flächenform bleibt noch im oberen Teil sichtbar, während darunter eine dunkle Fläche mit gebogener Oberkante in den Viewport wächst. Der Wechsel fühlt sich dadurch wie ein räumliches Übergleiten an. Für P34nuts ist die passende Übersetzung eine Folge von „Frame“-Übergängen mit überlappenden, abgerundeten Flächen und gebogenen Masken; nicht eine dauerhaft über den gesamten Inhalt gelegte Floating-Ebene.

## Abgleich mit der aktuellen P34nuts-Live-Seite

Die aktuelle P34nuts-Seite besitzt bereits den passenden Grundrhythmus: Hero mit Skyline, rotes Marquee-Band, dunkle Album-/Audiofläche und eine hellere, weich gerundete Einstiegsebene. Die nächste Ausbaustufe sollte die vorhandenen Flächen beim Scrollen stärker ineinander schieben: die dunkle Albumfläche kann beim Verlassen leicht skalieren und nach oben auslaufen, die helle Entry-Fläche kann mit einer gebogenen Maske einlaufen, und Bildkarten können während des Übergangs leicht aus dem vorherigen Bereich in den nächsten driften. Die gute globale Wasserzeichenbewegung bleibt dabei separat.

## Präzisierte Übergangsbeobachtung für die Umsetzung

Beim Übergang der Jomor-Startkomposition zur nächsten Fläche bleibt die große Typografie als Bühne sichtbar, während eine dunkle, stark gerundete Bild-/Flächenmaske aus dem unteren Bereich nach oben übernimmt. Der Eindruck entsteht nicht durch viele unabhängig wackelnde Abschnitte, sondern durch eine einzige kontrollierte Übergabefläche pro Szene. Die Projektlinks Métrica, Stellar, Loeven Morcel und Priestess sind Teil einer fortlaufenden Projektstrecke; jeder Wechsel nutzt eine neue dominante Fläche beziehungsweise einen Bildblock, während die vorherige Komposition kontrolliert aus dem Fokus gleitet. Für P34nuts bedeutet das: wenige gezielte, gebundene Übergabebühnen zwischen wichtigen Inhaltsgruppen statt Transform-Animationen auf jedem einzelnen Abschnitt.

## Newsletter-/Songstrecken-Prinzip nach Paul Kalkbrenner

Der Newsletterbereich der Paul-Kalkbrenner-Seite arbeitet vor dem Formular mit einer langen Bildstrecke aus wiederholten, gleich hohen Hochformatbildern. Die Strecke wirkt als kinetische Inhaltsbrücke und ist horizontal angelegt. Für P34nuts wird dieses Prinzip nicht als Newsletter-Kopie, sondern als zugängliche Songstrecke im bestehenden ALL-FRAMES-Bereich umgesetzt: Alle 23 bestehenden Track-Cover bleiben echte Buttons beziehungsweise Links. Ein scrollgebundener Horizontal-Offset führt die Strecke beim Scrollen nach unten nach rechts und beim Scrollen nach oben nach links. Auf Mobilgeräten wird die Strecke visuell begrenzt, scrollt weiterhin richtungsgebunden, bleibt aber vollständig per Touch, Tastatur und direktem Klick bedienbar.

## Ergänzung aus der Projektstrecke

Die Jomor-Projektansicht stellt die Folgeprojekte als klar kuratierte Strecke bereit (beispielsweise Métrica mit anschließenden Projektzielen bis Stellar). Die technische Browseransicht liefert für den tiefen Scrollcontainer keine belastbare weitere Bewegung, bestätigt aber das relevante Navigationsprinzip: Jede neue Projektfläche ist eine eigene, dominante Szene. Die P34nuts-Umsetzung soll darum nicht alle Abschnitte laufend skalieren, sondern nur wenige definierte Übergabe-Szenen zwischen Inhaltsgruppen nutzen und die 23 Trackkader in einer klaren, gerichteten Bahn führen.
