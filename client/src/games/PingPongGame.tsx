import { useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { emitRoomEvent, removeSubscription, sendRoomBroadcast, subscribeToRoomBroadcast, type Player } from "@/games/multiplayer";
import { assets } from "@/data/artistData";

type Point = { x: number; y: number };
type PingPongState = { x: number; y: number; vx: number; vy: number; elapsed: number; eliminated: string[]; gameOver: boolean };

const CENTER = { x: 50, y: 50 };
const BALL = 2.2;
const PADDLE = .15;
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
// Start fast enough to reach the first paddle quickly; the 10-second speed ramp still applies.
const initialState = (): PingPongState => ({ x: 50, y: 50, vx: 32, vy: 21, elapsed: 0, eliminated: [], gameOver: false });
const polygon = (sides: number): Point[] => Array.from({ length: sides }, (_, index) => {
  const angle = -Math.PI / 2 + index * (Math.PI * 2 / sides);
  return { x: CENTER.x + 42 * Math.cos(angle), y: CENTER.y + 42 * Math.sin(angle) };
});
const edgeValue = (point: Point, a: Point, b: Point) => clamp(((point.x - a.x) * (b.x - a.x) + (point.y - a.y) * (b.y - a.y)) / ((b.x - a.x) ** 2 + (b.y - a.y) ** 2));
const edgePoint = (a: Point, b: Point, value: number): Point => ({ x: a.x + (b.x - a.x) * value, y: a.y + (b.y - a.y) * value });

export default function PingPongGame({ roomId, playerId, players, host, onResult, onDone }: { roomId: string; playerId: string; players: Player[]; host: boolean; onResult: (id: string, value: number) => void; onDone: () => void }) {
  const sides = Math.max(2, players.length);
  const vertices = useMemo(() => polygon(sides), [sides]);
  const [state, setState] = useState(initialState);
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const stateRef = useRef(state);
  const inputsRef = useRef(inputs);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const endedRef = useRef(false);
  const playersRef = useRef(players);
  const onDoneRef = useRef(onDone);
  stateRef.current = state;
  inputsRef.current = inputs;
  playersRef.current = players;
  onDoneRef.current = onDone;

  useEffect(() => {
    const channel = subscribeToRoomBroadcast(roomId, (payload) => {
      if (payload.type === "input" && host) {
        const id = String(payload.playerId);
        inputsRef.current = { ...inputsRef.current, [id]: Number(payload.value) };
        return;
      }
      if (payload.type === "state") {
        const next = payload.state as PingPongState;
        stateRef.current = next;
        setState(next);
      }
    });
    channelRef.current = channel;
    return () => { channelRef.current = null; void removeSubscription(channel); };
  }, [host, roomId]);

  useEffect(() => {
    if (!host) return undefined;
    const startedAt = performance.now();
    const tick = window.setInterval(() => {
      const current = stateRef.current;
      if (current.gameOver) return;
      if (playersRef.current.length === 2) {
        const bot = playersRef.current.find(player => player.id === "computer-bot");
        if (bot) inputsRef.current = { ...inputsRef.current, [bot.id]: clamp((current.y - 7) / 86) };
      }
      const elapsed = performance.now() - startedAt;
      const speed = 1 + Math.floor(elapsed / 10000) * .16;
      let x = current.x + current.vx * .04 * speed;
      let y = current.y + current.vy * .04 * speed;
      let vx = current.vx;
      let vy = current.vy;
      const eliminated = [...current.eliminated];
      const hit = (index: number, t: number, normal: Point) => {
        const player = playersRef.current[index];
        if (!player || eliminated.includes(player.id)) return;
        const paddle = inputsRef.current[player.id] ?? .5;
        if (Math.abs(t - paddle) > PADDLE) {
          eliminated.push(player.id);
        }
        x += normal.x * BALL;
        y += normal.y * BALL;
        const dot = vx * normal.x + vy * normal.y;
        vx -= 2 * dot * normal.x;
        vy -= 2 * dot * normal.y;
      };
      if (sides === 2) {
        if (x < 7 + BALL / 2) { hit(0, clamp((y - 7) / 86), { x: 1, y: 0 }); x = 7 + BALL / 2; }
        if (x > 93 - BALL / 2) { hit(1, clamp((y - 7) / 86), { x: -1, y: 0 }); x = 93 - BALL / 2; }
        if (y < 7 + BALL / 2) { y = 7 + BALL / 2; vy = Math.abs(vy); }
        if (y > 93 - BALL / 2) { y = 93 - BALL / 2; vy = -Math.abs(vy); }
      } else {
        vertices.forEach((a, index) => {
          const b = vertices[(index + 1) % sides];
          const ex = b.x - a.x; const ey = b.y - a.y; const length = Math.hypot(ex, ey);
          const inward = { x: (CENTER.x - (a.x + b.x) / 2) / 42, y: (CENTER.y - (a.y + b.y) / 2) / 42 };
          const distance = (x - a.x) * inward.x + (y - a.y) * inward.y;
          if (distance < BALL / 2) {
            hit(index, clamp(((x - a.x) * ex + (y - a.y) * ey) / (length * length)), inward);
          }
        });
      }
      const gameOver = eliminated.length >= playersRef.current.length - 1;
      const next = { x, y, vx, vy, elapsed, eliminated, gameOver };
      stateRef.current = next;
      setState(next);
      if (channelRef.current) void sendRoomBroadcast(channelRef.current, { type: "state", state: next });
      if (gameOver && !endedRef.current) {
        endedRef.current = true;
        playersRef.current.forEach((player, index) => void emitRoomEvent(roomId, "result", { playerId: player.id, game: "pingpong", value: eliminated.includes(player.id) ? index : -1 }));
        window.setTimeout(() => onDoneRef.current(), 1200);
      }
    }, 40);
    return () => window.clearInterval(tick);
  }, [host, roomId, sides, vertices]);

  useEffect(() => {
    if (host || !state.gameOver || endedRef.current) return undefined;
    endedRef.current = true;
    const timer = window.setTimeout(() => onDoneRef.current(), 1200);
    return () => window.clearTimeout(timer);
  }, [host, state.gameOver]);

  const updateInput = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const point = { x: (event.clientX - rect.left) / rect.width * 100, y: (event.clientY - rect.top) / rect.height * 100 };
    let value = .5;
    if (sides === 2) value = clamp((point.y - 7) / 86);
    else { const a = vertices[players.findIndex(player => player.id === playerId) % sides]; const b = vertices[(players.findIndex(player => player.id === playerId) + 1) % sides]; value = edgeValue(point, a, b); }
    inputsRef.current = { ...inputsRef.current, [playerId]: value };
    setInputs(inputsRef.current);
    if (!host && channelRef.current) void sendRoomBroadcast(channelRef.current, { type: "input", playerId, value });
  };
  const active = players.length - state.eliminated.length;
  const points = sides === 2 ? [{ x: 7, y: 7 }, { x: 93, y: 7 }] : vertices;
  const paddleLines = players.map((player, index) => {
    const value = inputs[player.id] ?? .5;
    if (sides === 2) return { player, index, a: { x: index ? 93 : 7, y: 7 + value * 86 - 12 }, b: { x: index ? 93 : 7, y: 7 + value * 86 + 12 } };
    const a = vertices[index % sides]; const b = vertices[(index + 1) % sides];
    return { player, index, a: edgePoint(a, b, clamp(value - PADDLE)), b: edgePoint(a, b, clamp(value + PADDLE)) };
  });
  if (players.length < 2) return <div className="game-stage unsupported"><h2>Mindestens 2 Spieler</h2><p>Pingpong braucht mindestens zwei Seiten. Warte auf einen Freund.</p></div>;
  return <div className="game-stage pingpong-stage"><div className="stage-title"><span>PINGPONG / {sides} SIDES</span><span>{Math.floor(state.elapsed / 1000)} SEC · SPEED ×{(1 + Math.floor(state.elapsed / 10000) * .16).toFixed(2)}</span></div><svg ref={svgRef} viewBox="0 0 100 100" className="pingpong-board" onPointerMove={updateInput} onPointerDown={updateInput} role="img" aria-label="Pingpong Spielfeld"><rect x="0" y="0" width="100" height="100" fill="#111114" />{sides === 2 ? <rect x="7" y="7" width="86" height="86" className="pingpong-boundary" /> : <polygon points={points.map(point => `${point.x},${point.y}`).join(" ")} className="pingpong-boundary" />}{paddleLines.map(({ player, index, a, b }) => <line key={player.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={`pingpong-paddle ${state.eliminated.includes(player.id) ? "eliminated" : index === players.findIndex(item => item.id === playerId) ? "local" : ""}`} />)}<image href={assets.mark} x={state.x - 3.2} y={state.y - 3.2} width="6.4" height="6.4" preserveAspectRatio="xMidYMid meet" className="pingpong-ball" /></svg><div className="pingpong-meta"><span>{active} ACTIVE / {sides} SIDES</span><span>{state.gameOver ? "WINNER DECIDED" : "POINTER = PADDLE"}</span></div><p className="pingpong-help">Bewege Maus oder Finger an deiner Seite auf und ab. Alle 10 Sekunden wird der Ball schneller.<br /><span>Fällt jemand raus, bleibt seine Seite stehen und wird zur Bande.</span></p></div>;
}
