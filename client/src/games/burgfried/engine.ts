/**
 * GameEngine – die komplette Spielsimulation (ohne DOM, daher headless testbar).
 *
 * Verantwortlich für: Karte, Gebäude, Bauen/Abriss, Straßennetz, Arbeiter, Produktion,
 * Verbrauch, Bevölkerung, Forschung, Handel, Aufgaben, Level, Speichern/Laden.
 *
 * Die Simulation läuft in festen Schritten (SIM_STEP Sekunden); `update(dt)` wird vom
 * Renderer pro Frame aufgerufen. UI-Komponenten lesen den Zustand direkt und werden über
 * `subscribe` / `version` informiert (ca. 4× pro Sekunde, sowie nach jeder Aktion).
 */
import {
  BUILDINGS, DEPOSIT_RES, DEPOSIT_YIELD, JOBS, JOB_IDS, QUESTS, RESOURCES, RES_IDS, T, TECHS, xpToNext,
  LEVEL_UNLOCKS, MAP_SIZE, STATUS_TEXT,
  type BStatus, type BuildingDef, type BuildingId, type JobId, type QuestDef, type ResId,
} from "./data";
import { generateMap, type MapData } from "./mapgen";

const SIM_STEP = 0.5;
/** Anteil der Einwohner, der arbeiten kann (Rest: Kinder, Alte) */
const WORKER_SHARE = 0.85;
/** Nahrungsbedarf pro Einwohner und Minute */
const FOOD_PER_CAPITA = 0.12;
const SOLDIERS_PER_BARRACKS = 10;

export interface Building {
  id: number;
  type: BuildingId;
  x: number;
  y: number;
  /** Baufortschritt 0..1 */
  progress: number;
  built: boolean;
  /* --- abgeleitet (nicht gespeichert) --- */
  status: BStatus;
  workers: number;
  connected: boolean;
  /** Standortqualität 0..1 */
  site: number;
  /** Gesamteffizienz 0..1+ */
  eff: number;
  mineRes: ResId | null;
  missing: ResId | null;
}

export interface Toast { id: number; text: string; kind: "info" | "good" | "warn" | "level"; t: number }
export interface PlaceCheck { ok: boolean; reason: string | null; site: number | null; mineRes: ResId | null }
export interface Ghost { x: number; y: number; check: PlaceCheck }
export interface Bottleneck { sev: "bad" | "warn"; text: string }

export interface SaveData {
  v: number;
  seed: number;
  buildings: { t: BuildingId; x: number; y: number; p: number }[];
  res: Record<string, number>;
  xp: number; level: number; pop: number; soldiers: number; playTime: number;
  research: { done: string[]; active: { id: string; remaining: number } | null };
  questsDone: string[];
  tradeCount: number;
}

type ResMap = Record<ResId, number>;
const zeroRes = (): ResMap => Object.fromEntries(RES_IDS.map((r) => [r, 0])) as ResMap;

export class GameEngine {
  map: MapData;
  seed: number;
  buildings: Building[] = [];
  /** Belegung: Gebäude-ID je Kachel (0 = frei) */
  occ: Int32Array;
  private roadReach: Uint8Array;
  private byId = new Map<number, Building>();
  private nextId = 1;

  res: ResMap = zeroRes();
  xp = 0;
  level = 1;
  pop = 8;
  soldiers = 0;
  playTime = 0;
  research: { done: string[]; active: { id: string; remaining: number } | null } = { done: [], active: null };
  questsDone: string[] = [];
  tradeCount = 0;

  /* --- abgeleitete Werte --- */
  limit: ResMap = zeroRes();
  prod: ResMap = zeroRes();
  cons: ResMap = zeroRes();
  popCap = 0;
  workforce = 0;
  byJob = Object.fromEntries(JOB_IDS.map((j) => [j, { needed: 0, filled: 0 }])) as Record<JobId, { needed: number; filled: number }>;
  foodStatus: "ok" | "low" | "starving" = "ok";
  growthPerMin = 0;
  military = 0;

  /* --- UI-Zustand (Interaktion) --- */
  ui: { buildType: BuildingId | null; selectedId: number | null; ghost: Ghost | null } = {
    buildType: null, selectedId: null, ghost: null,
  };
  toasts: Toast[] = [];
  version = 0;
  dirtyFlag = true;

  private listeners = new Set<() => void>();
  private acc = 0;
  private notifyAcc = 0;
  private toastId = 1;
  private flowProd = zeroRes();
  private flowCons = zeroRes();
  private clock = 0;

  private constructor(seed: number) {
    this.seed = seed;
    this.map = generateMap(seed);
    this.occ = new Int32Array(MAP_SIZE * MAP_SIZE);
    this.roadReach = new Uint8Array(MAP_SIZE * MAP_SIZE);
  }

  /* ================================================================ Erzeugen */

  /** Neues Spiel: kleine Siedlung mit Lagerhaus, Straße und zwei Häusern */
  static newGame(seed: number): GameEngine {
    const g = new GameEngine(seed);
    g.res = { ...zeroRes(), holz: 150, stein: 80, bretter: 20, getreide: 150, brot: 50, gold: 50 };
    const c = MAP_SIZE / 2;
    g.addBuilding("warehouse", c - 1, c - 2, true);
    for (let x = c - 3; x <= c + 4; x++) g.addBuilding("road", x, c + 1, true);
    g.addBuilding("house_s", c - 2, c + 2, true);
    g.addBuilding("house_s", c, c + 2, true);
    g.pop = 8;
    g.recompute();
    g.computeStats();
    return g;
  }

  /** Spielstand laden (validiert, damit defekte Saves die Engine nicht zerstören) */
  static load(data: SaveData): GameEngine {
    const g = new GameEngine(Math.floor(Number(data.seed)) || 1);
    const num = (v: unknown, d: number) => (typeof v === "number" && isFinite(v) ? v : d);
    for (const r of RES_IDS) g.res[r] = Math.max(0, num(data.res?.[r], 0));
    g.xp = Math.max(0, num(data.xp, 0));
    g.level = Math.max(1, Math.floor(num(data.level, 1)));
    g.pop = Math.max(0, num(data.pop, 0));
    g.soldiers = Math.max(0, num(data.soldiers, 0));
    g.playTime = Math.max(0, num(data.playTime, 0));
    g.tradeCount = Math.max(0, Math.floor(num(data.tradeCount, 0)));
    g.questsDone = Array.isArray(data.questsDone) ? data.questsDone.filter((x) => QUESTS.some((q) => q.id === x)) : [];
    const done = Array.isArray(data.research?.done) ? data.research.done.filter((id) => TECHS.some((t) => t.id === id)) : [];
    const act = data.research?.active;
    g.research = {
      done,
      active: act && TECHS.some((t) => t.id === act.id) ? { id: act.id, remaining: Math.max(0, num(act.remaining, 1)) } : null,
    };
    for (const b of Array.isArray(data.buildings) ? data.buildings : []) {
      if (!BUILDINGS[b.t]) continue;
      if (!g.terrainFree(b.t, Math.floor(b.x), Math.floor(b.y))) continue;
      const nb = g.addBuilding(b.t, Math.floor(b.x), Math.floor(b.y), num(b.p, 1) >= 1);
      if (nb && !nb.built) nb.progress = Math.max(0, Math.min(0.99, num(b.p, 0)));
    }
    g.recompute();
    g.computeStats();
    return g;
  }

  serialize(): SaveData {
    return {
      v: 1,
      seed: this.seed,
      buildings: this.buildings.map((b) => ({ t: b.type, x: b.x, y: b.y, p: b.built ? 1 : Math.round(b.progress * 1000) / 1000 })),
      res: Object.fromEntries(RES_IDS.map((r) => [r, Math.round(this.res[r] * 100) / 100])),
      xp: Math.round(this.xp * 100) / 100,
      level: this.level,
      pop: Math.round(this.pop * 100) / 100,
      soldiers: Math.round(this.soldiers * 100) / 100,
      playTime: Math.round(this.playTime),
      research: this.research,
      questsDone: this.questsDone,
      tradeCount: this.tradeCount,
    };
  }

  /* ============================================================ Abonnements */
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  };
  private notify() {
    this.version++;
    this.listeners.forEach((l) => l());
  }

  toast(text: string, kind: Toast["kind"] = "info") {
    this.toasts.push({ id: this.toastId++, text, kind, t: this.clock });
    if (this.toasts.length > 5) this.toasts.shift();
  }

  /* ================================================================== Bauen */

  private idx(x: number, y: number) { return y * MAP_SIZE + x; }
  private inb(x: number, y: number) { return x >= 0 && y >= 0 && x < MAP_SIZE && y < MAP_SIZE; }

  /** Kachel-Gelände + Belegung prüfen (ohne Kosten/Level) */
  private terrainFree(type: BuildingId, x: number, y: number): boolean {
    const [w, h] = BUILDINGS[type].size;
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        if (!this.inb(x + i, y + j)) return false;
        const t = this.map.terrain[this.idx(x + i, y + j)];
        if (t !== T.GRASS && t !== T.SAND) return false;
        if (this.occ[this.idx(x + i, y + j)]) return false;
      }
    return true;
  }

  private addBuilding(type: BuildingId, x: number, y: number, built: boolean): Building | null {
    if (!this.terrainFree(type, x, y)) return null;
    const def = BUILDINGS[type];
    const b: Building = {
      id: this.nextId++, type, x, y, progress: built ? 1 : 0, built,
      status: built ? "ok" : "constructing", workers: 0, connected: false, site: 1, eff: 0, mineRes: null, missing: null,
    };
    this.buildings.push(b);
    this.byId.set(b.id, b);
    for (let j = 0; j < def.size[1]; j++)
      for (let i = 0; i < def.size[0]; i++) this.occ[this.idx(x + i, y + j)] = b.id;
    this.dirtyFlag = true;
    return b;
  }

  getBuilding(id: number): Building | undefined { return this.byId.get(id); }
  buildingAt(x: number, y: number): Building | undefined {
    if (!this.inb(x, y)) return undefined;
    const id = this.occ[this.idx(x, y)];
    return id ? this.byId.get(id) : undefined;
  }
  count(type: BuildingId, builtOnly = true): number {
    let n = 0;
    for (const b of this.buildings) if (b.type === type && (!builtOnly || b.built)) n++;
    return n;
  }

  /** Standortqualität für ein (auch noch nicht gebautes) Gebäude */
  computeSite(type: BuildingId, x: number, y: number): { factor: number; mineRes: ResId | null } {
    const def = BUILDINGS[type];
    const s = def.site;
    if (!s) return { factor: 1, mineRes: null };
    const [w, h] = def.size;
    if (s.kind === "fields") {
      const cx = x + w / 2, cy = y + h / 2;
      let n = 0;
      for (const b of this.buildings) {
        if (b.type !== "field" || !b.built) continue;
        if (Math.hypot(b.x + 1 - cx, b.y + 1 - cy) <= s.radius) n++;
      }
      return { factor: Math.min(1, n / s.full), mineRes: null };
    }
    const counts = [0, 0, 0, 0];
    let forest = 0, mountain = 0;
    for (let yy = y - s.radius; yy < y + h + s.radius; yy++)
      for (let xx = x - s.radius; xx < x + w + s.radius; xx++) {
        if (!this.inb(xx, yy)) continue;
        const i = this.idx(xx, yy);
        const t = this.map.terrain[i];
        if (t === T.FOREST) forest++;
        else if (t === T.MOUNTAIN) { mountain++; counts[this.map.deposit[i]]++; }
      }
    if (s.kind === "forest") return { factor: Math.min(1, forest / s.full), mineRes: null };
    if (s.kind === "mountain") return { factor: Math.min(1, mountain / s.full), mineRes: null };
    // Mine: häufigstes Vorkommen bestimmt das Erz
    let best = 1;
    for (const k of [1, 2, 3]) if (counts[k] > counts[best]) best = k;
    const n = counts[best];
    return { factor: Math.min(1, n / s.full), mineRes: n > 0 ? DEPOSIT_RES[best] : null };
  }

  checkPlace(type: BuildingId, x: number, y: number): PlaceCheck {
    const def = BUILDINGS[type];
    if (this.level < def.unlock) return { ok: false, reason: `Ab Level ${def.unlock} verfügbar`, site: null, mineRes: null };
    const [w, h] = def.size;
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        if (!this.inb(x + i, y + j)) return { ok: false, reason: "Außerhalb der Karte", site: null, mineRes: null };
        const t = this.map.terrain[this.idx(x + i, y + j)];
        if (t !== T.GRASS && t !== T.SAND) return { ok: false, reason: "Gelände nicht bebaubar", site: null, mineRes: null };
        if (this.occ[this.idx(x + i, y + j)]) return { ok: false, reason: "Bereits bebaut", site: null, mineRes: null };
      }
    const { factor, mineRes } = this.computeSite(type, x, y);
    if (def.site && def.site.kind !== "fields" && factor <= 0) {
      return { ok: false, reason: `Keine ${def.site.label} in Reichweite`, site: 0, mineRes };
    }
    for (const [r, n] of Object.entries(def.cost) as [ResId, number][]) {
      if (this.res[r] < n) return { ok: false, reason: `Nicht genug ${RESOURCES[r].name}`, site: def.site ? factor : null, mineRes };
    }
    return { ok: true, reason: null, site: def.site ? factor : null, mineRes };
  }

  /** Gebäude platzieren und Kosten abziehen */
  place(type: BuildingId, x: number, y: number): PlaceCheck {
    const check = this.checkPlace(type, x, y);
    if (!check.ok) return check;
    for (const [r, n] of Object.entries(BUILDINGS[type].cost) as [ResId, number][]) this.res[r] -= n;
    this.addBuilding(type, x, y, false);
    this.notify();
    return check;
  }

  /** Abriss mit 50 % Rückerstattung (Fundament des letzten Lagerhauses bleibt geschützt) */
  demolish(id: number): { ok: boolean; reason?: string } {
    const b = this.byId.get(id);
    if (!b) return { ok: false, reason: "Nicht gefunden" };
    const def = BUILDINGS[b.type];
    if (def.hub && this.buildings.filter((o) => BUILDINGS[o.type].hub && o.id !== id).length === 0)
      return { ok: false, reason: "Das letzte Lagerhaus kann nicht abgerissen werden." };
    for (const [r, n] of Object.entries(def.cost) as [ResId, number][]) {
      this.res[r] = Math.min(this.limit[r] || Infinity, this.res[r] + Math.floor(n * 0.5));
    }
    for (let j = 0; j < def.size[1]; j++)
      for (let i = 0; i < def.size[0]; i++) this.occ[this.idx(b.x + i, b.y + j)] = 0;
    this.buildings = this.buildings.filter((o) => o.id !== id);
    this.byId.delete(id);
    if (this.ui.selectedId === id) this.ui.selectedId = null;
    this.dirtyFlag = true;
    this.recompute();
    this.notify();
    return { ok: true };
  }

  /* ======================================================== UI-Interaktion */

  setBuildType(t: BuildingId | null) {
    this.ui.buildType = t;
    this.ui.ghost = null;
    if (t) this.ui.selectedId = null;
    this.notify();
  }
  select(id: number | null) { this.ui.selectedId = id; this.notify(); }

  /** Ghost-Position setzen (Ankerkachel = linke obere Ecke der Grundfläche) */
  setGhost(x: number, y: number) {
    const t = this.ui.buildType;
    if (!t) return;
    const g = this.ui.ghost;
    if (g && g.x === x && g.y === y) { g.check = this.checkPlace(t, x, y); return; }
    this.ui.ghost = { x, y, check: this.checkPlace(t, x, y) };
    this.notify();
  }
  clearGhost() { if (this.ui.ghost) { this.ui.ghost = null; this.notify(); } }

  /** Platziert das aktuelle Ghost (Bestätigen-Button / Doppeltipp) */
  confirmGhost(): PlaceCheck | null {
    const t = this.ui.buildType, g = this.ui.ghost;
    if (!t || !g) return null;
    const r = this.place(t, g.x, g.y);
    if (!r.ok && r.reason) this.toast(r.reason, "warn");
    g.check = this.checkPlace(t, g.x, g.y);
    return r;
  }

  /* ==================================================== Netz & Ableitungen */

  /** Straßennetz, Standortqualität, Limits neu berechnen (bei Strukturänderung) */
  recompute() {
    const N = MAP_SIZE;
    const reach = this.roadReach;
    reach.fill(0);
    const isRoad = (i: number) => {
      const b = this.byId.get(this.occ[i]);
      return !!b && b.type === "road" && b.built;
    };
    const queue: number[] = [];
    const perimeter = (b: Building, fn: (i: number) => void) => {
      const [w, h] = BUILDINGS[b.type].size;
      for (let i = 0; i < w; i++) { if (this.inb(b.x + i, b.y - 1)) fn(this.idx(b.x + i, b.y - 1)); if (this.inb(b.x + i, b.y + h)) fn(this.idx(b.x + i, b.y + h)); }
      for (let j = 0; j < h; j++) { if (this.inb(b.x - 1, b.y + j)) fn(this.idx(b.x - 1, b.y + j)); if (this.inb(b.x + w, b.y + j)) fn(this.idx(b.x + w, b.y + j)); }
    };
    for (const b of this.buildings) {
      if (!b.built || !BUILDINGS[b.type].hub) continue;
      perimeter(b, (i) => { if (!reach[i] && isRoad(i)) { reach[i] = 1; queue.push(i); } });
    }
    while (queue.length) {
      const i = queue.pop()!;
      const x = i % N, y = (i / N) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (!this.inb(nx, ny)) continue;
        const ni = this.idx(nx, ny);
        if (!reach[ni] && isRoad(ni)) { reach[ni] = 1; queue.push(ni); }
      }
    }
    for (const b of this.buildings) {
      const def = BUILDINGS[b.type];
      if (def.hub) { b.connected = b.built; }
      else {
        let ok = false;
        perimeter(b, (i) => {
          if (ok) return;
          if (reach[i]) ok = true;
          else { const o = this.byId.get(this.occ[i]); if (o && o.built && BUILDINGS[o.type].hub) ok = true; }
        });
        b.connected = b.built && ok;
        if (b.type === "road") b.connected = !!reach[this.idx(b.x, b.y)];
      }
      const s = this.computeSite(b.type, b.x, b.y);
      b.site = s.factor;
      b.mineRes = s.mineRes;
    }
    // Lagerlimits
    let storage = 0;
    for (const b of this.buildings) if (b.built) storage += BUILDINGS[b.type].storage ?? 0;
    let mult = 1;
    for (const id of this.research.done) {
      const t = TECHS.find((x) => x.id === id);
      if (t?.effect.kind === "storage") mult += t.effect.mult;
    }
    for (const r of RES_IDS) this.limit[r] = Math.round((RESOURCES[r].limit + storage) * mult);
    this.dirtyFlag = false;
  }

  private techProdMult(type: BuildingId): number {
    let m = 0;
    for (const id of this.research.done) {
      const t = TECHS.find((x) => x.id === id);
      if (t?.effect.kind === "prod" && t.effect.buildings.includes(type)) m += t.effect.mult;
    }
    return m;
  }
  private hasTech(kind: "trade" | "drill"): boolean {
    return this.research.done.some((id) => TECHS.find((t) => t.id === id)?.effect.kind === kind);
  }

  /** Bevölkerungskapazität, Arbeitsplätze und Militärstärke ableiten */
  computeStats() {
    let cap = 0;
    for (const b of this.buildings) {
      const def = BUILDINGS[b.type];
      if (b.built && def.housing && b.connected) cap += def.housing;
    }
    this.popCap = cap;
    this.workforce = Math.floor(this.pop) * WORKER_SHARE;
    for (const j of JOB_IDS) this.byJob[j] = { needed: 0, filled: 0 };
    let remaining = this.workforce;
    let mil = Math.floor(this.soldiers) * 2;
    for (const b of this.buildings) {
      b.workers = 0;
      if (!b.built) continue;
      const def = BUILDINGS[b.type];
      if (!def.jobs) continue;
      this.byJob[def.jobs.job].needed += def.jobs.count;
      if (def.needsRoad && !b.connected) continue;
      const w = Math.min(def.jobs.count, remaining);
      b.workers = w;
      remaining -= w;
      this.byJob[def.jobs.job].filled += w;
      if (def.military) mil += def.military * (w / def.jobs.count);
    }
    this.military = Math.round(mil);
  }

  /* ============================================================= Simulation */

  /** Pro Frame aufrufen. dt in Sekunden. */
  update(dt: number) {
    dt = Math.min(dt, 0.5);
    this.clock += dt;
    this.playTime += dt;
    this.toasts = this.toasts.filter((t) => this.clock - t.t < 5);

    // Bauanimation/-fortschritt (läuft pro Frame für flüssige Darstellung)
    let completed = false;
    for (const b of this.buildings) {
      if (b.built) continue;
      const def = BUILDINGS[b.type];
      b.progress = Math.min(1, b.progress + dt / def.buildTime);
      if (b.progress >= 1) {
        b.built = true;
        b.status = "ok";
        this.addXp(def.xp);
        if (def.id !== "road") this.toast(`${def.name} fertiggestellt`, "good");
        completed = true;
      }
    }
    if (completed) this.dirtyFlag = true;

    this.acc += dt;
    let guard = 0;
    while (this.acc >= SIM_STEP && guard++ < 6) {
      this.acc -= SIM_STEP;
      this.step(SIM_STEP);
    }
    if (this.acc > SIM_STEP) this.acc = 0;

    this.notifyAcc += dt;
    if (this.notifyAcc >= 0.25) { this.notifyAcc = 0; this.notify(); }
  }

  /** Headless: Simulation um `seconds` vorspulen (Tests) */
  simulate(seconds: number) {
    for (let t = 0; t < seconds; t += SIM_STEP) this.update(SIM_STEP);
  }

  private step(dt: number) {
    if (this.dirtyFlag) this.recompute();
    this.computeStats();
    const flowP = zeroRes(), flowC = zeroRes();
    const barracks = this.count("barracks");

    /* ---- Produktion ---- */
    for (const b of this.buildings) {
      const def = BUILDINGS[b.type];
      b.missing = null;
      b.eff = 0;
      if (!b.built) { b.status = "constructing"; continue; }
      if (def.needsRoad && !b.connected && def.id !== "road") { b.status = "no_road"; continue; }
      b.status = "ok";
      if (def.jobs && b.workers <= 0) { b.status = "no_workers"; continue; }
      if (!def.recipe) continue;
      if (def.site && b.site <= 0) { b.status = "no_site"; continue; }

      const ratio = def.jobs ? b.workers / def.jobs.count : 1;
      let eff = ratio * (def.site ? b.site : 1) * (1 + this.techProdMult(b.type));
      if (def.recipe.special === "soldier" && this.hasTech("drill")) eff *= 2;
      b.eff = eff;

      const wanted = (eff * dt) / def.recipe.cycle;
      let cycles = wanted;
      let limitedBy: "in" | "out" | null = null;
      const outputs: [ResId, number][] = Object.entries(def.recipe.outputs) as [ResId, number][];
      if (def.id === "mine") {
        const r = b.mineRes ?? "eisen";
        const dep = r === "gold" ? 3 : r === "kohle" ? 2 : 1;
        outputs.length = 0;
        outputs.push([r, DEPOSIT_YIELD[dep]]);
      }
      for (const [r, n] of Object.entries(def.recipe.inputs) as [ResId, number][]) {
        const avail = this.res[r] / n;
        if (avail < cycles) { cycles = avail; limitedBy = "in"; b.missing = r; }
      }
      for (const [r, n] of outputs) {
        const space = Math.max(0, (this.limit[r] - this.res[r]) / n);
        if (space < cycles) { cycles = space; limitedBy = "out"; }
      }
      if (def.recipe.special === "soldier") {
        const cap = Math.min(barracks * SOLDIERS_PER_BARRACKS, Math.floor(this.pop * 0.5));
        const room = Math.max(0, cap - this.soldiers);
        if (room < cycles) { cycles = room; limitedBy = "out"; }
      }
      if (cycles < wanted * 0.98) b.status = limitedBy === "in" ? "no_input" : "storage_full";
      if (cycles <= 0) continue;
      for (const [r, n] of Object.entries(def.recipe.inputs) as [ResId, number][]) { this.res[r] -= n * cycles; flowC[r] += n * cycles; }
      for (const [r, n] of outputs) { this.res[r] += n * cycles; flowP[r] += n * cycles; }
      if (def.recipe.special === "soldier") this.soldiers += cycles;
    }

    /* ---- Bevölkerung: Verbrauch + Wachstum ---- */
    const need = (Math.floor(this.pop) * FOOD_PER_CAPITA * dt) / 60;
    let fed = 1;
    let usedBrot = 0;
    if (need > 0) {
      usedBrot = Math.min(this.res.brot, need);
      const usedGrain = Math.min(this.res.getreide, need - usedBrot);
      this.res.brot -= usedBrot; this.res.getreide -= usedGrain;
      flowC.brot += usedBrot; flowC.getreide += usedGrain;
      fed = (usedBrot + usedGrain) / need;
    }
    this.foodStatus = fed >= 0.98 ? "ok" : fed > 0.4 ? "low" : "starving";
    const perMin = (0.8 + 0.08 * this.pop) * (usedBrot > 0 ? 1.5 : 1);
    this.growthPerMin = 0;
    if (this.foodStatus === "ok" && this.pop < this.popCap) {
      this.growthPerMin = perMin;
      this.pop = Math.min(this.popCap, this.pop + (perMin * dt) / 60);
    } else if (this.foodStatus === "starving" && this.pop > 2) {
      this.growthPerMin = -0.6;
      this.pop = Math.max(2, this.pop - (0.6 * dt) / 60);
    }
    if (this.pop > this.popCap + 0.5) {
      this.pop = Math.max(this.popCap, this.pop - dt / 60);
      this.growthPerMin = -1;
    }
    if (this.soldiers > this.pop * 0.5) this.soldiers = Math.max(0, this.pop * 0.5);

    /* ---- Lagerlimits einhalten + Raten glätten (gleitender Mittelwert pro Minute) ---- */
    for (const r of RES_IDS) {
      this.res[r] = Math.max(0, Math.min(this.limit[r], this.res[r]));
      this.prod[r] += ((flowP[r] / dt) * 60 - this.prod[r]) * 0.12;
      this.cons[r] += ((flowC[r] / dt) * 60 - this.cons[r]) * 0.12;
    }

    /* ---- Forschung ---- */
    const act = this.research.active;
    if (act) {
      act.remaining -= dt;
      if (act.remaining <= 0) {
        const t = TECHS.find((x) => x.id === act.id)!;
        this.research.done.push(t.id);
        this.research.active = null;
        this.toast(`Erforscht: ${t.name}`, "good");
        this.addXp(40 + t.minLevel * 6);
        this.dirtyFlag = true;
      }
    }

    this.computeStats();
    this.checkQuests();
  }

  /* ============================================================ Level / XP */

  addXp(n: number) {
    this.xp += n;
    while (this.xp >= xpToNext(this.level)) {
      this.xp -= xpToNext(this.level);
      this.level++;
      const unlocked = LEVEL_UNLOCKS.find((u) => u.level === this.level);
      const newB = Object.values(BUILDINGS).filter((b) => b.unlock === this.level).map((b) => b.name);
      this.toast(`Level ${this.level}!${unlocked ? ` ${unlocked.name} freigeschaltet.` : ""}${newB.length ? ` Neu: ${newB.join(", ")}` : ""}`, "level");
    }
  }

  /* ============================================================== Aufgaben */

  questProgress(qd: QuestDef): { cur: number; target: number } {
    const c = qd.cond;
    switch (c.type) {
      case "build": return { cur: Math.min(c.count, this.count(c.building)), target: c.count };
      case "pop": return { cur: Math.min(c.n, Math.floor(this.pop)), target: c.n };
      case "stock": return { cur: Math.min(c.n, Math.floor(this.res[c.res])), target: c.n };
      case "level": return { cur: Math.min(c.n, this.level), target: c.n };
      case "prod": return { cur: Math.min(c.n, Math.round(this.prod[c.res] * 10) / 10), target: c.n };
      case "military": return { cur: Math.min(c.n, this.military), target: c.n };
      case "research": return { cur: Math.min(c.n, this.research.done.length), target: c.n };
      case "trade": return { cur: Math.min(c.n, this.tradeCount), target: c.n };
    }
  }

  activeQuests(max = 5): QuestDef[] {
    return QUESTS.filter((q) => !this.questsDone.includes(q.id) && q.minLevel <= this.level).slice(0, max);
  }

  private checkQuests() {
    for (const qd of this.activeQuests(8)) {
      const p = this.questProgress(qd);
      if (p.cur >= p.target) {
        this.questsDone.push(qd.id);
        for (const [r, n] of Object.entries(qd.reward ?? {}) as [ResId, number][]) this.res[r] = Math.min(this.limit[r], this.res[r] + n);
        this.toast(`Aufgabe erfüllt: ${qd.title} (+${qd.xp} EP)`, "good");
        this.addXp(qd.xp);
      }
    }
  }

  /* ========================================================= Forschung/Handel */

  canResearch(id: string): string | null {
    const t = TECHS.find((x) => x.id === id);
    if (!t) return "Unbekannt";
    if (this.research.done.includes(id)) return "Bereits erforscht";
    if (this.research.active) return "Es wird bereits geforscht";
    if (this.level < t.minLevel) return `Ab Level ${t.minLevel}`;
    for (const [r, n] of Object.entries(t.cost) as [ResId, number][]) if (this.res[r] < n) return `Nicht genug ${RESOURCES[r].name}`;
    return null;
  }

  startResearch(id: string): boolean {
    const why = this.canResearch(id);
    if (why) { this.toast(why, "warn"); this.notify(); return false; }
    const t = TECHS.find((x) => x.id === id)!;
    for (const [r, n] of Object.entries(t.cost) as [ResId, number][]) this.res[r] -= n;
    this.research.active = { id, remaining: t.time };
    this.toast(`Forschung gestartet: ${t.name}`, "info");
    this.notify();
    return true;
  }

  /** Handel ist nur mit einem fertigen, angebundenen und besetzten Marktplatz möglich */
  marketActive(): boolean {
    return this.buildings.some((b) => b.type === "market" && b.built && b.connected && b.workers > 0);
  }
  tradePrice(res: ResId, mode: "buy" | "sell"): number {
    const d = this.hasTech("trade") ? 0.15 : 0;
    const base = RESOURCES[res].price;
    return mode === "buy" ? base * 1.4 * (1 - d) : base * 0.7 * (1 + d);
  }
  trade(res: ResId, amount: number, mode: "buy" | "sell"): string | null {
    if (res === "gold") return "Gold ist die Handelswährung.";
    if (!this.marketActive()) return "Kein besetzter Marktplatz vorhanden.";
    const unit = this.tradePrice(res, mode);
    if (mode === "sell") {
      const n = Math.min(amount, Math.floor(this.res[res]));
      if (n <= 0) return `Kein ${RESOURCES[res].name} im Lager.`;
      const gain = Math.floor(unit * n);
      if (gain <= 0) return "Menge zu klein.";
      this.res[res] -= n;
      this.res.gold = Math.min(this.limit.gold, this.res.gold + gain);
    } else {
      const n = Math.min(amount, Math.floor(this.limit[res] - this.res[res]));
      if (n <= 0) return "Lager voll.";
      const cost = Math.ceil(unit * n);
      if (this.res.gold < cost) return "Nicht genug Gold.";
      this.res.gold -= cost;
      this.res[res] += n;
    }
    this.tradeCount++;
    this.notify();
    return null;
  }

  /* ========================================================== Auswertungen */

  /** Produktion/Verbrauch eines Gebäudes bei aktueller Effizienz (pro Minute) */
  buildingRates(b: Building): { inputs: [ResId, number][]; outputs: [ResId, number][] } {
    const def = BUILDINGS[b.type];
    if (!def.recipe || !b.built) return { inputs: [], outputs: [] };
    const f = (60 / def.recipe.cycle) * b.eff;
    const outs = Object.entries(def.recipe.outputs) as [ResId, number][];
    if (def.id === "mine") {
      const r = b.mineRes ?? "eisen";
      outs.length = 0;
      outs.push([r, DEPOSIT_YIELD[r === "gold" ? 3 : r === "kohle" ? 2 : 1]]);
    }
    return {
      inputs: (Object.entries(def.recipe.inputs) as [ResId, number][]).map(([r, n]) => [r, n * f]),
      outputs: outs.map(([r, n]) => [r, n * f]),
    };
  }

  /** Engpass-Analyse für die Wirtschaftsübersicht */
  bottlenecks(): Bottleneck[] {
    const out: Bottleneck[] = [];
    const groups = new Map<string, { def: BuildingDef; status: BStatus; n: number; missing: ResId | null }>();
    for (const b of this.buildings) {
      if (b.status === "ok" || b.status === "constructing") continue;
      const key = `${b.type}|${b.status}|${b.missing ?? ""}`;
      const g = groups.get(key);
      if (g) g.n++;
      else groups.set(key, { def: BUILDINGS[b.type], status: b.status, n: 1, missing: b.missing });
    }
    groups.forEach((g) => {
      const miss = g.missing ? `: ${RESOURCES[g.missing].name} fehlt` : "";
      out.push({
        sev: g.status === "no_input" || g.status === "no_site" || g.status === "no_road" ? "bad" : "warn",
        text: `${g.n}× ${g.def.name} – ${STATUS_TEXT[g.status].label}${miss}`,
      });
    });
    if (this.foodStatus !== "ok") out.push({ sev: "bad", text: this.foodStatus === "starving" ? "Die Bevölkerung hungert! Brot/Getreide fehlt." : "Nahrung reicht nicht für alle." });
    const unfilled = JOB_IDS.reduce((s, j) => s + Math.max(0, this.byJob[j].needed - this.byJob[j].filled), 0);
    if (unfilled >= 1) out.push({ sev: "warn", text: `${Math.round(unfilled)} Arbeitsplätze unbesetzt – mehr Wohnraum/Einwohner nötig.` });
    if (this.pop >= this.popCap - 0.5 && this.popCap > 0 && this.foodStatus === "ok") out.push({ sev: "warn", text: "Wohnraum voll – baue weitere Häuser." });
    for (const r of RES_IDS) {
      if (this.res[r] < 1 && this.cons[r] > 0.05) out.push({ sev: "bad", text: `${RESOURCES[r].name}: Bestand leer (Verbrauch ${this.cons[r].toFixed(1)}/min)` });
      else if (this.res[r] >= this.limit[r] * 0.98 && this.prod[r] > 0.05) out.push({ sev: "warn", text: `${RESOURCES[r].name}: Lager voll – Lagerhaus bauen oder verarbeiten.` });
    }
    return out;
  }

  /** Jede Kachel, deren Gebäude der Straße bedarf, aber nicht angebunden ist (für Hinweise) */
  get jobsSummary() {
    return JOB_IDS.map((j) => ({ id: j, name: JOBS[j].name, icon: JOBS[j].icon, ...this.byJob[j] }));
  }

  get nextXp() { return xpToNext(this.level); }
}
