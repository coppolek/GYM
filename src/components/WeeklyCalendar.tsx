import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock,
  Coffee,
  Calendar as CalendarIcon,
  ChevronRight,
  PlayCircle,
} from "lucide-react";
import { WEEK_PLAN, estimatedMinutes, progressionFor, getSessionExercises } from "@/lib/program";
import { getExercise } from "@/lib/exercises";
import { useState } from "react";
import { SessionTimer } from "./SessionTimer";

import { AnatomyChart } from "./AnatomyChart";

interface WeeklyCalendarProps {
  week: number;
  completed: Record<string, boolean>;
  onToggleDay: (key: string) => void;
}

export function WeeklyCalendar({ week, completed, onToggleDay }: WeeklyCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [activeTimerDay, setActiveTimerDay] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {activeTimerDay && (
        <SessionTimer
          week={week}
          exerciseIds={getSessionExercises(WEEK_PLAN.find((d) => d.key === activeTimerDay))}
          onClose={() => setActiveTimerDay(null)}
          onComplete={() => {
            if (!completed[`${week}.${activeTimerDay}`]) {
              onToggleDay(activeTimerDay);
            }
          }}
        />
      )}

      {/* Calendar Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {WEEK_PLAN.map((day) => {
          const isRest = day.exerciseIds.length === 0;
          const done = !!completed[`${week}.${day.key}`];
          const isSelected = selectedDay === day.key;
          const minutes = isRest ? 0 : estimatedMinutes(getSessionExercises(day), week);

          return (
            <button
              key={day.key}
              onClick={() => !isRest && setSelectedDay(isSelected ? null : day.key)}
              disabled={isRest}
              className={`relative flex flex-col items-start rounded-2xl border bg-card p-4 text-left transition hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)] ${
                done ? "border-primary/40 ring-1 ring-primary/40 bg-primary/5" : ""
              } ${isSelected ? "ring-2 ring-primary border-transparent" : ""} ${
                isRest ? "opacity-60 grayscale hover:-translate-y-0 hover:shadow-none" : ""
              }`}
            >
              {done && (
                <div className="absolute right-3 top-3 text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                {day.label.slice(0, 3)}
              </div>
              <div
                className="font-bold text-foreground mb-1 leading-tight line-clamp-1"
                title={day.focus}
              >
                {day.focus}
              </div>

              <div className="mt-auto pt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                {isRest ? (
                  <>
                    <Coffee className="h-3.5 w-3.5" />
                    <span>Riposo</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-3.5 w-3.5" />
                    <span>{minutes} min</span>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Details */}
      {selectedDay && (
        <div className="rounded-2xl border bg-card shadow-[var(--shadow-elegant)] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          {WEEK_PLAN.filter((d) => d.key === selectedDay).map((day) => {
            const done = !!completed[`${week}.${day.key}`];
            return (
              <div key={day.key}>
                <div className="bg-muted/30 p-5 border-b flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold">{day.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {day.focus} • {getSessionExercises(day).length} esercizi
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTimerDay(day.key)}
                      className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold transition hover:bg-accent/80"
                    >
                      <PlayCircle className="h-4 w-4" />
                      Inizia Sessione
                    </button>
                    <button
                      onClick={() => onToggleDay(day.key)}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {done ? "Annulla" : "Completato"}
                    </button>
                  </div>
                </div>

                <div className="p-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {getSessionExercises(day).map((id, i) => {
                    const e = getExercise(id);
                    if (!e) return null;
                    const p = progressionFor(week, e);
                    return (
                      <Link
                        key={`${id}-${i}`}
                        to="/exercise/$id"
                        params={{ id }}
                        search={{
                          w: p.workSeconds,
                          r: p.rounds,
                          s: p.restSeconds,
                        }}
                        className="group flex items-center gap-3 rounded-xl border bg-background px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)] hover:border-primary/30"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl">
                          {e.emoji}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold text-sm">{e.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {p.rounds}×{p.workSeconds}s • riposo {p.restSeconds}s
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary group-hover:translate-x-0.5" />
                      </Link>
                    );
                  })}
                </div>

                {getSessionExercises(day).length > 0 && (
                  <div className="p-5 border-t">
                    <h4 className="text-sm font-semibold mb-4">Muscoli Coinvolti</h4>
                    <AnatomyChart exerciseIds={getSessionExercises(day)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
