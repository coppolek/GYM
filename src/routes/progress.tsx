import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, LineChart as LineChartIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { EXERCISES } from "@/lib/exercises";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [{ title: "Progressi — FormaCoach" }],
  }),
  component: ProgressDashboard,
});

interface WorkoutLog {
  id: string;
  date: string;
  sets: { id: string; reps: number; weight: number }[];
}

function ProgressDashboard() {
  const [data, setData] = useState<
    { exerciseId: string; exerciseName: string; logs: WorkoutLog[] }[]
  >([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("all");

  useEffect(() => {
    const loadedData: { exerciseId: string; exerciseName: string; logs: WorkoutLog[] }[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("workout-logs-")) {
        const exerciseId = key.replace("workout-logs-", "");
        const exercise = EXERCISES.find((e) => e.id === exerciseId);

        if (exercise) {
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const logs: WorkoutLog[] = JSON.parse(raw);
              if (logs && logs.length > 0) {
                loadedData.push({
                  exerciseId,
                  exerciseName: exercise.name,
                  logs,
                });
              }
            }
          } catch (e) {
            console.error("Failed to parse logs for", exerciseId, e);
          }
        }
      }
    }

    setData(loadedData);
    if (loadedData.length > 0) {
      setSelectedExercise(loadedData[0].exerciseId);
    }
  }, []);

  const chartData = useMemo(() => {
    if (!selectedExercise || selectedExercise === "all" || data.length === 0) return [];

    const exerciseData = data.find((d) => d.exerciseId === selectedExercise);
    if (!exerciseData) return [];

    // Map logs to average weight or max weight per day
    // The logs have dates like "24 giu 2026". We need to map them to an array of points
    const points = exerciseData.logs.map((log) => {
      const maxWeight = Math.max(...log.sets.map((s) => s.weight));
      return {
        date: log.date,
        // Optional: can parse to a real Date to sort if needed, but assuming they are somewhat ordered
        // We will just return the date string as the label
        weight: maxWeight,
      };
    });

    // Reverse so chronological order (oldest to newest)
    return points.reverse();
  }, [data, selectedExercise]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-2xl items-center px-4">
          <Link
            to="/"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="ml-4 font-semibold">I Tuoi Progressi</h1>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary/10 p-3 rounded-full">
            <LineChartIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Andamento Carichi</h2>
            <p className="text-sm text-muted-foreground">
              Monitora l'aumento del peso massimo per esercizio.
            </p>
          </div>
        </div>

        {data.length === 0 ? (
          <div className="rounded-2xl border bg-card p-12 text-center shadow-[var(--shadow-elegant)]">
            <h3 className="text-lg font-semibold">Nessun dato disponibile</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Inizia a registrare i tuoi allenamenti negli esercizi per vedere i tuoi progressi qui.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Scopri gli esercizi
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-elegant)] space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Seleziona Esercizio</h3>
              <div className="w-[200px]">
                <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                  <SelectTrigger>
                    <SelectValue placeholder="Scegli esercizio" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.map((d) => (
                      <SelectItem key={d.exerciseId} value={d.exerciseId}>
                        {d.exerciseName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="h-[300px] w-full mt-8">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--muted))"
                    />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      dy={10}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(value) => `${value}kg`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        boxShadow: "var(--shadow-elegant)",
                      }}
                      itemStyle={{ color: "hsl(var(--foreground))" }}
                      labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "4px" }}
                      formatter={(value: number) => [`${value} kg`, "Peso Max"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--background))" }}
                      activeDot={{ r: 6, strokeWidth: 0, fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                  Dati insufficienti per questo esercizio.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
