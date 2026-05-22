import type {
  Activity,
  DailyMetrics,
  DataFreshness,
  IsoDate,
  TrainingLoad,
} from "@meteor/shared";

/**
 * The seam for health data. Garmin is the only implementation today; an
 * AppleProvider can be added later behind this same interface.
 */
export interface HealthProvider {
  listRecordTypes(): Promise<string[]>;
  getDailyMetrics(date: IsoDate): Promise<DailyMetrics>;
  getActivities(from: IsoDate, to: IsoDate): Promise<Activity[]>;
  getTrainingLoad(date: IsoDate): Promise<TrainingLoad>;
  getDataFreshness(date: IsoDate): Promise<DataFreshness>;
  /** Range of daily metrics, inclusive, oldest first. */
  getMetricsRange(from: IsoDate, to: IsoDate): Promise<DailyMetrics[]>;
}

/**
 * Tool names exposed by Taxuspt/garmin_mcp. The server exposes 110+ tools and
 * names may drift; `verify.ts` prints the live list so this map can be
 * reconciled against a real connection.
 */
export const GARMIN_TOOLS = {
  trainingReadiness: "get_training_readiness",
  bodyBattery: "get_body_battery",
  sleep: "get_sleep_data",
  heartRate: "get_heart_rate",
  hrv: "get_hrv_data",
  rhr: "get_resting_heart_rate",
  steps: "get_steps_data",
  stress: "get_stress_data",
  activities: "get_activities_by_date",
  trainingStatus: "get_training_status",
} as const;
