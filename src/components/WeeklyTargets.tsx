import { useState, useEffect, useMemo } from "react";
import { WEEK_PLAN, progressionFor, getSessionExercises } from "@/lib/program";
import { getExercise } from "@/lib/exercises";
import { Button } from "@/components/ui/button";
import { Settings2, Check } from "lucide-react";

interface ProgressRingProps {
  radius: number;
  stroke: number;
  progress: number;
  color: string;
  children?: React.ReactNode;
}

function ProgressRing({ radius, stroke, progress, color, children }: ProgressRingProps) {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: radius * 2, height: radius * 2 }}
    >
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          stroke="hsl(var(--muted))"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + " " + circumference}
          style={{ strokeDashoffset, transition: "stroke-dashoffset 0.5s ease-in-out" }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

interface WeeklyTargetsProps {
  week: number;
  completed: Record<string, boolean>;
}

export function WeeklyTargets({ week, completed }: WeeklyTargetsProps) {
  const [targets, setTargets] = useState({ cardio: 45, mobilita: 30 });
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState(targets);

  useEffect(() => {
    const saved = localStorage.getItem("fitness_targets");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTargets(parsed);
        setEditValues(parsed);
      } catch (e) {
        console.error("Failed to parse targets", e);
      }
    }
  }, []);

  const saveTargets = () => {
    setTargets(editValues);
    localStorage.setItem("fitness_targets", JSON.stringify(editValues));
    setIsEditing(false);
  };

  const stats = useMemo(() => {
    let cardioMinutes = 0;
    let mobilitaMinutes = 0;

    WEEK_PLAN.forEach((day) => {
      if (completed[`${week}.${day.key}`]) {
        getSessionExercises(day).forEach((id) => {
          const ex = getExercise(id);
          if (ex) {
            const p = progressionFor(week, ex);
            const minutes =
              (p.rounds * p.workSeconds + Math.max(0, p.rounds - 1) * p.restSeconds + 30) / 60;
            if (ex.category === "cardio") cardioMinutes += minutes;
            if (ex.category === "mobilita") mobilitaMinutes += minutes;
          }
        });
      }
    });

    return {
      cardio: Math.round(cardioMinutes),
      mobilita: Math.round(mobilitaMinutes),
    };
  }, [week, completed]);

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-elegant)] h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold">Obiettivi Settimanali</h3>
          <p className="text-sm text-muted-foreground">Target durata (min)</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (isEditing) saveTargets();
            else setIsEditing(true);
          }}
        >
          {isEditing ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : (
            <Settings2 className="h-5 w-5" />
          )}
        </Button>
      </div>

      {isEditing ? (
        <div className="space-y-4 flex-1">
          <div className="space-y-2">
            <label
              htmlFor="cardio-target"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Cardio
            </label>
            <input
              id="cardio-target"
              type="number"
              min="0"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={editValues.cardio}
              onChange={(e) =>
                setEditValues((p) => ({ ...p, cardio: parseInt(e.target.value) || 0 }))
              }
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="mobilita-target"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Mobilità
            </label>
            <input
              id="mobilita-target"
              type="number"
              min="0"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={editValues.mobilita}
              onChange={(e) =>
                setEditValues((p) => ({ ...p, mobilita: parseInt(e.target.value) || 0 }))
              }
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-6 justify-around flex-1 items-center">
          <div className="flex flex-col items-center gap-2">
            <ProgressRing
              radius={60}
              stroke={8}
              progress={targets.cardio > 0 ? (stats.cardio / targets.cardio) * 100 : 100}
              color="#ef4444"
            >
              <span className="text-2xl font-bold text-foreground">{stats.cardio}</span>
              <span className="text-xs text-muted-foreground">/ {targets.cardio} min</span>
            </ProgressRing>
            <span className="font-semibold text-sm">Cardio</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ProgressRing
              radius={60}
              stroke={8}
              progress={targets.mobilita > 0 ? (stats.mobilita / targets.mobilita) * 100 : 100}
              color="#8b5cf6"
            >
              <span className="text-2xl font-bold text-foreground">{stats.mobilita}</span>
              <span className="text-xs text-muted-foreground">/ {targets.mobilita} min</span>
            </ProgressRing>
            <span className="font-semibold text-sm">Mobilità</span>
          </div>
        </div>
      )}
    </div>
  );
}
