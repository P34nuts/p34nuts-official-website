import { useEffect, useMemo, useRef, useState } from "react";
import { emitRoomEvent, removeSubscription, sendRoomBroadcast, subscribeToRoomBroadcast, type Player } from "@/games/multiplayer";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Cell = string | null;
type Piece = { shape: number[][]; color: string; x: number; y: number };
type TetrisState = { board: Cell[][]; piece: Piece; startedAt: number; over: boolean; lines: number };
const WIDTH = 10; const HEIGHT = 20;
const PIECES = [
  { shape: [[1, 1, 1, 1]], color: "cyan" }, { shape: [[1, 1], [1, 1]], color: "yellow" },
  { shape: [[0, 1, 0], [1, 1, 1]], color: "purple" }, { shape: [[1, 0, 0], [1, 1, 1]], color: "orange" },
  { shape: [[0, 0, 1], [1, 1, 1]], color: "blue" }, { shape: [[0, 1, 1], [1, 1, 0]], color: "green" }, { shape: [[1, 1, 0], [0, 1, 1]], color: "red" },
];
const blankBoard = () => Array.from({ length: HEIGHT }, () => Array<Cell>(WIDTH).fill(null));
const nextPiece = (): Piece => { const source = PIECES[Math.floor(Math.random() * PIECES.length)]; return { shape: source.shape.map(row => [...row]), color: source.color, x: Math.floor((WIDTH - source.shape[0].length) / 2), y: 0 }; };
const initialState = (): TetrisState => ({ board: blankBoard(), piece: nextPiece(), startedAt: performance.now(), over: false, lines: 0 });
const collides = (board: Cell[][], piece: Piece, dx = 0, dy = 0, shape = piece.shape) => shape.some((row, y) => row.some((cell, x) => cell && (piece.x + x + dx < 0 || piece.x + x + dx >= WIDTH || piece.y + y + dy >= HEIGHT || (piece.y + y + dy >= 0 && board[piece.y + y + dy][piece.x + x + dx]))));
const rotate = (shape: number[][]) => shape[0].map((_, x) => shape.map(row => row[x]).reverse());

export default function TetrisGame({ roomId, playerId, players, results, onResult, onDone }: { roomId: string; playerId: string; players: Player[]; results: Record<string, number>; onResult: (id: string, value: number) => void; onDone: () => void }) {
  const [game, setGame] = useState(initialState);
  const gameRef = useRef(game); const channelRef = useRef<RealtimeChannel | null>(null); const finished = useRef(false); const onDoneRef = useRef(onDone); onDoneRef.current = onDone; gameRef.current = game;
  const speedStage = Math.floor((performance.now() - game.startedAt) / 20000);
  const elapsed = Math.max(0, performance.now() - game.startedAt);
  const speed = Math.max(90, 620 * Math.pow(.8, speedStage));
  const localResultCount = Object.keys(results).length;
  const board = useMemo(() => { const next = game.board.map(row => [...row]); game.piece.shape.forEach((row, y) => row.forEach((cell, x) => { if (cell && game.piece.y + y >= 0 && game.piece.y + y < HEIGHT) next[game.piece.y + y][game.piece.x + x] = game.piece.color; })); return next; }, [game.board, game.piece]);

  useEffect(() => {
    const channel = subscribeToRoomBroadcast(roomId, payload => { if (payload.type === "tetris_result") onResult(String(payload.playerId), Number(payload.value)); }); channelRef.current = channel;
    return () => { channelRef.current = null; void removeSubscription(channel); };
  }, [onResult, roomId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setGame(current => {
        if (current.over) return current;
        if (!collides(current.board, current.piece, 0, 1)) return { ...current, piece: { ...current.piece, y: current.piece.y + 1 } };
        const merged = current.board.map(row => [...row]); current.piece.shape.forEach((row, y) => row.forEach((cell, x) => { if (cell && current.piece.y + y >= 0) merged[current.piece.y + y][current.piece.x + x] = current.piece.color; }));
        const cleared = merged.filter(row => row.some(cell => !cell)); const lines = HEIGHT - cleared.length; while (cleared.length < HEIGHT) cleared.unshift(Array<Cell>(WIDTH).fill(null));
        const piece = nextPiece(); const over = collides(cleared, piece);
        if (over && !finished.current) { finished.current = true; const survival = performance.now() - current.startedAt; onResult(playerId, survival); void emitRoomEvent(roomId, "result", { playerId, game: "tetris", value: survival }); if (channelRef.current) void sendRoomBroadcast(channelRef.current, { type: "tetris_result", playerId, value: survival }); window.setTimeout(() => { if (localResultCount + 1 >= players.length) onDoneRef.current(); }, 900); }
        return { ...current, board: cleared, piece, over, lines: current.lines + lines };
      });
    }, speed);
    return () => window.clearInterval(timer);
  }, [localResultCount, playerId, players.length, roomId, speed]);

  const move = (dx: number) => setGame(current => current.over || collides(current.board, current.piece, dx) ? current : { ...current, piece: { ...current.piece, x: current.piece.x + dx } });
  const drop = () => setGame(current => { if (current.over) return current; let distance = 0; while (!collides(current.board, current.piece, 0, distance + 1)) distance += 1; return { ...current, piece: { ...current.piece, y: current.piece.y + distance } }; });
  const turn = () => setGame(current => { const shape = rotate(current.piece.shape); return current.over || collides(current.board, current.piece, 0, 0, shape) ? current : { ...current, piece: { ...current.piece, shape } }; });
  useEffect(() => { const key = (event: KeyboardEvent) => { if (event.key === "ArrowLeft") move(-1); if (event.key === "ArrowRight") move(1); if (event.key === "ArrowDown") drop(); if (event.key === "ArrowUp") turn(); }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); });

  return <div className="game-stage tetris-stage"><div className="stage-title"><span>TETRIS / SOLO BOARD</span><span>{Math.floor(elapsed / 1000)} SEC · SPEED {speedStage + 1}</span></div><div className="tetris-layout"><div className="tetris-board" aria-label="Tetris Spielfeld">{board.flatMap((row, y) => row.map((cell, x) => <span key={`${x}-${y}`} className={`tetris-cell ${cell ?? ""}`} />))}</div><div className="tetris-stats"><strong>{game.over ? "OUT" : "PLAY"}</strong><span>{game.lines} LINES</span><span>LEVEL {speedStage + 1}</span><small>Alle 20 Sekunden wird der Fall schneller.</small><div className="tetris-controls"><button onClick={() => move(-1)}>←</button><button onClick={turn}>↻</button><button onClick={() => move(1)}>→</button><button onClick={drop}>↓</button></div></div></div><p className="tetris-help">Desktop: Pfeiltasten · Handy: die Tasten unten<br /><span>{game.over ? `Du hast ${Math.floor((performance.now() - game.startedAt) / 1000)} Sekunden geschafft. ${localResultCount}/${players.length} Ergebnisse.` : "Baue Reihen und halte so lange durch wie möglich."}</span></p></div>;
}
