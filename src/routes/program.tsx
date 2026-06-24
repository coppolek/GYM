import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  WEEK_PLAN,
  TOTAL_WEEKS,
  progressionFor,
  estimatedMinutes,
  progressionLabel,
} from "@/lib/program";
import { getExercise } from "@/lib/exercises";
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { VolumeDashboard } from "@/components/VolumeDashboard";
import { WeeklyTargets } from "@/components/WeeklyTargets";
import { WorkoutHistory } from "@/components/WorkoutHistory";
import { AchievementsDashboard } from "@/components/AchievementsDashboard";
import { AiCoach } from "@/components/AiCoach";

export const Route = createFileRoute("/program")({
  head: () => ({
    meta: [
      { title: "Programma settimanale — FormaCoach" },
      {
        name: "description",
        content:
          "Programma di allenamento settimanale su 4 settimane con progressione automatica dei carichi, durata per giorno e tracking dei progressi.",
      },
      { property: "og:title", content: "Programma settimanale — FormaCoach" },
      {
        property: "og:description",
        content:
          "7 giorni a settimana, 4 settimane di progressione: più lavoro, meno riposo, round extra.",
      },
    ],
  }),
  component: ProgramPage,
});

function ProgramPage() {
  const [week, setWeek] = useState(1);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [history, setHistory] = useState<Array<{ id: string; timestamp: string }>>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const w = Number(localStorage.getItem("program.week") || "1");
      setWeek(Math.max(1, Math.min(TOTAL_WEEKS, w)));
      const c = JSON.parse(localStorage.getItem("program.completed") || "{}");
      if (c && typeof c === "object") setCompleted(c);
      const h = JSON.parse(localStorage.getItem("program.history") || "[]");
      if (Array.isArray(h)) setHistory(h);
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  function persistWeek(w: number) {
    const clamped = Math.max(1, Math.min(TOTAL_WEEKS, w));
    setWeek(clamped);
    try {
      localStorage.setItem("program.week", String(clamped));
    } catch {
      // ignore
    }
  }

  function toggleDay(key: string) {
    const id = `${week}.${key}`;
    const isCompleting = !completed[id];
    const nextCompleted = { ...completed, [id]: isCompleting };
    setCompleted(nextCompleted);

    let nextHistory = [...history];
    if (isCompleting) {
      nextHistory.push({ id, timestamp: new Date().toISOString() });
    } else {
      nextHistory = nextHistory.filter((entry) => entry.id !== id);
    }
    setHistory(nextHistory);

    try {
      localStorage.setItem("program.completed", JSON.stringify(nextCompleted));
      localStorage.setItem("program.history", JSON.stringify(nextHistory));
    } catch {
      // ignore
    }
  }

  const trainingDays = WEEK_PLAN.filter((d) => d.exerciseIds.length > 0);
  const completedThisWeek = trainingDays.filter((d) => completed[`${week}.${d.key}`]).length;
  const weekProgress = (completedThisWeek / trainingDays.length) * 100;
  const { workPct, restPct, roundsAdd } = progressionLabel(week);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Programma settimanale</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {TOTAL_WEEKS} settimane di allenamento con progressione automatica: ogni settimana
              aumentano i secondi di lavoro e i round, mentre il tempo di riposo si riduce.
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-xl border bg-card p-1">
            <button
              onClick={() => persistWeek(week - 1)}
              disabled={week <= 1}
              className="rounded-lg p-2 hover:bg-accent/30 disabled:opacity-30"
              aria-label="Settimana precedente"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="px-3 text-sm font-semibold tabular-nums">
              Settimana {week} / {TOTAL_WEEKS}
            </div>
            <button
              onClick={() => persistWeek(week + 1)}
              disabled={week >= TOTAL_WEEKS}
              className="rounded-lg p-2 hover:bg-accent/30 disabled:opacity-30"
              aria-label="Settimana successiva"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <section className="mt-6 rounded-2xl border bg-card p-5 shadow-[var(--shadow-elegant)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4 text-primary" />
              Progressione settimana {week}
            </div>
            <div className="text-xs text-muted-foreground">
              {completedThisWeek} / {trainingDays.length} giorni completati
            </div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${weekProgress}%`,
                background: "var(--gradient-primary)",
              }}
            />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Tempo di lavoro" value={`${workPct}%`} hint="vs baseline" />
            <Metric label="Tempo di riposo" value={`${restPct}%`} hint="vs baseline" />
            <Metric
              label="Round extra"
              value={roundsAdd > 0 ? `+${roundsAdd}` : "0"}
              hint="da settimana 3"
            />
            <Metric
              label="Avanzamento"
              value={`${Math.round((week / TOTAL_WEEKS) * 100)}%`}
              hint="del programma"
            />
          </div>
        </section>

        <section className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <VolumeDashboard completed={completed} />
            </div>
            <div>
              <WeeklyTargets week={week} completed={completed} />
            </div>
          </div>
        </section>

        <section className="mt-8">
          <WeeklyCalendar week={week} completed={completed} onToggleDay={toggleDay} />
        </section>

        <section className="mt-8">
          <WorkoutHistory history={history} completed={completed} />
        </section>

        <section className="mt-8">
          <AiCoach completedThisWeek={completedThisWeek} />
        </section>

        <section className="mt-8">
          <AchievementsDashboard completed={completed} />
        </section>

        {hydrated && completedThisWeek === trainingDays.length && week < TOTAL_WEEKS && (
          <div className="mt-6 rounded-2xl border border-primary/40 bg-primary/5 p-5 text-center">
            <p className="text-sm font-medium">
              Settimana {week} completata! Pronto per il prossimo livello.
            </p>
            <button
              onClick={() => persistWeek(week + 1)}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
            >
              Passa alla settimana {week + 1}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {hydrated && completedThisWeek === trainingDays.length && week === TOTAL_WEEKS && (
          <div className="mt-6 rounded-2xl border border-primary/40 bg-primary/5 p-5 text-center">
            <p className="text-sm font-medium">
              Programma di {TOTAL_WEEKS} settimane completato. Ottimo lavoro!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border bg-background/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-base font-bold tabular-nums">{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
