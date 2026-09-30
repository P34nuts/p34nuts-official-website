import { useEffect, useMemo, useRef, useState } from "react";
import { emitRoomEvent, removeSubscription, subscribeToRoom, type Player } from "@/games/multiplayer";

type ResourceKey = "wood" | "stone" | "food" | "clay";
type BuildingKey = "hut" | "sawmill" | "quarry" | "farm" | "road";
type Tile = "forest" | "stone" | "field" | "clay" | "water" | "plain";
type Building = { id: string; owner: string; kind: BuildingKey; tile: number };
type ColonyPlayer = { resources: Record<ResourceKey, number>; score: number };
type ColonyState = { players: Record<string, ColonyPlayer>; buildings: Building[]; startedAt: number; winner?: string };
type Action = { action: "build" | "trade"; playerId: string; kind?: BuildingKey; tile?: number; give?: ResourceKey; get?: ResourceKey };

const tiles: Tile[] = ["forest", "plain", "stone", "field", "forest", "water", "clay", "plain", "field", "forest", "stone", "plain", "clay", "field", "water", "forest", "plain", "stone", "field", "clay", "plain", "forest", "water", "field", "stone", "plain", "clay", "forest", "field", "plain", "stone", "water", "forest", "clay", "field", "plain", "forest", "stone", "field", "clay", "plain", "water", "forest", "field", "stone", "plain", "clay", "forest", "field", "water", "plain", "stone", "forest", "clay", "field", "plain", "forest", "stone", "water", "field", "clay", "plain", "forest", "field", "stone", "plain", "water", "clay", "forest", "field", "plain"];
const costs: Record<BuildingKey, Partial<Record<ResourceKey, number>>> = { hut: { wood: 3, stone: 1 }, sawmill: { wood: 4, stone: 2 }, quarry: { wood: 2, stone: 4 }, farm: { wood: 2, clay: 2 }, road: { wood: 1 } };
const labels: Record<BuildingKey, string> = { hut: "Hütte", sawmill: "Sägewerk", quarry: "Steinbruch", farm: "Hof", road: "Straße" };
const icons: Record<BuildingKey, string> = { hut: "⌂", sawmill: "▥", quarry: "◆", farm: "♒", road: "━" };
const resourceLabels: Record<ResourceKey, string> = { wood: "Holz", stone: "Stein", food: "Nahrung", clay: "Lehm" };
const initialPlayer = (): ColonyPlayer => ({ resources: { wood: 8, stone: 5, food: 8, clay: 4 }, score: 0 });
const makeInitial = (players: Player[]): ColonyState => ({ players: Object.fromEntries(players.map(player => [player.id, initialPlayer()])), buildings: [], startedAt: Date.now() });
const canPay = (wallet: Record<ResourceKey, number>, cost: Partial<Record<ResourceKey, number>>) => Object.entries(cost).every(([key, value]) => wallet[key as ResourceKey] >= (value ?? 0));
const title = (kind: BuildingKey) => `${labels[kind]} · ${Object.entries(costs[kind]).map(([key, value]) => `${value} ${resourceLabels[key as ResourceKey]}`).join(" · ")}`;

export default function ColonyGame({ roomId, playerId, players, host, onResult, onDone }: { roomId: string; playerId: string; players: Player[]; host: boolean; onResult: (id: string, value: number) => void; onDone: () => void }) {
  const [state, setState] = useState<ColonyState>(() => makeInitial(players));
  const stateRef = useRef(state); stateRef.current = state;
  const [selected, setSelected] = useState<BuildingKey>("hut");
  const [notice, setNotice] = useState("Baue deine Kolonie auf.");
  const initialized = useRef(false); const finished = useRef(false);
  const me = state.players[playerId] ?? initialPlayer();
  const mine = state.buildings.filter(building => building.owner === playerId);
  const occupied = useMemo(() => new Set(state.buildings.map(building => building.tile)), [state.buildings]);

  const publish = (next: ColonyState) => { stateRef.current = next; setState(next); void emitRoomEvent(roomId, "colony_state", { state: next }); };
  const applyAction = (action: Action) => {
    const current = stateRef.current;
    if (action.action === "trade") {
      const actor = current.players[action.playerId]; if (!actor || !action.give || !action.get || actor.resources[action.give] < 2) return;
      const next: ColonyState = { ...current, players: { ...current.players, [action.playerId]: { ...actor, resources: { ...actor.resources, [action.give]: actor.resources[action.give] - 2, [action.get]: actor.resources[action.get] + 1 } } } }; publish(next); return;
    }
    if (action.action !== "build" || action.kind == null || action.tile == null || occupied.has(action.tile)) return;
    const actor = current.players[action.playerId]; const cost = costs[action.kind]; if (!actor || !canPay(actor.resources, cost)) return;
    const resources = { ...actor.resources }; Object.entries(cost).forEach(([key, value]) => { resources[key as ResourceKey] -= value ?? 0; });
    const next: ColonyState = { ...current, players: { ...current.players, [action.playerId]: { resources, score: actor.score + (action.kind === "hut" ? 3 : action.kind === "road" ? 1 : 2) } }, buildings: [...current.buildings, { id: `${action.playerId}-${Date.now()}-${action.tile}`, owner: action.playerId, kind: action.kind, tile: action.tile }] };
    publish(next); setNotice(`${labels[action.kind]} gebaut.`);
  };

  useEffect(() => {
    const channel = subscribeToRoom(roomId, () => undefined, event => {
      if (event.type === "colony_state") { const next = event.payload.state as ColonyState; if (next?.players) { stateRef.current = next; setState(next); } }
      if (event.type === "colony_action" && host) applyAction(event.payload as unknown as Action);
    }, `colony-room:${roomId}`);
    if (host && !initialized.current) { initialized.current = true; const next = makeInitial(players); publish(next); }
    return () => { void removeSubscription(channel); };
  }, [host, players, roomId]);

  useEffect(() => {
    if (!host || state.winner || players.length !== 2 || !state.players["computer-bot"]) return undefined;
    const timer = window.setInterval(() => {
      const current = stateRef.current; const bot = current.players["computer-bot"]; if (!bot || bot.score >= 20) return;
      const options = (["hut", "farm", "sawmill", "quarry"] as BuildingKey[]).filter(kind => canPay(bot.resources, costs[kind])); const kind = options[0]; const tile = tiles.findIndex((tile, index) => tile !== "water" && !current.buildings.some(building => building.tile === index)); if (kind && tile >= 0) applyAction({ action: "build", playerId: "computer-bot", kind, tile });
    }, 2500);
    return () => window.clearInterval(timer);
  }, [host, players.length, state.players, state.winner]);

  useEffect(() => {
    if (!host || finished.current) return undefined;
    const timer = window.setInterval(() => {
      const current = stateRef.current; const nextPlayers = Object.fromEntries(Object.entries(current.players).map(([id, player]) => {
        const owned = current.buildings.filter(building => building.owner === id); const resources = { ...player.resources };
        owned.forEach(building => { if (building.kind === "sawmill") resources.wood += 1; if (building.kind === "quarry") resources.stone += 1; if (building.kind === "farm") resources.food += 1; });
        return [id, { ...player, resources }];
      }));
      const winner = Object.entries(nextPlayers).find(([, player]) => player.score >= 20)?.[0];
      const next = { ...current, players: nextPlayers, winner }; publish(next);
      if (winner && !finished.current) { finished.current = true; Object.entries(nextPlayers).forEach(([id, player]) => onResult(id, player.score)); window.setTimeout(onDone, 900); }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [host, onDone, onResult]);

  const chooseTile = (tile: number) => { if (tiles[tile] === "water" || occupied.has(tile) || !canPay(me.resources, costs[selected])) { setNotice(tiles[tile] === "water" ? "Auf Wasser kann nicht gebaut werden." : occupied.has(tile) ? "Dieser Bauplatz ist bereits belegt." : "Dafür fehlen Ressourcen."); return; } if (host) applyAction({ action: "build", playerId, kind: selected, tile }); else void emitRoomEvent(roomId, "colony_action", { action: "build", playerId, kind: selected, tile }); };
  const trade = (give: ResourceKey, get: ResourceKey) => { if (give === get || me.resources[give] < 2) return; const action: Action = { action: "trade", playerId, give, get }; if (host) applyAction(action); else void emitRoomEvent(roomId, "colony_action", action); };
  const playerName = (id: string) => players.find(player => player.id === id)?.nickname ?? (id === "computer-bot" ? "Computer" : "Spieler");

  return <div className="game-stage colony-stage"><div className="stage-title"><span>KOLONIE / REALTIME</span><span>{players.length} SPIELER · ZIEL 20 P</span></div><div className="colony-top"><div className="colony-resources">{(Object.keys(resourceLabels) as ResourceKey[]).map(resource => <span key={resource}><b>{me.resources[resource]}</b> {resourceLabels[resource]}</span>)}</div><strong>{me.score} P</strong></div><div className="colony-layout"><div className="colony-map">{tiles.map((tile, index) => { const building = state.buildings.find(item => item.tile === index); return <button key={index} type="button" disabled={tile === "water" || Boolean(building)} onClick={() => chooseTile(index)} title={building ? `${labels[building.kind]} – ${playerName(building.owner)}` : `${tile} · ${title(selected)}`} className={`colony-tile terrain-${tile} ${building ? "has-building" : ""}`}><span>{building ? icons[building.kind] : tile === "water" ? "≈" : ""}</span>{building && <small>{playerName(building.owner).slice(0, 5)}</small>}</button>; })}</div><aside className="colony-controls"><p className="colony-notice">{state.winner ? `${playerName(state.winner)} gewinnt die Kolonie.` : notice}</p><div className="building-palette">{(Object.keys(labels) as BuildingKey[]).map(kind => <button type="button" key={kind} className={selected === kind ? "selected" : ""} onClick={() => setSelected(kind)}><b>{icons[kind]}</b><span>{labels[kind]}</span><small>{Object.entries(costs[kind]).map(([key, value]) => `${value} ${resourceLabels[key as ResourceKey][0]}`).join(" · ")}</small></button>)}</div><div className="trade-row"><span>HANDEL / 2 → 1</span>{(Object.keys(resourceLabels) as ResourceKey[]).map(give => (Object.keys(resourceLabels) as ResourceKey[]).filter(get => get !== give).slice(0, 1).map(get => <button key={`${give}-${get}`} type="button" disabled={me.resources[give] < 2} onClick={() => trade(give, get)}>{resourceLabels[give][0]} → {resourceLabels[get][0]}</button>))}</div></aside></div><div className="colony-players">{players.map(player => <div key={player.id}><span>{player.avatar}</span><strong>{playerName(player.id)}</strong><small>{state.players[player.id]?.score ?? 0} P · {state.buildings.filter(building => building.owner === player.id).length} Gebäude</small></div>)}</div><p className="game-help">Wähle ein Gebäude, klicke auf einen freien Landabschnitt und baue deine Kolonie. Sägewerk, Steinbruch und Hof produzieren automatisch.</p></div>;
}
