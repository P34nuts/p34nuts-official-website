import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";

export type GameId = "reaction" | "shake" | "pingpong";
export type RoomStatus = "lobby" | "countdown" | "playing" | "results";
export type Player = { id: string; room_id: string; nickname: string; avatar: string; joined_at: string };
export type ChatMessage = { id: string; room_id: string; nickname: string; message: string; created_at: string };
export type Room = { id: string; code: string; host_id: string; status: RoomStatus; game: GameId | null; round: number; created_at: string };
export type RoomEvent = { id: string; room_id: string; type: string; payload: Record<string, unknown>; created_at: string };

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const realtimeConfigured = Boolean(url && key);
export const supabase: SupabaseClient | null = realtimeConfigured ? createClient(url!, key!) : null;

const clean = (value: string, max: number) => value.trim().replace(/[<>]/g, "").slice(0, max);
export const cleanNickname = (value: string) => clean(value, 18).replace(/[^A-Za-z0-9À-ž _-]/g, "");
export const cleanChat = (value: string) => clean(value, 240);
export const createId = () => crypto.randomUUID();
export const createCode = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
};

function requiredClient() {
  if (!supabase) throw new Error("Realtime ist noch nicht konfiguriert.");
  return supabase;
}

export async function createRoom(nickname: string, avatar: string) {
  const client = requiredClient();
  const playerId = createId();
  const roomId = createId();
  let code = createCode();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: existing } = await client.from("rooms").select("id").eq("code", code).maybeSingle();
    if (!existing) break;
    code = createCode();
  }
  const { error: roomError } = await client.from("rooms").insert({ id: roomId, code, host_id: playerId, status: "lobby", round: 0 });
  if (roomError) throw roomError;
  const { error: playerError } = await client.from("room_players").insert({ id: playerId, room_id: roomId, nickname: cleanNickname(nickname), avatar });
  if (playerError) throw playerError;
  return { roomId, playerId, code };
}

export async function joinRoom(codeInput: string, nickname: string, avatar: string) {
  const client = requiredClient();
  const code = clean(codeInput, 5).toUpperCase();
  const { data: room, error } = await client.from("rooms").select("id,code,status").eq("code", code).maybeSingle();
  if (error) throw error;
  if (!room) throw new Error("Dieser Raum wurde nicht gefunden.");
  if (room.status !== "lobby") throw new Error("Die Runde läuft bereits. Bitte den Host um einen neuen Raum bitten.");
  const { count } = await client.from("room_players").select("id", { count: "exact", head: true }).eq("room_id", room.id);
  if ((count ?? 0) >= 8) throw new Error("Der Raum ist voll (maximal 8 Spieler).");
  const playerId = createId();
  const { error: playerError } = await client.from("room_players").insert({ id: playerId, room_id: room.id, nickname: cleanNickname(nickname), avatar });
  if (playerError) throw playerError;
  return { roomId: room.id, playerId, code: room.code };
}

export async function loadRoom(roomId: string) {
  const client = requiredClient();
  const [room, players, messages] = await Promise.all([
    client.from("rooms").select("*").eq("id", roomId).single(),
    client.from("room_players").select("*").eq("room_id", roomId).order("joined_at"),
    client.from("room_messages").select("*").eq("room_id", roomId).order("created_at", { ascending: true }).limit(80),
  ]);
  if (room.error) throw room.error;
  if (players.error) throw players.error;
  if (messages.error) throw messages.error;
  return { room: room.data as Room, players: (players.data ?? []) as Player[], messages: (messages.data ?? []) as ChatMessage[] };
}

export async function sendChat(roomId: string, nickname: string, message: string) {
  const value = cleanChat(message);
  if (!value) return;
  const { error } = await requiredClient().from("room_messages").insert({ room_id: roomId, nickname: cleanNickname(nickname), message: value });
  if (error) throw error;
}

export async function emitRoomEvent(roomId: string, type: string, payload: Record<string, unknown>) {
  const { error } = await requiredClient().from("room_events").insert({ room_id: roomId, type: clean(type, 40), payload });
  if (error) throw error;
}

export async function updateRoom(roomId: string, values: Partial<Pick<Room, "status" | "game" | "round" | "host_id">>) {
  const { error } = await requiredClient().from("rooms").update(values).eq("id", roomId);
  if (error) throw error;
}

export async function leaveRoom(roomId: string, playerId: string) {
  const client = requiredClient();
  await client.from("room_players").delete().eq("id", playerId).eq("room_id", roomId);
  const { data: room } = await client.from("rooms").select("host_id").eq("id", roomId).maybeSingle();
  if (room?.host_id === playerId) {
    const { data: next } = await client.from("room_players").select("id").eq("room_id", roomId).order("joined_at").limit(1).maybeSingle();
    if (next) await client.from("rooms").update({ host_id: next.id }).eq("id", roomId);
  }
}

export function subscribeToRoom(roomId: string, onChange: () => void, onEvent: (event: RoomEvent) => void): RealtimeChannel {
  const channel = requiredClient()
    .channel(`game-room:${roomId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` }, onChange)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${roomId}` }, onChange)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "room_events", filter: `room_id=eq.${roomId}` }, (payload) => onEvent(payload.new as RoomEvent))
    .subscribe();
  return channel;
}

export async function removeSubscription(channel: RealtimeChannel) {
  if (supabase) await supabase.removeChannel(channel);
}

export function subscribeToRoomBroadcast(roomId: string, onPayload: (payload: Record<string, unknown>) => void): RealtimeChannel {
  const channel = requiredClient()
    .channel(`game-room-pingpong:${roomId}`)
    .on("broadcast", { event: "pingpong" }, (message) => onPayload(message.payload as Record<string, unknown>))
    .subscribe();
  return channel;
}

export async function sendRoomBroadcast(channel: RealtimeChannel, payload: Record<string, unknown>) {
  await channel.send({ type: "broadcast", event: "pingpong", payload });
}
