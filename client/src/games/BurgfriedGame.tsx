import { useCallback, useEffect, useRef, useState } from "react";
import { GameEngine, type SaveData } from "@/games/burgfried/engine";
import { GameRenderer } from "@/games/burgfried/renderer";
import { type GameCtx, type Panel } from "@/games/burgfried/hud/common";
import TopBar from "@/games/burgfried/hud/TopBar";
import { BuildMenu, QuestPanel } from "@/games/burgfried/hud/SidePanels";
import { BottomBar, BuildHint, Inspector, Toasts, ZoomButtons } from "@/games/burgfried/hud/BottomUi";
import { EconomyModal, MenuModal, PopulationModal, ResearchModal, TradeModal } from "@/games/burgfried/hud/Modals";

const SAVE_KEY = "p34nuts-burgfried-save-v1";
const randomSeed = () => Math.floor(Math.random() * 2_000_000_000) + 1;
const readSave = (): SaveData | null => { try { const raw = localStorage.getItem(SAVE_KEY); return raw ? JSON.parse(raw) as SaveData : null; } catch { return null; } };
const makeEngine = (save: SaveData | null) => { if (save) { try { return GameEngine.load(save); } catch { /* fall through */ } } return GameEngine.newGame(randomSeed()); };

export default function BurgfriedGame({ playerId, onResult, onDone }: { playerId: string; onResult: (id: string, value: number) => void; onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const [engine, setEngine] = useState<GameEngine>(() => makeEngine(readSave()));
  const engineRef = useRef(engine); engineRef.current = engine;
  const [panel, setPanelState] = useState<Panel>(null);
  const [saveInfo, setSaveInfo] = useState("Lokaler Spielstand");
  const [renderer, setRenderer] = useState<GameRenderer | null>(null);
  const startedAt = useRef(Date.now());
  const finishScore = useRef(false);
  useEffect(() => { const canvas = canvasRef.current; if (!canvas) return; const r = new GameRenderer(canvas, engineRef.current); rendererRef.current = r; r.start(); r.centerOnTile(32, 34); setRenderer(r); return () => { r.stop(); rendererRef.current = null; }; }, []);
  useEffect(() => { engineRef.current = engine; rendererRef.current?.setEngine(engine); }, [engine]);
  const save = useCallback(async () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(engineRef.current.serialize())); setSaveInfo(`Gespeichert ${new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`); engineRef.current.toast("Spielstand gespeichert", "good"); } catch { setSaveInfo("Speichern fehlgeschlagen"); } }, []);
  const load = useCallback(async () => { const next = makeEngine(readSave()); setEngine(next); setPanelState(null); setSaveInfo("Spielstand geladen"); next.toast("Spielstand geladen", "good"); }, []);
  const newGame = useCallback(() => { const next = GameEngine.newGame(randomSeed()); setEngine(next); setPanelState(null); setSaveInfo("Neue Karte"); next.toast("Neue Karte generiert", "info"); }, []);
  const logout = useCallback(() => { void save(); onDone(); }, [onDone, save]);
  useEffect(() => { const interval = window.setInterval(() => void save(), 45_000); const flush = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(engineRef.current.serialize())); } catch {} }; window.addEventListener("pagehide", flush); return () => { window.clearInterval(interval); window.removeEventListener("pagehide", flush); }; }, [save]);
  useEffect(() => { const timer = window.setTimeout(() => { if (!finishScore.current) { finishScore.current = true; onResult(playerId, Math.round((Date.now() - startedAt.current) / 1000) + engineRef.current.level * 100 + engineRef.current.buildings.length * 25); } }, 1000); return () => window.clearTimeout(timer); }, [onResult, playerId]);
  const setPanel = useCallback((value: Panel) => { setPanelState(value); if (value) engineRef.current.setBuildType(null); }, []);
  const g: GameCtx = { engine, renderer, panel, setPanel, username: "Burgfried-Herrscher", saveInfo, save, load, newGame, logout };
  return <div className="fixed inset-0 select-none overflow-hidden bg-[#17425f]"><canvas ref={canvasRef} className="absolute inset-0 h-full w-full" /><TopBar g={g} /><BuildMenu g={g} /><QuestPanel g={g} /><ZoomButtons g={g} /><BuildHint g={g} /><Inspector g={g} /><Toasts g={g} /><BottomBar g={g} />{panel === "economy" && <EconomyModal g={g} />}{panel === "population" && <PopulationModal g={g} />}{panel === "research" && <ResearchModal g={g} />}{panel === "trade" && <TradeModal g={g} />}{panel === "menu" && <MenuModal g={g} />}</div>;
}
