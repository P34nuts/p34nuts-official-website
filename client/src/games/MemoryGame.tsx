import { useEffect, useMemo, useRef, useState } from "react";
import { emitRoomEvent, removeSubscription, subscribeToRoom, type Player } from "@/games/multiplayer";

type Card = { id: number; symbol: string; pair: number };
type Move = { kind: "match" | "mismatch"; playerId: string; first: number; second: number };
const symbols = ["●", "▲", "■", "◆", "✦", "✚", "⬢", "✺", "☾", "✹"];

function seededDeck(roomId: string, pairs: number) {
  let seed = Array.from(roomId).reduce((value, char) => ((value * 31) + char.charCodeAt(0)) >>> 0, 17);
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const cards: Card[] = Array.from({ length: pairs }, (_, pair) => ({ id: pair * 2, symbol: symbols[pair], pair }));
  const deck = cards.flatMap((card) => [card, { ...card, id: card.id + 1 }]);
  for (let index = deck.length - 1; index > 0; index -= 1) { const swap = Math.floor(random() * (index + 1)); [deck[index], deck[swap]] = [deck[swap], deck[index]]; }
  return deck;
}

export default function MemoryGame({ roomId, playerId, players, onResult, onDone }: { roomId: string; playerId: string; players: Player[]; onResult: (id: string, value: number) => void; onDone: () => void }) {
  const pairs = Math.min(10, Math.max(3, players.length + 1));
  const deck = useMemo(() => seededDeck(roomId, pairs), [roomId, pairs]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [turn, setTurn] = useState(players[0]?.id ?? playerId);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const matchedRef = useRef<number[]>([]);
  const turnRef = useRef(turn);
  const movesRef = useRef(0);
  const finishedRef = useRef(false);
  const onResultRef = useRef(onResult);
  const onDoneRef = useRef(onDone);
  onResultRef.current = onResult;
  onDoneRef.current = onDone;
  matchedRef.current = matched;
  turnRef.current = turn;

  useEffect(() => {
    let channel: ReturnType<typeof subscribeToRoom> | undefined;
    channel = subscribeToRoom(roomId, () => undefined, (event) => {
      if (event.type !== "memory_move") return;
      const payload = event.payload as unknown as Move;
      if (payload.playerId === playerId && payload.first === payload.second) return;
      const nextMatched = payload.kind === "match" ? [...matchedRef.current, payload.first, payload.second] : matchedRef.current;
      setMatched(nextMatched);
      matchedRef.current = nextMatched;
      setFlipped(payload.kind === "match" ? [] : [payload.first, payload.second]);
      setLocked(payload.kind === "mismatch");
      const currentIndex = players.findIndex((player) => player.id === payload.playerId);
      const nextPlayer = payload.kind === "match" ? payload.playerId : players[(currentIndex + 1) % players.length]?.id ?? payload.playerId;
      setTurn(nextPlayer);
      turnRef.current = nextPlayer;
      movesRef.current += 1;
      setMoves(movesRef.current);
      if (payload.kind === "mismatch") window.setTimeout(() => { setFlipped([]); setLocked(false); }, 850);
      if (nextMatched.length >= deck.length && !finishedRef.current) {
        finishedRef.current = true;
        onResultRef.current(playerId, Math.max(1, nextMatched.filter((id) => deck[id]?.pair != null).length));
        window.setTimeout(() => onDoneRef.current(), 450);
      }
    });
    return () => { if (channel) void removeSubscription(channel); };
  }, [deck, playerId, players, roomId]);

  const choose = async (index: number) => {
    if (finishedRef.current || locked || turnRef.current !== playerId || matchedRef.current.includes(index) || flipped.includes(index)) return;
    const next = [...flipped, index];
    setFlipped(next);
    if (next.length < 2) return;
    const [first, second] = next;
    const kind = deck[first].pair === deck[second].pair ? "match" : "mismatch";
    setLocked(true);
    await emitRoomEvent(roomId, "memory_move", { kind, playerId, first, second });
  };

  const isVisible = (index: number) => flipped.includes(index) || matched.includes(index);
  return <div className="game-stage memory-stage"><div className="stage-title"><span>MEMORY / 06</span><span>{pairs * 2} KARTEN · {players.length} SPIELER</span></div><div className="memory-meta"><strong>{players.find((player) => player.id === turn)?.nickname ?? "Spieler"}</strong><span>{turn === playerId ? "DU BIST DRAN" : "IST DRAN"} · {moves} ZÜGE</span></div><div className="memory-board" style={{ gridTemplateColumns: `repeat(${pairs > 5 ? 6 : 4}, 1fr)` }}>{deck.map((card, index) => <button key={card.id} className={`memory-card ${isVisible(index) ? "visible" : ""} ${matched.includes(index) ? "matched" : ""}`} onClick={() => void choose(index)} aria-label={isVisible(index) ? `Karte ${card.symbol}` : "Verdeckte Karte"}><span>{isVisible(index) ? card.symbol : "?"}</span></button>)}</div><p className="memory-help">Finde gleiche Paare. Bei einem falschen Zug ist sofort der nächste Spieler dran. Bei einem Treffer bleibt dein Zug.</p><div className="stage-foot"><span>{matched.length / 2} / {pairs} PAARE</span><span>{turn === playerId ? "DEIN ZUG" : "WARTEN"}</span></div></div>;
}
