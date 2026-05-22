/** An ISO date string, YYYY-MM-DD. */
export type IsoDate = string;

/** A single day's health metrics, normalised across providers. */
export interface DailyMetrics {
  date: IsoDate;
  /** Garmin Training Readiness, 0-100. */
  readiness: number | null;
  /** Garmin Body Battery, 0-100 (peak of day). */
  bodyBattery: number | null;
  /** Overnight HRV average, milliseconds. */
  hrv: number | null;
  /** Resting heart rate, bpm. */
  rhr: number | null;
  sleepMinutes: number | null;
  /** Garmin sleep score, 0-100. */
  sleepScore: number | null;
  /** Training load / strain proxy (acute load). */
  strain: number | null;
  steps: number | null;
  /** Provider payload, untouched, for the agent and audits. */
  raw: unknown;
}

export interface Activity {
  id: string;
  date: IsoDate;
  type: string;
  durationMinutes: number;
  distanceMeters: number | null;
  averageHr: number | null;
  /** Garmin activity name, e.g. "Threshold run". */
  name: string;
}

export interface TrainingLoad {
  date: IsoDate;
  /** Chronic training load (fitness). */
  ctl: number | null;
  /** Acute training load (fatigue). */
  atl: number | null;
  /** Training stress balance (form). */
  tsb: number | null;
}

/** Result of a freshness check against the provider. */
export interface DataFreshness {
  /** Timestamp of the most recent record the provider has for `date`. */
  latestRecordAt: Date | null;
  /** True when last night's sleep + this morning's metrics are present. */
  isFresh: boolean;
}

export type MemorySource = "derived" | "user";
export type MemoryStatus = "pending" | "confirmed" | "dismissed";

export interface AgentMemory {
  id: string;
  fact: string;
  confidence: number;
  source: MemorySource;
  status: MemoryStatus;
  confirmedAt: Date | null;
  dismissedAt: Date | null;
  createdAt: Date;
}

/** A proposed memory, before it is written to the DB. */
export interface ProposedMemory {
  fact: string;
  confidence: number;
  source: MemorySource;
}

/** The shape Claude must return from a daily reasoning call. */
export interface ReasoningResult {
  readiness: number | null;
  /** The terse plan line, e.g. "Today: light. Z2 only." */
  plan: string;
  /** The full reasoning chain, shown behind "Tap for why". */
  reasoning: string[];
  newMemories: ProposedMemory[];
}
