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
    });
    if (players[0]?.id === playerId && !started.current) { started.current = true; send(roomId, "bomb_state", { owner: playerId, expires: Date.now() + 12000 }); }
    const clock = window.setInterval(() => {
      const left = Math.max(0, Number(((expires - Date.now()) / 1000).toFixed(1)));
      setSeconds(Math.ceil(left));
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

const questions = [{ question: "Was ist die Hauptstadt von Australien?", answer: "Canberra" }, { question: "Welches Tier kann seine Farbe wechseln?", answer: "Chamäleon" }, { question: "Wie viele Seiten hat ein Würfel?", answer: "Sechs" }];
export function BluffQuizGame({ roomId, playerId, players, onResult, onDone }: Props) {
  const quiz = useMemo(() => questions[hash(roomId) % questions.length], [roomId]);
  const [text, setText] = useState(""); const [answers, setAnswers] = useState<Record<string, string>>({}); const [votes, setVotes] = useState<Record<string, string>>({}); const [phase, setPhase] = useState<"write" | "vote" | "done">("write"); const [score, setScore] = useState(0); const finished = useRef(false);
  useEffect(() => { const channel = subscribeToRoom(roomId, () => undefined, event => { if (event.type === "bluff_answer") setAnswers(old => ({ ...old, [String(event.payload.playerId)]: String(event.payload.answer) })); if (event.type === "bluff_vote") setVotes(old => ({ ...old, [String(event.payload.playerId)]: String(event.payload.answer) })); }); return () => { void removeSubscription(channel); }; }, [roomId]);
  useEffect(() => { if (phase === "write" && Object.keys(answers).length >= players.length) setPhase("vote"); }, [answers, phase, players.length]);
  useEffect(() => { if (phase !== "vote" || Object.keys(votes).length < players.length || finished.current) return; finished.current = true; const correctVotes = Object.values(votes).filter(value => value === quiz.answer).length; const fakeVotes = Object.values(votes).filter(value => value !== quiz.answer).reduce((count, value) => count + (Object.values(answers).filter(answer => answer === value).length ? 1 : 0), 0); const ownAnswer = answers[playerId]; const total = (votes[playerId] === quiz.answer ? 1 : 0) + Object.values(votes).filter(value => value === ownAnswer && ownAnswer !== quiz.answer).length; setScore(total); void correctVotes; void fakeVotes; send(roomId, "result", { playerId, game: "bluffquiz", value: total }); onResult(playerId, total); setPhase("done"); window.setTimeout(onDone, 800); }, [answers, onDone, onResult, phase, playerId, players.length, quiz.answer, roomId, votes]);
  const submit = () => { const value = text.trim().slice(0, 80); if (!value || answers[playerId]) return; send(roomId, "bluff_answer", { playerId, answer: value }); setAnswers(old => ({ ...old, [playerId]: value })); setText(""); };
  const options = Array.from(new Set([...Object.values(answers), quiz.answer]));
  return <div className="game-stage bluff-stage"><div className="stage-title"><span>BLUFF QUIZ / 10</span><span>{phase === "write" ? "ANTWORT ERFINDEN" : phase === "vote" ? "ABSTIMMEN" : `${score} PUNKTE`}</span></div><h2>{quiz.question}</h2>{phase === "write" ? <div className="bluff-write">{answers[playerId] ? <p className="game-help">Deine Antwort ist gespeichert. Warte auf die anderen Spieler …</p> : <><input value={text} maxLength={80} placeholder="Deine ausgedachte Antwort …" onChange={event => setText(event.target.value)} /><button className="game-primary" onClick={submit}>ANTWORT ABSENDEN</button></>}</div> : <div className="bluff-options">{options.map(option => <button key={option} className="game-option" disabled={phase === "done" || Boolean(votes[playerId])} onClick={() => { send(roomId, "bluff_vote", { playerId, answer: option }); setVotes(old => ({ ...old, [playerId]: option })); }}>{option}</button>)}</div>}<p className="game-help">Die echte Antwort gibt einen Punkt. Für jede erfundene Antwort, die gewählt wird, erhält ihr Verfasser ebenfalls einen Punkt.</p></div>;
}
