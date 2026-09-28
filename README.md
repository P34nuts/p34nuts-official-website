# P34nuts Friends Game Room

Die Website enthält jetzt unter **`/games`** eine eigenständige Multiplayer-Minispiel-Plattform: Nickname wählen, Raum erstellen oder per 5-stelligem Code beitreten, Chat nutzen und gemeinsam Reaction oder Shake spielen.

## Was ist implementiert?

- echte Räume mit maximal 8 Spielern
- 5-stellige Einladungscodes
- Live-Spielerliste und Host-Erkennung
- automatische Host-Übergabe beim Verlassen
- Echtzeit-Chat
- synchroner Spielstart mit gemeinsamem Countdown
- **Reaction**: lokale Millisekundenmessung, zu frühes Drücken wird verworfen
- **Shake**: DeviceMotion API, 10-Sekunden-Runde und verständlicher Desktop-/Unsupported-Zustand
- Rangliste und Ergebnis-Synchronisierung
- Web Share API, ansonsten Clipboard-Fallback
- mobile-first UI, Touch-Events, optionale Vibration und reduzierte Bewegungen
- modulare Ereignis-Schnittstelle für spätere Spiele wie Tap, Memory, Typing und Math

Die Multiplayer-Funktion ist **nicht simuliert**. Sie verwendet Supabase Realtime. Fehlen die Konfigurationswerte, zeigt `/games` bewusst eine Konfigurationsmeldung statt eine Fake-Lobby an.

## Architektur-Optionen

| Ansatz | Tradeoffs | Kosten | Einrichtungsaufwand |
| --- | --- | --- | --- |
| **Supabase Realtime (implementiert)** | GitHub Pages bleibt statisch; Tabellen, Realtime und RLS an einem Ort; später gut erweiterbar | kostenloser Einstieg, Limits des Free-Tiers beachten | niedrig bis mittel |
| eigener WebSocket-Server | maximale Kontrolle und eigene Spielregeln; benötigt dauerhaft laufenden Server, Monitoring und Deployment | dauerhaftes Hosting erforderlich | hoch |
| Browser-only BroadcastChannel | kein Backend und praktisch keine Einrichtung, aber nur Tabs auf demselben Gerät; **kein echter Multiplayer** | kostenlos | niedrig, für diese Aufgabe nicht ausreichend |

## 1. Supabase-Projekt anlegen

1. Auf [supabase.com](https://supabase.com) ein kostenloses Projekt erstellen.
2. In **SQL Editor** den Inhalt von [`docs/games-supabase.sql`](docs/games-supabase.sql) ausführen.
3. Unter **Project Settings → API** die Werte `Project URL` und `anon public key` kopieren.
4. Unter **Database → Publications → supabase_realtime** prüfen, dass die Tabellen `rooms`, `room_players`, `room_messages` und `room_events` für Realtime aktiviert sind. Das SQL-Skript erledigt dies bereits, sofern die Publication vorhanden ist.

### Benötigte Tabellen

- `rooms`: Raumcode, Host, Status, ausgewähltes Spiel und Rundenzähler
- `room_players`: Nicknames, Avatar und Beitrittszeit
- `room_messages`: Chatnachrichten
- `room_events`: synchronisierte Start- und Ergebnisereignisse

Die RLS-Regeln erlauben nur die für einen namenlosen Spielraum erforderlichen öffentlichen Operationen. Nicknames sind keine verifizierten Identitäten und es werden keine Passwörter oder sensiblen Daten gespeichert.

## 2. Lokal testen

```bash
pnpm install
cp .env.example .env
# .env mit den Supabase-Werten ausfüllen
pnpm dev
```

Danach die Seite unter `http://localhost:5173/games` öffnen. Für einen echten Test mit Freunden muss die lokale Seite öffentlich erreichbar sein; einfacher ist der Test nach dem GitHub-Pages-Deployment.

### Umgebungsvariablen

```env
VITE_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
VITE_SUPABASE_ANON_KEY=dein-anon-public-key
```

Der `anon`-Key darf im Frontend verwendet werden. **Niemals** den `service_role`-Key in `.env`, GitHub Actions oder Client-Code eintragen.

## 3. GitHub Pages verbinden

Der bestehende Workflow `.github/workflows/deploy-pages.yml` enthält bereits die öffentliche Supabase-Projekt-URL und den öffentlichen Publishable-Key. Diese beiden Werte sind für den Frontend-Betrieb bestimmt und kein Server-Secret. Danach reicht ein Push auf `main`; GitHub Actions baut und veröffentlicht die Seite. Die Anwendung ist auf der bestehenden Website unter:

```text
https://p34nuts.github.io/p34nuts-official-website/games
```

verfügbar. Falls das Repository anders heißt, den Repository-Namen in der URL entsprechend ersetzen.

## 4. Supabase URL-Konfiguration

Unter **Authentication → URL Configuration** die GitHub-Pages-Origin als Site URL bzw. Additional Redirect URL ergänzen, falls das Projekt später Authentifizierung erhält. Für die jetzige nickname-basierte Nutzung ist keine Anmeldung nötig.

## Sicherheits- und Fairness-Hinweise

- Nicknames werden auf Länge und Zeichen bereinigt.
- Raumcodes sind auf fünf Zeichen begrenzt und werden serverseitig gesucht.
- Räume sind auf acht Spieler begrenzt.
- Chatnachrichten sind auf 240 Zeichen begrenzt.
- Reaction-Zeit wird mit `performance.now()` lokal gemessen; negative oder künstlich große Werte werden nicht als gültige lokale Messung erzeugt.
- Die aktuelle anonyme Architektur ist für Freundesrunden gedacht, nicht für kompetitives Anti-Cheat. Für öffentliche Turniere sollte ein Edge-/Server-Validator ergänzt werden.
- RLS schützt die Tabellen vor anonymem Vollzugriff auf fremde Daten; die Spielraum-Funktion benötigt absichtlich anonyme Insert-/Read-Rechte.

## Erweiterung um weitere Spiele

Neue Spiele sollten dieselbe Form verwenden wie `ReactionGame` und `ShakeGame`:

- lokaler Zustand und lokale Eingabemessung
- `emitRoomEvent(roomId, "result", { playerId, game, value })`
- keine Netzwerkabhängigkeit in der zeitkritischen Messung
- Ergebnis erst nach dem lokalen Versuch synchronisieren
- neue `GameId`-Variante in `client/src/games/multiplayer.ts`
- neue Auswahlkarte und Rendering-Zweig in `client/src/pages/Games.tsx`

## Verifikation

```bash
pnpm exec tsc --noEmit
pnpm build:github-pages
```

Der normale Build der Website bleibt unverändert; `/games` ist eine zusätzliche Route. Das Deployment kopiert weiterhin `dist/public/index.html` als `404.html`, damit auch direkte GitHub-Pages-Aufrufe von `/games` funktionieren.
