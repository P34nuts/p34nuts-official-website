import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { GameEngine, type SaveData } from "@/games/burgfried/engine";
import { GameRenderer } from "@/games/burgfried/renderer";
import { type GameCtx, type Panel } from "@/games/burgfried/hud/common";
import TopBar from "@/games/burgfried/hud/TopBar";
import { BuildMenu, QuestPanel } from "@/games/burgfried/hud/SidePanels";
import { BottomBar, BuildHint, Inspector, Toasts, ZoomButtons } from "@/games/burgfried/hud/BottomUi";
import { EconomyModal, MenuModal, PopulationModal, ResearchModal, TradeModal } from "@/games/burgfried/hud/Modals";
import { removeSubscription, sendRoomBroadcast, subscribeToRoomBroadcast, type Player } from "@/games/multiplayer";

const SAVE_KEY = "p34nuts-burgfried-save-v1";
const EVENT = "burgfried";
const randomSeed = () => Math.floor(Math.random() * 2_000_000_000) + 1;
const readSave = (): SaveData | null => { try { const raw = localStorage.getItem(SAVE_KEY); return raw ? JSON.parse(raw) as SaveData : null; } catch { return null; } };
const makeEngine = (save: SaveData | null) => { if (save) { try { return GameEngine.load(save); } catch { /* fall through */ } } return GameEngine.newGame(randomSeed()); };

type Props = { roomId: string; playerId: string; players: Player[]; host: boolean; onResult: (id: string, value: number) => void; onDone: () => void };
type SyncPayload = { type: "state"; from: string; seq: number; save: SaveData };

export default function BurgfriedGame({ roomId, playerId, players, host, onResult, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const engineRef = useRef<GameEngine>(makeEngine(null));
  const [engine, setEngine] = useState<GameEngine>(() => makeEngine(host ? readSave() : null));
  const [panel, setPanelState] = useState<Panel>(null);
  const [renderer, setRenderer] = useState<GameRenderer | null>(null);
  const [syncLabel, setSyncLabel] = useState(host ? "Host · gemeinsame Stadt" : "Verbunden · gemeinsame Stadt");
  const seqRef = useRef(0);
  const lastAppliedSeq = useRef(0);
  const startedAt = useRef(Date.now());
  const finishScore = useRef(false);
  const aiBusy = useRef(false);
  const isSolo = players.length === 2 && players.some((p) => p.id === "computer-bot");
  engineRef.current = engine;

  const broadcastState = useCallback((reason: string) => {
    if (!channelRef.current) return;
    const payload: SyncPayload = { type: "state", from: playerId, seq: ++seqRef.current, save: engineRef.current.serialize() };
    setSyncLabel(host ? `Host · ${reason}` : `Synchronisiere · ${reason}`);
    void sendRoomBroadcast(channelRef.current, payload, EVENT);
  }, [host, playerId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = new GameRenderer(canvas, engineRef.current);
    rendererRef.current = r;
    r.start();
    r.centerOnTile(32, 34);
    setRenderer(r);
    return () => { r.stop(); rendererRef.current = null; };
  }, []);

  useEffect(() => {
    engineRef.current = engine;
    rendererRef.current?.setEngine(engine);
  }, [engine]);

  useEffect(() => {
    const channel = subscribeToRoomBroadcast(roomId, (raw) => {
      const payload = raw as Partial<SyncPayload>;
      if (payload.type !== "state" || payload.from === playerId || !payload.save) return;
      if (Number(payload.seq ?? 0) <= lastAppliedSeq.current && host) return;
      try {
        lastAppliedSeq.current = Number(payload.seq ?? 0);
        const next = GameEngine.load(payload.save);
        setEngine(next);
        setSyncLabel(`${payload.from === "computer-bot" ? "Computergegner" : "Spieler synchronisiert"} · gemeinsame Stadt`);
      } catch {
        setSyncLabel("Synchronisierung fehlgeschlagen");
      }
    }, EVENT);
    channelRef.current = channel;
    const hello = window.setTimeout(() => broadcastState("Spielstand geteilt"), 350);
    return () => { window.clearTimeout(hello); channelRef.current = null; void removeSubscription(channel); };
  }, [broadcastState, host, playerId, roomId]);

  useEffect(() => {
    const interval = window.setInterval(() => broadcastState(host ? "Host-Stand" : "Spieleraktion"), host ? 1200 : 900);
    return () => window.clearInterval(interval);
  }, [broadcastState, host]);

  useEffect(() => {
    if (!isSolo || !host) return;
    const timer = window.setInterval(() => {
      if (aiBusy.current) return;
      aiBusy.current = true;
      const candidates = ["house_s", "road", "lumberjack", "quarry", "sawmill"] as const;
      const type = candidates[Math.floor(Math.random() * candidates.length)];
      const center = 32 + Math.floor(Math.random() * 8) - 4;
      for (let radius = 2; radius < 16; radius += 1) {
        const spots = [[center + radius, center], [center - radius, center], [center, center + radius], [center, center - radius]];
        const spot = spots.find(([x, y]) => engineRef.current.checkPlace(type, x, y).ok);
        if (spot) { engineRef.current.place(type, spot[0], spot[1]); broadcastState("Computergegner baut"); break; }
      }
      aiBusy.current = false;
    }, 6500);
    return () => window.clearInterval(timer);
  }, [broadcastState, host, isSolo]);

  const save = useCallback(async () => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(engineRef.current.serialize())); engineRef.current.toast("Spielstand gespeichert", "good"); }
    catch { engineRef.current.toast("Speichern fehlgeschlagen", "warn"); }
  }, []);
  const load = useCallback(async () => { const next = makeEngine(readSave()); setEngine(next); setPanelState(null); next.toast("Spielstand geladen", "good"); broadcastState("Spielstand geladen"); }, [broadcastState]);
  const newGame = useCallback(() => { const next = GameEngine.newGame(randomSeed()); setEngine(next); setPanelState(null); next.toast("Neue gemeinsame Karte", "info"); broadcastState("Neue Karte"); }, [broadcastState]);
  const logout = useCallback(() => { void save(); onDone(); }, [onDone, save]);
  useEffect(() => { const interval = window.setInterval(() => void save(), 45_000); return () => window.clearInterval(interval); }, [save]);
  useEffect(() => { const timer = window.setTimeout(() => { if (!finishScore.current) { finishScore.current = true; onResult(playerId, Math.round((Date.now() - startedAt.current) / 1000) + engineRef.current.level * 100 + engineRef.current.buildings.length * 25); } }, 1000); return () => window.clearTimeout(timer); }, [onResult, playerId]);
  const setPanel = useCallback((value: Panel) => { setPanelState(value); if (value) engineRef.current.setBuildType(null); }, []);
  const g: GameCtx = { engine, renderer, panel, setPanel, username: isSolo ? "Burgfried · Computergegner" : `Burgfried · ${players.length} Spieler`, saveInfo: syncLabel, save, load, newGame, logout };
  return <div className="fixed inset-0 select-none overflow-hidden bg-[#17425f]"><canvas ref={canvasRef} className="absolute inset-0 h-full w-full" /><div className="pointer-events-none absolute left-1/2 top-2 z-30 -translate-x-1/2 rounded border border-[#e9c27b]/70 bg-[#20190f]/90 px-3 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f5dfad] shadow-lg">{isSolo ? "Computergegner aktiv · gemeinsame Siedlung" : `Multiplayer · ${players.length} / 8 Spieler`} · {syncLabel}</div><TopBar g={g} /><BuildMenu g={g} /><QuestPanel g={g} /><ZoomButtons g={g} /><BuildHint g={g} /><Inspector g={g} /><Toasts g={g} /><BottomBar g={g} />{panel === "economy" && <EconomyModal g={g} />}{panel === "population" && <PopulationModal g={g} />}{panel === "research" && <ResearchModal g={g} />}{panel === "trade" && <TradeModal g={g} />}{panel === "menu" && <MenuModal g={g} />}</div>;
}
