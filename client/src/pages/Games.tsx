import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Check, Copy, Link as LinkIcon, MessageCircle, Radio, Share2, Smartphone, Trophy, Users, WifiOff, Zap } from "lucide-react";
import { cleanNickname, createRoom, emitRoomEvent, joinRoom, leaveRoom, loadRoom, realtimeConfigured, removeSubscription, sendChat, subscribeToRoom, updateRoom, type ChatMessage, type GameId, type Player, type Room, type RoomEvent } from "@/games/multiplayer";
import "@/games/games.css";
import PingPongGame from "@/games/PingPongGame";
import TetrisGame from "@/games/TetrisGame";

const avatars = ["◒", "✦", "◓", "✹", "◉", "◇", "✷", "⬡"];
const points = [10, 7, 5, 3, 1];
const randomAvatar = () => avatars[Math.floor(Math.random() * avatars.length)];
const formatMs = (value?: number) => value == null ? "—" : `${Math.round(value)} ms`;

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

function Ranking({ results, players, higherIsBetter = false }: { results: Record<string, number>; players: Player[]; higherIsBetter?: boolean }) {
  const ordered = [...players].sort((a, b) => higherIsBetter ? (results[b.id] ?? -Infinity) - (results[a.id] ?? -Infinity) : (results[a.id] ?? Infinity) - (results[b.id] ?? Infinity));
  return <div className="ranking">{ordered.map((player, index) => <div className={`rank-row rank-${index + 1}`} key={player.id}><span className="rank-place">{index < 3 ? ["🥇", "🥈", "🥉"][index] : `0${index + 1}`}</span><span className="rank-avatar">{player.avatar}</span><strong>{player.nickname}</strong><span className="rank-score">{formatMs(results[player.id])}</span></div>)}</div>;
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
  const refresh = useCallback(async () => { if (!session) return; try { const data = await loadRoom(session.roomId); setRoom(data.room); setPlayers(data.players); setMessages(data.messages); } catch (e) { setNotice(e instanceof Error ? e.message : "Verbindung unterbrochen."); } }, [session]);
  useEffect(() => { if (!session) return; let channel: ReturnType<typeof subscribeToRoom> | undefined; void refresh().then(() => { channel = subscribeToRoom(session.roomId, () => void refresh(), (event: RoomEvent) => { if (event.type === "result" && event.payload.game === selectedGame) setResults(old => ({ ...old, [String(event.payload.playerId)]: Number(event.payload.value) })); if (event.type === "start") setShowGame(true); }); }); return () => { if (channel) void removeSubscription(channel); }; }, [refresh, session, selectedGame]);
  useEffect(() => { if (room?.status === "countdown") { const timer = window.setTimeout(() => setShowGame(true), 3000); return () => window.clearTimeout(timer); } return undefined; }, [room?.status]);
  const host = Boolean(session && room && room.host_id === session.playerId); const invite = `${window.location.origin}${window.location.pathname}?room=${room?.code ?? ""}`;
  const enter = async (mode: "create" | "join", nickname: string, code: string, avatar: string) => { if (!realtimeConfigured) throw new Error("Realtime ist noch nicht verbunden. VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY fehlen."); setBusy(true); try { const data = mode === "create" ? await createRoom(nickname, avatar) : await joinRoom(code, nickname, avatar); setSession({ roomId: data.roomId, playerId: data.playerId, nickname }); } finally { setBusy(false); } };
  const startGame = async (game: GameId) => { if (!room || !host) return; setBusy(true); setResults({}); setRoundDone(false); setSelectedGame(game); await updateRoom(room.id, { game, status: "countdown", round: room.round + 1 }); await emitRoomEvent(room.id, "start", { game, at: Date.now() + 3000 }); setNotice("Der Countdown läuft für alle Spieler gleichzeitig."); setTimeout(() => { void updateRoom(room.id, { status: "playing" }); }, 3000); setBusy(false); };
  const finish = async () => { if (!room) return; await updateRoom(room.id, { status: "results" }); const ordered = [...players].sort((a, b) => (results[a.id] ?? Infinity) - (results[b.id] ?? Infinity)); setScores(old => { const next = { ...old }; ordered.forEach((player, index) => { next[player.id] = (next[player.id] ?? 0) + (points[index] ?? 1); }); return next; }); setShowGame(false); setRoundDone(true); };
  const copyInvite = async () => { await navigator.clipboard?.writeText(invite); setCopied(true); setTimeout(() => setCopied(false), 1600); };
  const shareInvite = async () => { if (navigator.share) await navigator.share({ title: "Friends Game Room", text: `🎮 Komm in meinen Game Room! Raumcode: ${room?.code}`, url: invite }); else await copyInvite(); };
  const scoreRows = useMemo(() => [...players].sort((a, b) => (results[a.id] ?? Infinity) - (results[b.id] ?? Infinity)), [players, results]);
  if (!session) return <Setup onEnter={enter} />;
  return <main className="games-page lobby-page"><header className="games-brand"><button className="back-button" onClick={() => { void leaveRoom(session.roomId, session.playerId); setSession(null); }}>← EXIT</button><span className="games-mark">P34</span><span>FRIENDS / GAME ROOM</span><span className="games-live"><i /> REALTIME</span></header><div className="lobby-grid"><section className="lobby-main"><div className="room-head"><div><p className="games-kicker">ROOM / {room?.status?.toUpperCase() ?? "CONNECTING"}</p><h1>{room?.code ?? "-----"}</h1><p>Teile den Code mit deinen Freunden.</p></div><div className="room-actions"><button onClick={() => void copyInvite}>{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "KOPIERT" : "CODE KOPIEREN"}</button><button onClick={() => void shareInvite()}><Share2 size={16} /> EINLADEN</button></div></div><div className="players-panel game-panel"><div className="panel-heading"><span><Users size={16} /> SPIELER</span><small>{players.length} / 8 ONLINE</small></div><div className="player-grid">{players.map(player => <div className="player-card" key={player.id}><span className="player-avatar">{player.avatar}</span><div><strong>{player.nickname}</strong><small>{room?.host_id === player.id ? "HOST" : "READY"}</small></div>{room?.host_id === player.id && <span className="host-dot">●</span>}</div>)}</div></div>{notice && <div className="connection-note"><Radio size={15} /> {notice}</div>}{roundDone ? <section className="results-card game-panel"><div className="results-title"><Trophy size={20} /><span>RUNDE VORBEI</span></div><h2>THE<br /><em>FASTEST</em></h2><Ranking results={results} players={players} higherIsBetter={room?.game === "tetris"} /><div className="total-score"><span>GESAMT / PUNKTE</span>{scoreRows.map(player => <strong key={player.id}>{player.nickname}<b>{scores[player.id] ?? 0}</b></strong>)}</div><div className="result-actions"><button className="game-primary" onClick={() => { setRoundDone(false); setResults({}); void updateRoom(session.roomId, { status: "lobby" }); }}>NOCH EINE RUNDE</button><button className="game-secondary" onClick={() => { setRoundDone(false); setResults({}); }}>ANDERES SPIEL</button></div></section> : showGame && room?.game ? <section className="active-game game-panel">{room.game === "reaction" ? <ReactionGame roomId={session.roomId} playerId={session.playerId} players={players} results={results} onResult={(id, value) => setResults(old => ({ ...old, [id]: value }))} onDone={() => void finish()} /> : room.game === "shake" ? <ShakeGame roomId={session.roomId} playerId={session.playerId} players={players} results={results} onResult={(id, value) => setResults(old => ({ ...old, [id]: value }))} onDone={() => void finish()} /> : room.game === "pingpong" ? <PingPongGame roomId={session.roomId} playerId={session.playerId} players={players} host={host} onResult={(id, value) => setResults(old => ({ ...old, [id]: value }))} onDone={() => void finish()} /> : <TetrisGame roomId={session.roomId} playerId={session.playerId} players={players} results={results} onResult={(id, value) => setResults(old => ({ ...old, [id]: value }))} onDone={() => void finish()} />}</section> : <section className="select-panel"><div className="panel-heading"><span><Zap size={16} /> SPIEL AUSWÄHLEN</span><small>HOST CONTROL</small></div><div className="game-options"><button className="game-option reaction-option" disabled={!host || busy} onClick={() => void startGame("reaction")}><span>⚡</span><strong>REACTION</strong><small>Wer reagiert am schnellsten?</small></button><button className="game-option shake-option" disabled={!host || busy} onClick={() => void startGame("shake")}><span>◎</span><strong>SHAKE</strong><small>Schüttle dein Handy in 10 Sekunden.</small></button><button className="game-option pingpong-option" disabled={!host || busy || players.length < 2} onClick={() => void startGame("pingpong")}><span>◌</span><strong>PINGPONG</strong><small>2–8 Spieler. Jede Seite gehört einem Spieler.</small></button><button className="game-option tetris-option" disabled={!host || busy} onClick={() => void startGame("tetris")}><span>▦</span><strong>TETRIS</strong><small>Jeder spielt allein. Wer am längsten durchhält, gewinnt.</small></button></div>{!host && <p className="host-hint">Warte auf den Host. Er oder sie startet das nächste Spiel.</p>}{host && players.length < 2 && <p className="host-hint">Für Pingpong müssen mindestens zwei Spieler im Raum sein.</p>}</section>}</section><aside className="lobby-side"><Chat messages={messages} nickname={session.nickname} roomId={session.roomId} /><div className="side-note"><WifiOff size={16} /><p><strong>Fair play / local timing</strong>Reaktionszeiten werden direkt auf deinem Gerät gemessen. Nur das Ergebnis wird synchronisiert.</p></div><div className="side-score"><span>ROUND / {room?.round ?? 0}</span><strong><LinkIcon size={15} /> {room?.game ? room.game.toUpperCase() : "LOBBY"}</strong></div></aside></div></main>;
}
