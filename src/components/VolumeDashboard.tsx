import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";
import { WEEK_PLAN, TOTAL_WEEKS, progressionFor, getSessionExercises } from "@/lib/program";
import { getExercise, CATEGORIES } from "@/lib/exercises";

interface VolumeDashboardProps {
  completed: Record<string, boolean>;
}

export function VolumeDashboard({ completed }: VolumeDashboardProps) {
  const data = useMemo(() => {
    return Array.from({ length: TOTAL_WEEKS }, (_, i) => {
      const week = i + 1;
      const weekData: Record<string, string | number> = { name: `Sett. ${week}` };
      let plannedTotal = 0;
      let completedTotal = 0;

      CATEGORIES.forEach((c) => {
        weekData[c.id] = 0;
      });

      WEEK_PLAN.forEach((day) => {
        const isCompleted = !!completed[`${week}.${day.key}`];

        getSessionExercises(day).forEach((id) => {
          const ex = getExercise(id);
          if (!ex) return;

          const p = progressionFor(week, ex);
          const exerciseMinutes =
            (p.rounds * p.workSeconds + Math.max(0, p.rounds - 1) * p.restSeconds + 30) / 60;

          plannedTotal += exerciseMinutes;
          if (isCompleted) {
            completedTotal += exerciseMinutes;
            weekData[ex.category] = (weekData[ex.category] || 0) + exerciseMinutes;
          }
        });
      });

      CATEGORIES.forEach((c) => {
        weekData[c.id] = Math.round(weekData[c.id]);
      });

      weekData.plannedTotal = Math.round(plannedTotal);
      weekData.completedTotal = Math.round(completedTotal);

      return weekData;
    });
  }, [completed]);

  const colors: Record<string, string> = {
    core: "hsl(var(--primary))",
    forza: "#f97316", // orange-500
    schiena: "#14b8a6", // teal-500
    mobilita: "#8b5cf6", // violet-500
    cardio: "#ef4444", // red-500
  };

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-elegant)]">
      <div className="mb-6">
        <h3 className="text-lg font-bold">Volume di Allenamento Completato</h3>
        <p className="text-sm text-muted-foreground">
          Minuti spesi per categoria nel corso delle settimane.
        </p>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: "12px",
                boxShadow: "var(--shadow-elegant)",
              }}
              itemStyle={{ fontSize: "14px" }}
              labelStyle={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "hsl(var(--foreground))",
                marginBottom: "4px",
              }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} />
            {CATEGORIES.map((c) => (
              <Bar
                key={c.id}
                dataKey={c.id}
                name={c.title}
                stackId="a"
                fill={colors[c.id] || "hsl(var(--primary))"}
                radius={c.id === CATEGORIES[CATEGORIES.length - 1].id ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
            <Line
              type="monotone"
              dataKey="plannedTotal"
              name="Volume Previsto"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 4, fill: "hsl(var(--muted-foreground))" }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
