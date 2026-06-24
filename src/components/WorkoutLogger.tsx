import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WorkoutLog {
  id: string;
  date: string;
  sets: { id: string; reps: number; weight: number }[];
}

export function WorkoutLogger({ exerciseId }: { exerciseId: string }) {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [reps, setReps] = useState<string>("");
  const [weight, setWeight] = useState<string>("");

  useEffect(() => {
    const savedLogs = localStorage.getItem(`workout-logs-${exerciseId}`);
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error("Error parsing logs", e);
      }
    }
  }, [exerciseId]);

  const saveLogs = (newLogs: WorkoutLog[]) => {
    setLogs(newLogs);
    localStorage.setItem(`workout-logs-${exerciseId}`, JSON.stringify(newLogs));
  };

  const addSet = () => {
    const repsNum = parseInt(reps);
    const weightNum = parseFloat(weight);
    if (isNaN(repsNum) || isNaN(weightNum)) return;

    const todayDate = new Date().toLocaleDateString("it-IT", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const newLogs = [...logs];
    let todayLog = newLogs.find((l) => l.date === todayDate);

    if (!todayLog) {
      todayLog = { id: crypto.randomUUID(), date: todayDate, sets: [] };
      newLogs.unshift(todayLog); // Add new day at the beginning
    }

    todayLog.sets.push({
      id: crypto.randomUUID(),
      reps: repsNum,
      weight: weightNum,
    });

    saveLogs(newLogs);
    setReps("");
    setWeight("");
  };

  const deleteSet = (logId: string, setId: string) => {
    const newLogs = logs
      .map((log) => {
        if (log.id === logId) {
          return {
            ...log,
            sets: log.sets.filter((s) => s.id !== setId),
          };
        }
        return log;
      })
      .filter((log) => log.sets.length > 0);
    saveLogs(newLogs);
  };

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-elegant)] space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Registro Allenamento</h3>
        <p className="text-sm text-muted-foreground">
          Traccia serie, ripetizioni e peso per monitorare i tuoi progressi nel tempo.
        </p>
      </div>

      <div className="flex gap-3 items-end">
        <div className="space-y-1.5 flex-1">
          <Label htmlFor="weight" className="text-xs">
            Peso (kg)
          </Label>
          <Input
            id="weight"
            type="number"
            placeholder="es. 50"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div className="space-y-1.5 flex-1">
          <Label htmlFor="reps" className="text-xs">
            Ripetizioni
          </Label>
          <Input
            id="reps"
            type="number"
            placeholder="es. 10"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
          />
        </div>
        <Button onClick={addSet} disabled={!reps || !weight} className="mb-0.5">
          <Plus className="w-4 h-4 mr-1" /> Aggiungi
        </Button>
      </div>

      <div className="space-y-4">
        {logs.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            Nessun allenamento registrato.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">{log.date}</div>
              <div className="space-y-2">
                {log.sets.map((set, index) => (
                  <div
                    key={set.id}
                    className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium min-w-[3rem]">Set {index + 1}</span>
                      <span>{set.weight} kg</span>
                      <span>{set.reps} reps</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteSet(log.id, set.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
