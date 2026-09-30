import { useEffect, useMemo, useRef, useState } from "react";
import { emitRoomEvent, removeSubscription, subscribeToRoom, type Player } from "@/games/multiplayer";

type Props = { roomId: string; playerId: string; players: Player[]; onResult: (id: string, value: number) => void; onDone: () => void };
const send = (roomId: string, type: string, payload: Record<string, unknown>) => void emitRoomEvent(roomId, type, payload);

export function BombPassGame({ roomId, playerId, players, onResult, onDone }: Props) {
  const [owner, setOwner] = useState(players[0]?.id ?? playerId);
  const [expires, setExpires] = useState(Date.now() + 12000);
  const [seconds, setSeconds] = useState(12);
  const [finished, setFinished] = useState(false);
  const started = useRef(false);
  const finishRef = useRef(false);
  useEffect(() => {
    const channel = subscribeToRoom(roomId, () => undefined, event => {
      if (event.type !== "bomb_state") return;
      setOwner(String(event.payload.owner)); setExpires(Number(event.payload.expires));
    }, `bomb-room:${roomId}`);
    if (players[0]?.id === playerId && !started.current) { started.current = true; send(roomId, "bomb_state", { owner: playerId, expires: Date.now() + 12000 }); }
    const clock = window.setInterval(() => {
      const left = Math.max(0, Number(((expires - Date.now()) / 1000).toFixed(1)));
      setSeconds(Math.ceil(left));
      if (owner === "computer-bot" && left < 1.2 && left > 0.7) {
        const index = players.findIndex(player => player.id === "computer-bot");
        const next = players[(index + 1) % players.length]?.id ?? playerId;
        send(roomId, "bomb_state", { owner: next, expires: Date.now() + 9000 });
      }
      if (left <= 0 && owner === playerId && !finishRef.current) { finishRef.current = true; setFinished(true); send(roomId, "result", { playerId, game: "bombpass", value: 0 }); onResult(playerId, 0); window.setTimeout(onDone, 500); }
    }, 100);
    return () => { void removeSubscription(channel); window.clearInterval(clock); };
  }, [roomId, playerId, players, owner, expires, onDone, onResult]);
  const pass = () => { if (owner !== playerId || finished) return; const index = players.findIndex(player => player.id === playerId); const next = players[(index + 1) % players.length]?.id ?? playerId; send(roomId, "bomb_state", { owner: next, expires: Date.now() + 9000 }); };
  return <div className="game-stage bomb-stage"><div className="stage-title"><span>BOMB PASS / 07</span><span>{players.length} PLAYERS</span></div><div className={`bomb-core ${owner === playerId ? "local" : ""}`}><strong>{seconds}</strong><span>{owner === playerId ? "WEITERGEBEN!" : `${players.find(p => p.id === owner)?.nickname ?? "SPIELER"} HÄLT DIE BOMBE`}</span></div><button className="game-primary" disabled={owner !== playerId || finished} onClick={pass}>{owner === playerId ? "BOMBE WEITERGEBEN ↗" : "WARTEN …"}</button><p className="game-help">Gib die Bombe weiter, bevor der Countdown abläuft. Wer sie beim Ablauf hält, scheidet aus.</p></div>;
}

export function AimTrainerGame({ roomId, playerId, onResult, onDone }: Props) {
  const [target, setTarget] = useState({ x: 50, y: 50 });
  const [hits, setHits] = useState(0); const [seconds, setSeconds] = useState(15); const done = useRef(false); const hitsRef = useRef(0); hitsRef.current = hits;
  useEffect(() => { const clock = window.setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000); const finish = window.setTimeout(() => { if (done.current) return; done.current = true; send(roomId, "result", { playerId, game: "aim", value: hitsRef.current }); onResult(playerId, hitsRef.current); window.setTimeout(onDone, 400); }, 15000); return () => { window.clearInterval(clock); window.clearTimeout(finish); }; }, [roomId, playerId, onDone, onResult]);
  const hit = () => { if (done.current) return; setHits(value => value + 1); setTarget({ x: 10 + Math.random() * 80, y: 12 + Math.random() * 76 }); };
  return <div className="game-stage aim-stage"><div className="stage-title"><span>AIM TRAINER / 08</span><span>{seconds}s · {hits} HITS</span></div><div className="aim-board"><button className="aim-target" style={{ left: `${target.x}%`, top: `${target.y}%` }} onClick={hit} aria-label="Ziel treffen" /></div><p className="game-help">Treffe so viele Ziele wie möglich. Jeder Treffer zählt einen Punkt.</p></div>;
}

const hash = (value: string) => Array.from(value).reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 17);
export function HigherLowerGame({ roomId, playerId, onResult, onDone }: Props) {
  const [round, setRound] = useState(0); const [current, setCurrent] = useState(() => 10 + (hash(roomId) % 70)); const [score, setScore] = useState(0); const [locked, setLocked] = useState(false); const scoreRef = useRef(0); const done = useRef(false);
  const nextNumber = (index: number) => 10 + (hash(`${roomId}:${index}`) % 90);
  const choose = (guess: "higher" | "lower") => { if (locked || done.current) return; const next = nextNumber(round + 1); const correct = guess === "higher" ? next > current : next < current; const nextScore = scoreRef.current + (correct ? 1 : 0); scoreRef.current = nextScore; setScore(nextScore); setLocked(true); window.setTimeout(() => { if (round >= 7) { done.current = true; send(roomId, "result", { playerId, game: "higherlower", value: nextScore }); onResult(playerId, nextScore); window.setTimeout(onDone, 400); } else { setCurrent(next); setRound(value => value + 1); setLocked(false); } }, 650); };
  return <div className="game-stage higher-stage"><div className="stage-title"><span>HIGHER / LOWER / 09</span><span>ROUND {round + 1}/8 · {score} P</span></div><div className="higher-number">{current}</div><p>Wird die nächste Zahl höher oder niedriger?</p><div className="higher-actions"><button className="game-primary" disabled={locked} onClick={() => choose("higher")}>HÖHER ↑</button><button className="game-secondary" disabled={locked} onClick={() => choose("lower")}>NIEDRIGER ↓</button></div></div>;
}

const questions = [
{ question: "Welches Tier kann fliegen und schläft kopfüber?", answer: "Fledermaus" },
{ question: "Welches Tier gilt als König der Tiere?", answer: "Löwe" },
{ question: "Welches Tier hat einen langen Rüssel?", answer: "Elefant" },
{ question: "Welche Frucht ist gelb und krumm?", answer: "Banane" },
{ question: "Welcher Planet ist der Erde am nächsten?", answer: "Venus" },
{ question: "Welcher Planet ist der größte?", answer: "Jupiter" },
{ question: "Welche Farbe entsteht aus Blau und Gelb?", answer: "Grün" },
{ question: "Welches Tier sagt „Miau“?", answer: "Katze" },
{ question: "Welches Tier bellt?", answer: "Hund" },
{ question: "Welches Tier macht „Muh“?", answer: "Kuh" },
{ question: "Welches Tier legt Eier und schwimmt?", answer: "Ente" },
{ question: "Welches Tier trägt sein Haus auf dem Rücken?", answer: "Schnecke" },
{ question: "Welches Tier ist sehr langsam?", answer: "Faultier" },
{ question: "Welches Tier kann seine Farbe ändern?", answer: "Chamäleon" },
{ question: "Welches Tier hat schwarze und weiße Streifen?", answer: "Zebra" },
{ question: "Welcher Vogel kann nicht fliegen?", answer: "Pinguin" },
{ question: "Welches Tier lebt im Meer und hat acht Arme?", answer: "Oktopus" },
{ question: "Welches Tier produziert Honig?", answer: "Biene" },
{ question: "Welches Insekt leuchtet nachts?", answer: "Glühwürmchen" },
{ question: "Welches Tier hat Stacheln?", answer: "Igel" },
{ question: "Welche Jahreszeit kommt nach dem Sommer?", answer: "Herbst" },
{ question: "Welcher Monat hat die wenigsten Tage?", answer: "Februar" },
{ question: "Welcher Wochentag kommt nach Freitag?", answer: "Samstag" },
{ question: "Welche Himmelsrichtung zeigt die Sonne morgens?", answer: "Osten" },
{ question: "Welcher Kontinent ist der größte?", answer: "Asien" },
{ question: "Welches Land hat die Form eines Stiefels?", answer: "Italien" },
{ question: "Welche Stadt ist Hauptstadt von Frankreich?", answer: "Paris" },
{ question: "Welche Stadt ist Hauptstadt von Deutschland?", answer: "Berlin" },
{ question: "Welcher Fluss fließt durch Ägypten?", answer: "Nil" },
{ question: "Welcher Berg ist der höchste?", answer: "Everest" },
{ question: "Welche Sportart spielt man mit einem runden Ball und Toren?", answer: "Fußball" },
{ question: "Welche Sportart hat einen Korb?", answer: "Basketball" },
{ question: "Welche Sportart wird im Wasser gemacht?", answer: "Schwimmen" },
{ question: "Welche Sportart fährt man auf Schnee?", answer: "Skifahren" },
{ question: "Welches Gerät zeigt die Uhrzeit?", answer: "Uhr" },
{ question: "Welches Gerät macht Fotos?", answer: "Kamera" },
{ question: "Welches Gerät kühlt Lebensmittel?", answer: "Kühlschrank" },
{ question: "Welches Gerät saugt Staub?", answer: "Staubsauger" },
{ question: "Welches Gerät zeigt Filme?", answer: "Fernseher" },
{ question: "Welches Gerät benutzt man zum Telefonieren?", answer: "Handy" },
{ question: "Was fällt im Winter vom Himmel?", answer: "Schnee" },
{ question: "Was sieht man nachts am Himmel?", answer: "Sterne" },
{ question: "Was spendet Licht am Tag?", answer: "Sonne" },
{ question: "Was braucht Feuer zum Brennen?", answer: "Sauerstoff" },
{ question: "Was trinken Menschen zum Überleben?", answer: "Wasser" },
{ question: "Was essen Bienen?", answer: "Nektar" },
{ question: "Was produziert eine Kuh?", answer: "Milch" },
{ question: "Was produziert ein Huhn?", answer: "Ei" },
{ question: "Was wächst auf Bäumen?", answer: "Obst" },
{ question: "Was macht ein Vulkan?", answer: "Ausbruch" },
{ question: "Welche Farbe hat Schnee meistens?", answer: "Weiß" },
{ question: "Welche Farbe hat Gras?", answer: "Grün" },
{ question: "Welche Farbe hat Kohle?", answer: "Schwarz" },
{ question: "Welche Farbe hat eine Zitrone?", answer: "Gelb" },
{ question: "Welche Farbe hat Blut?", answer: "Rot" },
{ question: "Welche Farbe hat der Himmel?", answer: "Blau" },
{ question: "Welches Material ist sehr hart?", answer: "Diamant" },
{ question: "Welches Metall ist flüssig?", answer: "Quecksilber" },
{ question: "Welches Material schwimmt auf Wasser?", answer: "Holz" },
{ question: "Was macht ein Hund mit dem Schwanz?", answer: "Wedeln" },
{ question: "Was macht ein Vogel mit Flügeln?", answer: "Fliegen" },
{ question: "Was macht ein Fisch im Wasser?", answer: "Schwimmen" },
{ question: "Was macht ein Mensch nachts?", answer: "Schlafen" },
{ question: "Was macht ein Baby meistens?", answer: "Weinen" },
{ question: "Was macht man mit Essen?", answer: "Essen" },
{ question: "Was macht man mit einem Buch?", answer: "Lesen" },
{ question: "Was macht man mit Musik?", answer: "Hören" },
{ question: "Was macht man mit einem Stift?", answer: "Schreiben" },
{ question: "Was macht man mit einem Ball?", answer: "Werfen" },
{ question: "Was macht man mit einer Tür?", answer: "Öffnen" },
{ question: "Welches Organ pumpt Blut?", answer: "Herz" },
{ question: "Welches Organ denkt?", answer: "Gehirn" },
{ question: "Welches Organ sieht?", answer: "Auge" },
{ question: "Welches Organ hört?", answer: "Ohr" },
{ question: "Welches Organ schmeckt?", answer: "Zunge" },
{ question: "Wie nennt man gefrorenes Wasser?", answer: "Eis" },
{ question: "Wie nennt man Wasser am Himmel?", answer: "Wolke" },
{ question: "Wie nennt man flüssiges Gestein?", answer: "Lava" },
{ question: "Wie nennt man einen jungen Hund?", answer: "Welpe" },
{ question: "Wie nennt man ein junges Pferd?", answer: "Fohlen" },
{ question: "Wie nennt man ein junges Schaf?", answer: "Lamm" },
{ question: "Wie nennt man ein Haus für Bienen?", answer: "Bienenstock" },
{ question: "Wie nennt man ein Haus für Vögel?", answer: "Nest" },
{ question: "Wie nennt man einen Arzt für Tiere?", answer: "Tierarzt" },
{ question: "Wie nennt man einen Menschen im Weltall?", answer: "Astronaut" },
{ question: "Wie nennt man ein Fahrzeug im Wasser?", answer: "Schiff" },
{ question: "Wie nennt man ein Fahrzeug in der Luft?", answer: "Flugzeug" },
{ question: "Wie nennt man ein Fahrzeug auf Schienen?", answer: "Zug" },
{ question: "Wie nennt man ein Fahrzeug mit zwei Rädern?", answer: "Fahrrad" },
{ question: "Wie nennt man ein Fahrzeug mit Motor und zwei Rädern?", answer: "Motorrad" },
{ question: "Wie nennt man eine große Ansammlung von Sternen?", answer: "Galaxie" },
{ question: "Wie nennt man den Mittelpunkt der Erde?", answer: "Kern" },
{ question: "Wie nennt man die Kraft, die uns auf der Erde hält?", answer: "Gravitation" },
{ question: "Wie nennt man gefrorenen Regen?", answer: "Hagel" },
{ question: "Wie nennt man starken Wind?", answer: "Sturm" },
{ question: "Wie nennt man Wasser aus Wolken?", answer: "Regen" },
{ question: "Wie nennt man leuchtende Kugeln am Himmel?", answer: "Sterne" },
{ question: "Welches Tier ist das größte der Erde?", answer: "Blauwal" },
{ question: "Welches Tier ist der schnellste Läufer?", answer: "Gepard" },
{ question: "Welches Tier baut Dämme?", answer: "Biber" },
{ question: "Welches Tier hat einen Panzer?", answer: "Schildkröte" },
{ question: "Welches Tier springt weit?", answer: "Känguru" },
{ question: "Welches Tier lebt in der Wüste?", answer: "Kamel" },
{ question: "Welches Tier hat Hörner und gibt Milch?", answer: "Ziege" },
{ question: "Welches Tier jagt Mäuse und miaut?", answer: "Katze" },
{ question: "Welches Tier ist giftig und schlängelt sich?", answer: "Schlange" },
{ question: "Welches Tier hat acht Beine?", answer: "Spinne" },
{ question: "Welcher Vogel kann menschliche Worte nachmachen?", answer: "Papagei" },
{ question: "Welches Tier ist rosa und hat lange Beine?", answer: "Flamingo" },
{ question: "Welches Tier hat einen Beutel?", answer: "Känguru" },
{ question: "Welches Tier schläft im Winter?", answer: "Bär" },
{ question: "Welches Tier lebt am Nordpol?", answer: "Eisbär" },
{ question: "Was trägt man an den Füßen?", answer: "Schuhe" },
{ question: "Was trägt man auf dem Kopf?", answer: "Hut" },
{ question: "Was trägt man im Winter?", answer: "Jacke" },
{ question: "Was schützt vor Regen?", answer: "Schirm" },
{ question: "Was benutzt man zum Zähneputzen?", answer: "Zahnbürste" },
{ question: "Was benutzt man zum Schreiben?", answer: "Stift" },
{ question: "Was benutzt man zum Schneiden?", answer: "Messer" },
{ question: "Was benutzt man zum Kochen?", answer: "Topf" },
{ question: "Was benutzt man zum Schlafen?", answer: "Bett" },
{ question: "Was benutzt man zum Waschen?", answer: "Seife" },
{ question: "Was ist die Hauptstadt von Spanien?", answer: "Madrid" },
{ question: "Was ist die Hauptstadt von Italien?", answer: "Rom" },
{ question: "Was ist die Hauptstadt von Japan?", answer: "Tokio" },
{ question: "Was ist die Hauptstadt von Österreich?", answer: "Wien" },
{ question: "Was ist die Hauptstadt von Polen?", answer: "Warschau" },
{ question: "Welches Getränk ist schwarz und enthält Koffein?", answer: "Kaffee" },
{ question: "Welches Getränk entsteht aus Trauben?", answer: "Wein" },
{ question: "Welches Lebensmittel ist rund und aus Teig?", answer: "Pizza" },
{ question: "Welches Lebensmittel ist gelb und wird aus Milch gemacht?", answer: "Käse" },
{ question: "Welches Lebensmittel essen viele morgens?", answer: "Brot" },
{ question: "Welches Gewürz macht Essen scharf?", answer: "Pfeffer" },
{ question: "Welches Gewürz ist gelb?", answer: "Curry" },
{ question: "Welcher Monat kommt nach März?", answer: "April" },
{ question: "Welcher Monat beendet das Jahr?", answer: "Dezember" },
{ question: "Welcher Tag kommt vor Sonntag?", answer: "Samstag" },
{ question: "Was zeigt eine Waage?", answer: "Gewicht" },
{ question: "Was zeigt ein Thermometer?", answer: "Temperatur" },
{ question: "Was misst ein Lineal?", answer: "Länge" },
{ question: "Was misst eine Uhr?", answer: "Zeit" },
{ question: "Was erzeugt eine Batterie?", answer: "Strom" },
{ question: "Was braucht ein Auto zum Fahren?", answer: "Benzin" },
{ question: "Was braucht eine Pflanze zum Leben?", answer: "Wasser" },
{ question: "Was braucht ein Mensch zum Atmen?", answer: "Sauerstoff" },
{ question: "Was beendet einen Film?", answer: "Abspann" },
{ question: "Was beginnt nach der Nacht?", answer: "Morgen" },
{ question: "Was scheint nachts am Himmel?", answer: "Mond" },
{ question: "Was wächst im Garten?", answer: "Blume" },
{ question: "Was öffnet man zum Betreten eines Hauses?", answer: "Tür" }
];
export function BluffQuizGame({ roomId, playerId, players, onResult, onDone }: Props) {
  const quiz = useMemo(() => questions[hash(roomId) % questions.length], [roomId]);
  const [text, setText] = useState(""); const [answers, setAnswers] = useState<Record<string, string>>({}); const [votes, setVotes] = useState<Record<string, string>>({}); const [phase, setPhase] = useState<"write" | "vote" | "done">("write"); const [score, setScore] = useState(0); const finished = useRef(false);
  useEffect(() => { const channel = subscribeToRoom(roomId, () => undefined, event => { if (event.type === "bluff_answer") setAnswers(old => ({ ...old, [String(event.payload.playerId)]: String(event.payload.answer) })); if (event.type === "bluff_vote") setVotes(old => ({ ...old, [String(event.payload.playerId)]: String(event.payload.answer) })); }, `bluff-room:${roomId}`); return () => { void removeSubscription(channel); }; }, [roomId]);
  useEffect(() => { if (phase === "write" && Object.keys(answers).length >= players.length) setPhase("vote"); }, [answers, phase, players.length]);
  useEffect(() => { if (phase !== "vote" || Object.keys(votes).length < players.length || finished.current) return; finished.current = true; const correctVotes = Object.values(votes).filter(value => value === quiz.answer).length; const fakeVotes = Object.values(votes).filter(value => value !== quiz.answer).reduce((count, value) => count + (Object.values(answers).filter(answer => answer === value).length ? 1 : 0), 0); const ownAnswer = answers[playerId]; const total = (votes[playerId] === quiz.answer ? 1 : 0) + Object.values(votes).filter(value => value === ownAnswer && ownAnswer !== quiz.answer).length; setScore(total); void correctVotes; void fakeVotes; send(roomId, "result", { playerId, game: "bluffquiz", value: total }); onResult(playerId, total); setPhase("done"); window.setTimeout(onDone, 800); }, [answers, onDone, onResult, phase, playerId, players.length, quiz.answer, roomId, votes]);
  const submit = () => { const value = text.trim().slice(0, 80); if (!value || answers[playerId]) return; send(roomId, "bluff_answer", { playerId, answer: value }); setAnswers(old => ({ ...old, [playerId]: value })); setText(""); };
  const options = Array.from(new Set([...Object.values(answers), quiz.answer]));
  return <div className="game-stage bluff-stage"><div className="stage-title"><span>BLUFF QUIZ / 10</span><span>{phase === "write" ? "ANTWORT ERFINDEN" : phase === "vote" ? "ABSTIMMEN" : `${score} PUNKTE`}</span></div><h2>{quiz.question}</h2>{phase === "write" ? <div className="bluff-write">{answers[playerId] ? <p className="game-help">Deine Antwort ist gespeichert. Warte auf die anderen Spieler …</p> : <><input value={text} maxLength={80} placeholder="Deine ausgedachte Antwort …" onChange={event => setText(event.target.value)} /><button className="game-primary" onClick={submit}>ANTWORT ABSENDEN</button></>}</div> : <div className="bluff-options">{options.map(option => <button key={option} className="game-option" disabled={phase === "done" || Boolean(votes[playerId])} onClick={() => { send(roomId, "bluff_vote", { playerId, answer: option }); setVotes(old => ({ ...old, [playerId]: option })); }}>{option}</button>)}</div>}<p className="game-help">Die echte Antwort gibt einen Punkt. Für jede erfundene Antwort, die gewählt wird, erhält ihr Verfasser ebenfalls einen Punkt.</p></div>;
}
