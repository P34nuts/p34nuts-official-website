# P34nuts GitHub-Pages-Transfer

Dieses Paket enthält den geprüften Quellstand der P34nuts Artist Homepage einschließlich des Gästebuchs mit Sofortveröffentlichung und sieben anonymen Reaktionsarten.

## Zielrepository

`P34nuts/p34nuts-official-website`

## Letzte lokale Prüfungen

TypeScript ohne Fehler, gezielte Gästebuch-/GitHub-Pages-Tests erfolgreich und der Produktionsbuild `pnpm run build:github-pages` erfolgreich. Die öffentliche Root-Pages-Seite wird weiterhin über das separate Repository `P34nuts/p34nuts.github.io` mit dem Workflow aus `.github/workflows/deploy-root-pages.yml` gebaut. Dieser Workflow bezieht den Quellstand aus `P34nuts/p34nuts-official-website` und nutzt als API-Ursprung `https://p34nutsart-jjmeco2k.manus.space`.

## Übertragung mit GitHub Desktop

1. Dieses Paket entpacken.
2. Den Inhalt des entpackten Ordners als Arbeitsstand des geklonten Repositories `P34nuts/p34nuts-official-website` verwenden. Die vorhandene `.github`-Struktur des Zielrepositories beibehalten.
3. In GitHub Desktop das Repository auswählen und die Änderungen prüfen.
4. Als Commit-Nachricht verwenden: `Publish direct guestbook and reactions`.
5. Auf **Push origin** klicken.
6. Danach unter **Actions** den Workflow `Deploy P34nuts Pages` öffnen und den erfolgreichen Lauf abwarten.

## Gästebuchverhalten

Neue Einträge werden direkt sichtbar. Honeypot, Eingabeprüfung und Rate-Limit bleiben aktiv. Reaktionen sind anonym und werden pro Eintrag, Reaktionsart und Browser-Fingerprint nur einmal gespeichert. Es werden keine Roh-IP-Adressen gespeichert.

## Sicherheit

Dieses Paket enthält keine `.env`-Dateien, keine API-Schlüssel, keine Passwörter und keine Session-Cookies. Zugangsdaten dürfen nicht in GitHub committed werden.

## Noch offene, unabhängige Punkte

Die rechtsverbindlichen Anbieterangaben, der spätere PayPal.Me-Link und die GitHub-Schreibberechtigung sind nicht Bestandteil dieses Pakets.
