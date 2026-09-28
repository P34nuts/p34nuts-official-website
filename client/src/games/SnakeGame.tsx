import { useCallback, useEffect, useRef, useState } from "react";
import { emitRoomEvent, type Player } from "@/games/multiplayer";

type Point = { x: number; y: number };
type Direction = Point;
const COLS = 18;
const ROWS = 14;
const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y;
const initialSnake = (): Point[] => [{ x: 8, y: 7 }, { x: 7, y: 7 }, { x: 6, y: 7 }];
const randomFood = (snake: Point[]): Point => {
  const free: Point[] = [];
  for (let y = 0; y < ROWS; y += 1) for (let x = 0; x < COLS; x += 1) if (!snake.some((part) => same(part, { x, y }))) free.push({ x, y });
  return free[Math.floor(Math.random() * free.length)] ?? { x: 12, y: 7 };
};

export default function SnakeGame({ roomId, playerId, players, onResult, onDone }: { roomId: string; playerId: string; players: Player[]; onResult: (id: string, value: number) => void; onDone: () => void }) {
  const [snake, setSnake] = useState(initialSnake);
  const [food, setFood] = useState(() => randomFood(initialSnake()));
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [finished, setFinished] = useState(false);
  const startedRef = useRef(false);
  const direction = useRef<Direction>({ x: 1, y: 0 });
  const nextDirection = useRef<Direction>({ x: 1, y: 0 });
  const finishedRef = useRef(false);
  const scoreRef = useRef(0);
  const onResultRef = useRef(onResult);
  const onDoneRef = useRef(onDone);
  onResultRef.current = onResult;
  onDoneRef.current = onDone;

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFinished(true);
    onResultRef.current(playerId, scoreRef.current);
    void emitRoomEvent(roomId, "result", { playerId, game: "snake", value: scoreRef.current });
    window.setTimeout(() => onDoneRef.current(), 350);
  }, [playerId, roomId]);

  const setDirection = useCallback((next: Direction) => {
    const current = direction.current;
    if (next.x === -current.x && next.y === -current.y) return;
    nextDirection.current = next;
  }, []);

  useEffect(() => {
    const keyHandler = (event: KeyboardEvent) => {
      const keys: Record<string, Direction> = { ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 } };
      const next = keys[event.key];
      if (next) { event.preventDefault(); setDirection(next); }
    };
    window.addEventListener("keydown", keyHandler);
    const countdownClock = window.setInterval(() => setCountdown((value) => Math.max(0, value - 1)), 1000);
    const start = window.setTimeout(() => { startedRef.current = true; }, 5000);
    const clock = window.setInterval(() => { if (startedRef.current) setSeconds((value) => value + 1); }, 1000);
    return () => { window.removeEventListener("keydown", keyHandler); window.clearInterval(countdownClock); window.clearTimeout(start); window.clearInterval(clock); };
  }, [setDirection]);

  useEffect(() => {
    const tick = window.setInterval(() => {
      if (finishedRef.current || !startedRef.current) return;
      direction.current = nextDirection.current;
      setSnake((current) => {
        const head = current[0];
        const next = { x: head.x + direction.current.x, y: head.y + direction.current.y };
        const hitWall = next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS;
        const hitSelf = current.some((part, index) => index > 0 && same(part, next));
        if (hitWall || hitSelf) { finish(); return current; }
        const ate = same(next, food);
        const updated = [next, ...current];
        if (ate) { scoreRef.current += 10; setScore(scoreRef.current); setFood(randomFood(updated)); } else updated.pop();
        return updated;
      });
    }, 180);
    return () => window.clearInterval(tick);
  }, [finish, food]);

  return <div className="game-stage snake-stage"><div className="stage-title"><span>SNAKE / 05</span><span>{players.length} PLAYER{players.length === 1 ? "" : "S"}</span></div>{countdown > 0 && <div className="snake-countdown"><strong>{countdown}</strong><span>GLEICH GEHT'S LOS</span></div>}<div className="snake-board" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>{Array.from({ length: COLS * ROWS }, (_, index) => { const cell = { x: index % COLS, y: Math.floor(index / COLS) }; const body = snake.some((part) => same(part, cell)); return <span className={same(food, cell) ? "snake-cell food" : body ? "snake-cell body" : "snake-cell"} key={`${cell.x}-${cell.y}`} />; })}</div><div className="snake-meta"><strong>{score}</strong><span>{finished ? "GAME OVER" : countdown > 0 ? "BEREIT MACHEN …" : `${seconds}s · +10 PRO APFEL`}</span></div><div className="snake-controls"><button className="snake-key up" onClick={() => setDirection({ x: 0, y: -1 })}>↑</button><button className="snake-key left" onClick={() => setDirection({ x: -1, y: 0 })}>←</button><button className="snake-key down" onClick={() => setDirection({ x: 0, y: 1 })}>↓</button><button className="snake-key right" onClick={() => setDirection({ x: 1, y: 0 })}>→</button></div><p className="snake-help">Pfeiltasten im Tastatur-Layout, WASD oder Fingersteuerung.</p></div>;
}
