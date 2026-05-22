import { getRecentActivities } from "@meteor/db";
import { WorkoutList, type Workout } from "../../components/WorkoutList";

export const dynamic = "force-dynamic";

export default async function WorkoutsPage() {
  const rows = await getRecentActivities(40);
  const workouts: Workout[] = rows.map((r) => ({
    id: r.id,
    date: r.date,
    type: r.type,
    name: r.name,
    durationMinutes: r.durationMinutes,
    distanceMeters: r.distanceMeters,
    averageHr: r.averageHr,
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-sm lowercase tracking-wide text-muted">workouts</h1>
      <WorkoutList workouts={workouts} />
    </div>
  );
}
