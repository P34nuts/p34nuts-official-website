import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Check, Copy, Link as LinkIcon, MessageCircle, Radio, Share2, Smartphone, Trophy, Users, WifiOff, Zap } from "lucide-react";
import { cleanNickname, createRoom, emitRoomEvent, joinRoom, leaveRoom, loadRoom, realtimeConfigured, removeSubscription, sendChat, subscribeToRoom, updateRoom, type ChatMessage, type GameId, type Player, type Room, type RoomEvent } from "@/games/multiplayer";
import "@/games/games.css";
import PingPongGame from "@/games/PingPongGame";
import TetrisGame from "@/games/TetrisGame";
import SnakeGame from "@/games/SnakeGame";
import MemoryGame from "@/games/MemoryGame";
import { AimTrainerGame, BluffQuizGame, BombPassGame, HigherLowerGame } from "@/games/MoreGames";
import ColonyGame from "@/games/ColonyGame";

const avatars = ["◒", "✦", "◓", "✹", "◉", "◇", "✷", "⬡"];
const points = [10, 7, 5, 3, 1];
const randomAvatar = () => avatars[Math.floor(Math.random() * avatars.length)];
const formatMs = (value?: number) => value == null ? "—" : `${Math.round(value)} ms`;
const SOLO_BOT_ID = "computer-bot";
const soloBot: Player = { id: SOLO_BOT_ID, room_id: "local", nickname: "Computer", avatar: "◆", joined_at: "" };

function GameCountdown() {
  const [seconds, setSeconds] = useState(5);
  useEffect(() => { const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000); return () => window.clearInterval(timer); }, []);
  return <section className="game-countdown game-panel"><span>ROUND START</span><strong>{seconds}</strong><p>Das Spiel beginnt gleich für alle.</p></section>;
}

function Setup({ onEnter }: { onEnter: (mode: "create" | "join", nickname: string, code: string, avatar: string) => Promise<void> }) {
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [avatar, setAvatar] = useState(randomAvatar);
  const [mode, setMode] = useState<"create" | "join">("create");
  const [error, setError] = useState("");
  const submit = async () => {
    const safe = cleanNickname(nickname);
    if (safe.length < 2) return setError("Bitte wähle einen Namen mit mindestens 2 Zeichen.");
    if (mode === "join" && code.trim().length !== 5) return setError("Ein Raumcode besteht aus 5 Zeichen.");
    setError("");
    try { await onEnter(mode, safe, code, avatar); } catch (e) { setError(e instanceof Error ? e.message : "Der Raum konnte nicht geöffnet werden."); }
  };
  return <main className="games-page"><div className="games-noise" /><header className="games-brand"><span className="games-mark">P34</span><span>FRIENDS / GAME ROOM</span><span className="games-live"><i /> LIVE SYSTEM</span></header><section className="games-hero"><p className="games-kicker">MULTIPLAYER MINIS / 001</p><h1>PLAY<br /><em>WITH</em><br />FRIENDS</h1><p className="games-lede">Minispiele. Freunde. Wettbewerb.<br /><span>Erstelle einen Raum, teile den Code und finde heraus, wer wirklich der Schnellste ist.</span></p></section><section className="games-entry"><div className="games-entry-copy"><span className="games-kicker">01 / ENTER THE ROOM</span><h2>Wie sollen dich deine Freunde sehen?</h2><p>Kein Konto. Kein Passwort. Nur ein Name und der nächste gute Wettbewerb.</p></div><div className="games-form"><label>SPIELERNAME<input autoFocus value={nickname} onChange={e => setNickname(e.target.value)} maxLength={18} placeholder="z. B. Frank" onKeyDown={e => e.key === "Enter" && void submit()} /></label><div className="avatar-row"><span>AVATAR</span>{avatars.map(item => <button key={item} className={avatar === item ? "avatar active" : "avatar"} onClick={() => setAvatar(item)}>{item}</button>)}</div>{mode === "join" && <label>RAUMCODE<input value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} maxLength={5} placeholder="X7K4P" /></label>}<div className="entry-actions"><button className="game-primary" onClick={() => void submit()}>{mode === "create" ? "RAUM ERSTELLEN" : "RAUM BEITRETEN"}<span>↗</span></button><button className="game-secondary" onClick={() => { setMode(mode === "create" ? "join" : "create"); setError(""); }}>{mode === "create" ? "ICH HABE EINEN CODE" : "NEUEN RAUM ERSTELLEN"}</button></div>{error && <p className="game-error">{error}</p>}</div></section><footer className="games-footer"><span>FAST / FAIR / FRIENDS</span><span>MAX. 8 PLAYERS</span><span>NO ACCOUNT REQUIRED</span></footer></main>;
}

function Chat({ messages, nickname, roomId }: { messages: ChatMessage[]; nickname: string; roomId: string }) {
  const [value, setValue] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }); }, [messages.length]);
  const send = async () => { if (!value.trim()) return; await sendChat(roomId, nickname, value); setValue(""); };
  return <section className="game-panel chat-panel"><div className="panel-heading"><span><MessageCircle size={16} /> CHAT / LIVE</span><small>{messages.length} messages</small></div><div className="chat-list" ref={listRef}>{messages.length === 0 && <p className="empty-note">Sag deinen Freunden hallo.</p>}{messages.map(message => <div className="chat-line" key={message.id}><span className="chat-avatar">{message.nickname.slice(0, 1).toUpperCase()}</span><div><strong>{message.nickname}</strong><p>{message.message}</p></div><time>{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div>)}</div><div className="chat-input"><input value={value} maxLength={240} placeholder="Nachricht schreiben …" onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === "Enter" && void send()} /><button onClick={() => void send()}>SENDEN</button></div></section>;
}

function Ranking({ results, players, higherIsBetter = false, pointsGame = false }: { results: Record<string, number>; players: Player[]; higherIsBetter?: boolean; pointsGame?: boolean }) {
  const ordered = [...players].sort((a, b) => higherIsBetter ? (results[b.id] ?? -Infinity) - (results[a.id] ?? -Infinity) : (results[a.id] ?? Infinity) - (results[b.id] ?? Infinity));
  return <div className="ranking">{ordered.map((player, index) => <div className={`rank-row rank-${index + 1}`} key={player.id}><span className="rank-place">{index < 3 ? ["🥇", "🥈", "🥉"][index] : `0${index + 1}`}</span><span className="rank-avatar">{player.avatar}</span><strong>{player.nickname}</strong><span className="rank-score">{results[player.id] == null ? "—" : pointsGame ? `${Math.round(results[player.id])} P` : formatMs(results[player.id])}</span></div>)}</div>;
}

function LiveScoreboard({ players, results, scores, game, currentPlayerId }: { players: Player[]; results: Record<string, number>; scores: Record<string, number>; game: GameId; currentPlayerId: string }) {
  const valueLabel = (value?: number) => value == null ? "SPIELT …" : game === "reaction" ? formatMs(value) : game === "tetris" ? `${(value / 1000).toFixed(1)} SEK` : game === "shake" ? `${Math.round(value)} P` : game === "memory" ? `${Math.round(value)} P` : `${Math.round(value)} P`;
  const ordered = [...players].sort((a, b) => Number(results[b.id] != null) - Number(results[a.id] != null));
  return <section className="live-scoreboard" aria-label="Live-Spielstand"><div className="live-scoreboard-head"><span>LIVE SCOREBOARD</span><small>{Object.keys(results).length}/{players.length} FERTIG</small></div>{ordered.map(player => <div className={`live-score-row ${player.id === currentPlayerId ? "local" : ""}`} key={player.id}><span className="live-score-avatar">{player.avatar}</span><strong>{player.nickname}{player.id === currentPlayerId ? " (DU)" : ""}</strong><span className={results[player.id] == null ? "live-playing" : "live-finished"}>{valueLabel(results[player.id])}</span><b>{scores[player.id] ?? 0} P</b></div>)}</section>;
}

function ReactionGame({ roomId, playerId, players, results, onResult, onDone }: { roomId: string; playerId: string; players: Player[]; results: Record<string, number>; onResult: (id: string, value: number) => void; onDone: () => void }) {
  const [phase, setPhase] = useState<"waiting" | "ready" | "go" | "clicked" | "early">("waiting");
  const startedAt = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => { setPhase("ready"); const delay = 1200 + Math.random() * 3600; timer.current = window.setTimeout(() => { startedAt.current = performance.now(); setPhase("go"); navigator.vibrate?.(60); }, delay); return () => window.clearTimeout(timer.current); }, []);
  const click = () => { if (phase === "ready") { window.clearTimeout(timer.current); setPhase("early"); void emitRoomEvent(roomId, "result", { playerId, game: "reaction", value: -1 }); } else if (phase === "go") { const value = performance.now() - startedAt.current; setPhase("clicked"); onResult(playerId, value); void emitRoomEvent(roomId, "result", { playerId, game: "reaction", value }); navigator.vibrate?.(30); } };
  return <div className="game-stage reaction-stage"><div className="stage-title"><span>REACTION / 01</span><span>BEST OF ONE</span></div><button className={`reaction-target ${phase}`} onPointerDown={click}><span>{phase === "ready" ? "WARTEN …" : phase === "go" ? "JETZT!" : phase === "early" ? "ZU FRÜH" : phase === "clicked" ? "GEMESSEN" : "BEREIT"}</span><small>{phase === "go" ? "DRÜCKEN" : "lokale Zeitmessung"}</small></button><div className="stage-foot"><span>{phase === "go" ? "SIGNAL AKTIV" : "NICHT VOR DEM SIGNAL DRÜCKEN"}</span><span>{formatMs(results[playerId])}</span></div>{Object.keys(results).length >= players.length && <button className="game-primary result-button" onClick={onDone}>RANGLISTE ÖFFNEN ↗</button>}</div>;
}

function ShakeGame({ roomId, playerId, players, results, onResult, onDone }: { roomId: string; playerId: string; players: Player[]; results: Record<string, number>; onResult: (id: string, value: number) => void; onDone: () => void }) {
  const [seconds, setSeconds] = useState(10);
  const [count, setCount] = useState(0);
  const [supported, setSupported] = useState(true);
  const [desktopMode, setDesktopMode] = useState(false);
  const countRef = useRef(0);
  const finishedRef = useRef(false);
  const onResultRef = useRef(onResult);
  const onDoneRef = useRef(onDone);
  const lastMouseY = useRef<number | null>(null);
  const lastMouseDirection = useRef(0);
  const permissionAsked = useRef(false);
  onResultRef.current = onResult;
  onDoneRef.current = onDone;

  useEffect(() => {
    const touchDevice = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
    const canUseMotion = touchDevice && "DeviceMotionEvent" in window;
    const canUseMouse = !touchDevice;
    setDesktopMode(canUseMouse);
    if (!canUseMotion && !canUseMouse) setSupported(false);

    const addShake = () => {
      if (finishedRef.current) return;
      countRef.current += 1;
      setCount(countRef.current);
    };
    let lastMotion = 0;
    const motionHandler = (event: DeviceMotionEvent) => {
      const now = performance.now();
      const x = event.accelerationIncludingGravity?.x ?? 0;
      const y = event.accelerationIncludingGravity?.y ?? 0;
      if (Math.abs(x) + Math.abs(y) > 22 && now - lastMotion > 120) {
        lastMotion = now;
        addShake();
      }
    };
    const mouseHandler = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || finishedRef.current) return;
      if (lastMouseY.current !== null) {
        const delta = event.clientY - lastMouseY.current;
        if (Math.abs(delta) > 12) {
          const direction = Math.sign(delta);
          if (lastMouseDirection.current && direction !== lastMouseDirection.current) addShake();
          lastMouseDirection.current = direction;
        }
      }
      lastMouseY.current = event.clientY;
    };
    window.addEventListener("devicemotion", motionHandler);
    window.addEventListener("pointermove", mouseHandler);
    const startedAt = performance.now();
    const interval = window.setInterval(() => {
      const remaining = Math.max(0, 10 - (performance.now() - startedAt) / 1000);
      setSeconds(Math.ceil(remaining));
    }, 100);
    const finish = window.setTimeout(() => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      const finalCount = countRef.current;
      void emitRoomEvent(roomId, "result", { playerId, game: "shake", value: finalCount });
      onResultRef.current(playerId, finalCount);
      window.setTimeout(() => onDoneRef.current(), 350);
    }, 10000);
    return () => {
      window.removeEventListener("devicemotion", motionHandler);
      window.removeEventListener("pointermove", mouseHandler);
      window.clearInterval(interval);
      window.clearTimeout(finish);
    };
  }, [playerId, roomId]);

  const requestMotionPermission = async () => {
    if (desktopMode || permissionAsked.current) return;
    permissionAsked.current = true;
    const motion = window.DeviceMotionEvent as typeof DeviceMotionEvent & { requestPermission?: () => Promise<string> };
    if (typeof motion.requestPermission === "function") {
      const permission = await motion.requestPermission();
      if (permission !== "granted") setSupported(false);
    }
  };
  if (!supported) return <div className="game-stage unsupported"><Smartphone size={36} /><h2>Bewegung nicht verfügbar</h2><p>Dieses Spiel benötigt auf dem Handy einen Bewegungssensor. Auf dem Desktop kannst du alternativ mit der Maus auf und ab fahren.</p><button className="game-secondary" onClick={onDone}>ZURÜCK</button></div>;
  return <div className="game-stage shake-stage" onPointerDown={() => void requestMotionPermission()}><div className="stage-title"><span>SHAKE / 02</span><span>{desktopMode ? "MOUSE MOTION" : "DEVICE MOTION"}</span></div><div className="shake-orbit"><div className="shake-count">{count}<small>SHAKES</small></div></div><p className="shake-copy">{desktopMode ? "Bewege die Maus schnell auf und ab." : "Schüttle dein Handy so oft wie möglich."}<br /><span>{seconds > 0 ? `Noch ${seconds} Sekunden · danach ist die Runde automatisch vorbei.` : "Runde beendet · Ergebnisse werden synchronisiert."}</span></p></div>;
}

export default function Games() {
  const [, navigate] = useLocation();
  const [session, setSession] = useState<{ roomId: string; playerId: string; nickname: string } | null>(null);
  const [room, setRoom] = useState<Room | null>(null); const [players, setPlayers] = useState<Player[]>([]); const [messages, setMessages] = useState<ChatMessage[]>([]); const [selectedGame, setSelectedGame] = useState<GameId>("reaction"); const [results, setResults] = useState<Record<string, number>>({}); const [scores, setScores] = useState<Record<string, number>>({}); const [notice, setNotice] = useState(""); const [copied, setCopied] = useState(false); const [busy, setBusy] = useState(false); const [showGame, setShowGame] = useState(false); const [roundDone, setRoundDone] = useState(false);
  const finalizedRound = useRef(false);
  const gamePlayers = useMemo(() => players.length === 1 ? [...players, { ...soloBot, room_id: room?.id ?? "local" }] : players, [players, room?.id]);
  const refresh = useCallback(async () => { if (!session) return; try { const data = await loadRoom(session.roomId); setRoom(data.room); setPlayers(data.players); setMessages(data.messages); const totals: Record<string, number> = {}; data.events.filter(event => event.type === "round_winner").forEach(event => { const winner = String(event.payload.winnerId ?? ""); if (winner) totals[winner] = (totals[winner] ?? 0) + 1; }); setScores(totals); } catch (e) { setNotice(e instanceof Error ? e.message : "Verbindung unterbrochen."); } }, [session]);
  useEffect(() => { if (!session) return; let channel: ReturnType<typeof subscribeToRoom> | undefined; void refresh().then(() => { channel = subscribeToRoom(session.roomId, () => void refresh(), (event: RoomEvent) => { if (event.type === "result" && event.payload.game === selectedGame) setResults(old => ({ ...old, [String(event.payload.playerId)]: Number(event.payload.value) })); if (event.type === "round_winner") { const winner = String(event.payload.winnerId ?? ""); if (winner) setScores(old => ({ ...old, [winner]: (old[winner] ?? 0) + 1 })); } }); }); return () => { if (channel) void removeSubscription(channel); }; }, [refresh, session, selectedGame]);
  useEffect(() => { if (room?.status === "playing") setShowGame(true); }, [room?.status]);
  useEffect(() => { if (!showGame || players.length !== 1 || !room?.game || ["pingpong", "bombpass"].includes(room.game)) return undefined; const values: Partial<Record<GameId, number>> = { reaction: 420, shake: 34, tetris: 18000, snake: 19, memory: 3, aim: 9, higherlower: 5, bluffquiz: 1 }; const timer = window.setTimeout(() => { const value = values[room.game!]; if (value == null) return; setResults(old => ({ ...old, [SOLO_BOT_ID]: value })); }, room.game === "reaction" ? 1200 : 900); return () => window.clearTimeout(timer); }, [showGame, players.length, room?.game]);
  const host = Boolean(session && room && room.host_id === session.playerId); const invite = `${window.location.origin}${window.location.pathname}?room=${room?.code ?? ""}`;
  const enter = async (mode: "create" | "join", nickname: string, code: string, avatar: string) => { if (!realtimeConfigured) throw new Error("Realtime ist noch nicht verbunden. VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY fehlen."); setBusy(true); try { const data = mode === "create" ? await createRoom(nickname, avatar) : await joinRoom(code, nickname, avatar); setSession({ roomId: data.roomId, playerId: data.playerId, nickname }); } finally { setBusy(false); } };
  const startGame = async (game: GameId) => { if (!room || !host || busy) return; setBusy(true); finalizedRound.current = false; setResults({}); setRoundDone(false); setSelectedGame(game); setShowGame(true); try { await updateRoom(room.id, { game, status: "playing", round: room.round + 1 }); await emitRoomEvent(room.id, "start", { game, at: Date.now() }); setNotice("Spiel läuft – viel Erfolg!"); } finally { setBusy(false); } };
  const finish = async () => { if (!room || finalizedRound.current) return; finalizedRound.current = true; const betterHigher = ["shake", "tetris", "snake", "memory", "aim", "higherlower", "bluffquiz", "colony"].includes(selectedGame); const ordered = [...gamePlayers].sort((a, b) => betterHigher ? (results[b.id] ?? -Infinity) - (results[a.id] ?? -Infinity) : (results[a.id] ?? Infinity) - (results[b.id] ?? Infinity)); const winner = ordered[0]; if (winner && host) void emitRoomEvent(room.id, "round_winner", { game: selectedGame, winnerId: winner.id }); await updateRoom(room.id, { status: "results" }); setShowGame(false); setRoundDone(true); };
  const backToMenu = async () => { finalizedRound.current = true; setResults({}); setRoundDone(false); setShowGame(false); setNotice(""); if (room && host) await updateRoom(room.id, { status: "lobby", game: null }); };
  const copyInvite = async () => { await navigator.clipboard?.writeText(invite); setCopied(true); setTimeout(() => setCopied(false), 1600); };
  const shareInvite = async () => { if (navigator.share) await navigator.share({ title: "Friends Game Room", text: `🎮 Komm in meinen Game Room! Raumcode: ${room?.code}`, url: invite }); else await copyInvite(); };
  const scoreRows = useMemo(() => [...players].sort((a, b) => (results[a.id] ?? Infinity) - (results[b.id] ?? Infinity)), [players, results]);
  const renderGame = () => {
    const common = { roomId: session.roomId, playerId: session.playerId, players: gamePlayers, onResult: (id: string, value: number) => setResults(old => ({ ...old, [id]: value })), onDone: () => void finish() };
    if (room?.game === "reaction") return <ReactionGame {...common} results={results} />;
    if (room?.game === "shake") return <ShakeGame {...common} results={results} />;
    if (room?.game === "pingpong") return <PingPongGame {...common} host={host} />;
    if (room?.game === "tetris") return <TetrisGame {...common} results={results} />;
    if (room?.game === "snake") return <SnakeGame {...common} />;
    if (room?.game === "memory") return <MemoryGame {...common} />;
    if (room?.game === "bombpass") return <BombPassGame {...common} />;
    if (room?.game === "aim") return <AimTrainerGame {...common} />;
    if (room?.game === "higherlower") return <HigherLowerGame {...common} />;
    if (room?.game === "bluffquiz") return <BluffQuizGame {...common} />;
    if (room?.game === "colony") return <ColonyGame {...common} host={host} />;
    return null;
  };
  if (!session) return <Setup onEnter={enter} />;
  return <main className="games-page lobby-page">
    <header className="games-brand"><button className="back-button" onClick={() => { void leaveRoom(session.roomId, session.playerId); setSession(null); }}>← EXIT</button><span className="games-mark">P34</span><span>FRIENDS / GAME ROOM</span><span className="games-live"><i /> REALTIME</span></header>
    <div className="lobby-grid"><section className="lobby-main">
      <div className="room-head"><div><p className="games-kicker">ROOM / {room?.status?.toUpperCase() ?? "CONNECTING"}</p><h1>{room?.code ?? "-----"}</h1><p>Teile den Code mit deinen Freunden.</p></div><div className="room-actions"><button onClick={() => void copyInvite()}>{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "KOPIERT" : "CODE KOPIEREN"}</button><button onClick={() => void shareInvite()}><Share2 size={16} /> EINLADEN</button></div></div>
      <div className="players-panel game-panel"><div className="panel-heading"><span><Users size={16} /> SPIELER</span><small>{players.length} / 8 ONLINE</small></div><div className="player-grid">{players.map(player => <div className="player-card" key={player.id}><span className="player-avatar">{player.avatar}</span><div><strong>{player.nickname}</strong><small>{room?.host_id === player.id ? "HOST" : "READY"}</small></div>{room?.host_id === player.id && <span className="host-dot">●</span>}</div>)}</div></div>
      <section className="all-time-leaderboard game-panel"><div className="panel-heading"><span><Trophy size={16} /> RANGLISTE / ALLE SPIELE</span><small>1 SIEG = 1 PUNKT</small></div>{[...gamePlayers].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0)).map((player, index) => <div className="all-time-row" key={player.id}><span>{index + 1}</span><strong>{player.nickname}</strong><b>{scores[player.id] ?? 0} P</b></div>)}</section>
      {notice && <div className="connection-note"><Radio size={15} /> {notice}</div>}
      {roundDone ? <section className="results-card game-panel"><div className="results-title"><Trophy size={20} /><span>RUNDE VORBEI</span></div><h2>THE<br /><em>FASTEST</em></h2><Ranking results={results} players={gamePlayers} pointsGame={selectedGame !== "reaction" && selectedGame !== "tetris"} higherIsBetter={selectedGame === "tetris" || selectedGame === "snake" || selectedGame === "aim" || selectedGame === "higherlower" || selectedGame === "bluffquiz" || selectedGame === "colony"} /><div className="total-score"><span>GESAMT / SIEGE</span>{gamePlayers.map(player => <strong key={player.id}>{player.nickname}<b>{scores[player.id] ?? 0} P</b></strong>)}</div><div className="result-actions"><button className="game-primary" onClick={() => void backToMenu()}>ZURÜCK ZUM SPIELMENÜ</button><button className="game-secondary" onClick={() => { setRoundDone(false); setResults({}); void updateRoom(session.roomId, { status: "lobby" }); }}>NOCH EINE RUNDE</button></div></section> : showGame && room?.game ? <section className="active-game game-panel"><div className="game-navigation"><button className="game-secondary" onClick={() => void backToMenu()}>← ZURÜCK ZUM SPIELMENÜ</button><span>{host ? "HOST kann die Runde für alle beenden" : "Zurück beendet nur deine Ansicht"}</span></div><LiveScoreboard players={gamePlayers} results={results} scores={scores} game={selectedGame} currentPlayerId={session.playerId} />{renderGame()}</section> : <section className="select-panel"><div className="panel-heading"><span><Zap size={16} /> SPIEL AUSWÄHLEN</span><small>HOST CONTROL</small></div><div className="game-options"><button className="game-option reaction-option" disabled={!host || busy} onClick={() => void startGame("reaction")}><span>⚡</span><strong>REACTION</strong><small>Wer reagiert am schnellsten?</small></button><button className="game-option shake-option" disabled={!host || busy} onClick={() => void startGame("shake")}><span>◎</span><strong>SHAKE</strong><small>Schüttle dein Handy in 10 Sekunden.</small></button><button className="game-option pingpong-option" disabled={!host || busy} onClick={() => void startGame("pingpong")}><span>◌</span><strong>PINGPONG</strong><small>Solo gegen Computer oder 2–8 Spieler.</small></button><button className="game-option" disabled={!host || busy} onClick={() => void startGame("tetris")}><span>▦</span><strong>TETRIS</strong><small>Überlebe so lange wie möglich.</small></button><button className="game-option" disabled={!host || busy} onClick={() => void startGame("snake")}><span>↝</span><strong>SNAKE</strong><small>Fünf Sekunden Countdown, dann los.</small></button><button className="game-option" disabled={!host || busy} onClick={() => void startGame("memory")}><span>▣</span><strong>MEMORY</strong><small>Mehr Spieler, mehr Karten.</small></button><button className="game-option" disabled={!host || busy} onClick={() => void startGame("bombpass")}><span>◉</span><strong>BOMB PASS</strong><small>Gib die Bombe weiter – der Computer spielt mit.</small></button><button className="game-option" disabled={!host || busy} onClick={() => void startGame("aim")}><span>⊙</span><strong>AIM TRAINER</strong><small>Treffe mehr Ziele als der Computer.</small></button><button className="game-option" disabled={!host || busy} onClick={() => void startGame("higherlower")}><span>↕</span><strong>HIGHER / LOWER</strong><small>Rate die nächste Zahl.</small></button><button className="game-option" disabled={!host || busy} onClick={() => void startGame("bluffquiz")}><span>?</span><strong>BLUFF QUIZ</strong><small>Erfinde Antworten und täusche deine Freunde.</small></button><button className="game-option colony-option" disabled={!host || busy} onClick={() => void startGame("colony")}><span>⌂</span><strong>KOLONIE</strong><small>Baue, produziere und wachse in Echtzeit.</small></button></div>{!host && <p className="host-hint">Warte auf den Host. Er oder sie startet das nächste Spiel.</p>}</section>}
    </section><aside className="lobby-side"><Chat messages={messages} nickname={session.nickname} roomId={session.roomId} /><div className="side-note"><WifiOff size={16} /><p><strong>Fair play / local timing</strong>Reaktionszeiten werden direkt auf deinem Gerät gemessen. Nur das Ergebnis wird synchronisiert.</p></div><div className="side-score"><span>ROUND / {room?.round ?? 0}</span><strong><LinkIcon size={15} /> {room?.game ? room.game.toUpperCase() : "LOBBY"}</strong></div></aside></div>
  </main>;
}
