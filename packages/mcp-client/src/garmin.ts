import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type {
  Activity,
  DailyMetrics,
  DataFreshness,
  IsoDate,
  TrainingLoad,
} from "@meteor/shared";
import { connectGarminMcp } from "./connection.js";
import { GARMIN_TOOLS, type HealthProvider } from "./provider.js";

/** Pulls the first text block out of an MCP tool result and JSON-parses it. */
function parseToolResult(result: unknown): unknown {
  const content = (result as { content?: unknown[] })?.content ?? [];
  const textBlock = content.find(
    (c): c is { type: "text"; text: string } =>
      typeof c === "object" && c !== null && (c as { type?: string }).type === "text",
  );
  if (!textBlock) return null;
  try {
    return JSON.parse(textBlock.text);
  } catch {
    return textBlock.text;
  }
}

/** Reads a numeric field from an object, trying several candidate keys. */
function num(obj: unknown, ...keys: string[]): number | null {
  if (typeof obj !== "object" || obj === null) return null;
  const record = obj as Record<string, unknown>;
  for (const key of keys) {
    const v = record[key];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
  }
  return null;
}

export class GarminProvider implements HealthProvider {
  private constructor(private readonly client: Client) {}

  /** Connects to garmin-mcp and returns a ready provider. */
  static async connect(): Promise<GarminProvider> {
    const client = await connectGarminMcp();
    return new GarminProvider(client);
  }

  async close(): Promise<void> {
    await this.client.close();
  }

  private async call(name: string, args: Record<string, unknown>): Promise<unknown> {
    const result = await this.client.callTool({ name, arguments: args });
    return parseToolResult(result);
  }

  /** Best-effort call: returns null instead of throwing if a tool is missing. */
  private async tryCall(
    name: string,
    args: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      return await this.call(name, args);
    } catch {
      return null;
    }
  }

  async listRecordTypes(): Promise<string[]> {
    const { tools } = await this.client.listTools();
    return tools.map((t) => t.name);
  }

  async getDailyMetrics(date: IsoDate): Promise<DailyMetrics> {
    const [readiness, battery, sleep, hrv, rhr, steps, stress] = await Promise.all([
      this.tryCall(GARMIN_TOOLS.trainingReadiness, { date }),
      this.tryCall(GARMIN_TOOLS.bodyBattery, { date }),
      this.tryCall(GARMIN_TOOLS.sleep, { date }),
      this.tryCall(GARMIN_TOOLS.hrv, { date }),
      this.tryCall(GARMIN_TOOLS.rhr, { date }),
      this.tryCall(GARMIN_TOOLS.steps, { date }),
      this.tryCall(GARMIN_TOOLS.stress, { date }),
    ]);

    const sleepObj = Array.isArray(sleep) ? sleep[0] : sleep;

    return {
      date,
      readiness: num(readiness, "score", "trainingReadiness", "level"),
      bodyBattery: num(battery, "max", "bodyBatteryHighest", "charged"),
      hrv: num(hrv, "lastNightAvg", "weeklyAvg", "hrvValue"),
      rhr: num(rhr, "restingHeartRate", "value", "rhr"),
      sleepMinutes: sleepMinutes(sleepObj),
      sleepScore: num(sleepObj, "sleepScore", "score", "overallScore"),
      strain: num(stress, "avgStressLevel", "overallStressLevel"),
      steps: num(steps, "totalSteps", "steps", "value"),
      raw: { readiness, battery, sleep, hrv, rhr, steps, stress },
    };
  }

  async getMetricsRange(from: IsoDate, to: IsoDate): Promise<DailyMetrics[]> {
    const dates = enumerateDates(from, to);
    return Promise.all(dates.map((d) => this.getDailyMetrics(d)));
  }

  async getActivities(from: IsoDate, to: IsoDate): Promise<Activity[]> {
    const raw = await this.tryCall(GARMIN_TOOLS.activities, {
      startdate: from,
      enddate: to,
    });
    const list = Array.isArray(raw) ? raw : [];
    return list.map((a: unknown, i): Activity => {
      const o = (a ?? {}) as Record<string, unknown>;
      return {
        id: String(o.activityId ?? o.id ?? i),
        date: String(o.startTimeLocal ?? o.date ?? from).slice(0, 10),
        type: String(
          (o.activityType as { typeKey?: string })?.typeKey ?? o.type ?? "unknown",
        ),
        durationMinutes: Math.round((num(o, "duration") ?? 0) / 60),
        distanceMeters: num(o, "distance"),
        averageHr: num(o, "averageHR", "avgHr"),
        name: String(o.activityName ?? o.name ?? "Activity"),
      };
    });
  }

  async getTrainingLoad(date: IsoDate): Promise<TrainingLoad> {
    const status = await this.tryCall(GARMIN_TOOLS.trainingStatus, { date });
    return {
      date,
      ctl: num(status, "ctl", "fitness", "chronicLoad"),
      atl: num(status, "atl", "fatigue", "acuteLoad"),
      tsb: num(status, "tsb", "form", "trainingBalance"),
    };
  }

  async getDataFreshness(date: IsoDate): Promise<DataFreshness> {
    // Sleep is the latest-arriving metric each morning, so it gates freshness.
    const sleep = await this.tryCall(GARMIN_TOOLS.sleep, { date });
    const sleepObj = Array.isArray(sleep) ? sleep[0] : sleep;
    const minutes = sleepMinutes(sleepObj);
    const ts = (sleepObj as Record<string, unknown> | null)?.["calendarDate"];
    const latestRecordAt =
      typeof ts === "string" ? new Date(ts) : minutes !== null ? new Date() : null;
    return { latestRecordAt, isFresh: minutes !== null && minutes > 0 };
  }
}

/** Garmin sleep payloads vary; resolve total sleep minutes from common shapes. */
function sleepMinutes(sleep: unknown): number | null {
  if (typeof sleep !== "object" || sleep === null) return null;
  const o = sleep as Record<string, unknown>;
  const seconds = num(o, "sleepTimeSeconds", "totalSleepSeconds");
  if (seconds !== null) return Math.round(seconds / 60);
  return num(o, "sleepTimeMinutes", "totalSleepMinutes");
}

/** Inclusive list of ISO dates from `from` to `to`. */
export function enumerateDates(from: IsoDate, to: IsoDate): IsoDate[] {
  const out: IsoDate[] = [];
  const cur = new Date(from + "T00:00:00Z");
  const end = new Date(to + "T00:00:00Z");
  while (cur <= end) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}
