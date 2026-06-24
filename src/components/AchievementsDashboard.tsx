import { WEEK_PLAN, TOTAL_WEEKS } from "@/lib/program";
import { Trophy, Medal, Star, Flame, CalendarCheck, Crown } from "lucide-react";

interface AchievementsDashboardProps {
  completed: Record<string, boolean>;
}

export function AchievementsDashboard({ completed }: AchievementsDashboardProps) {
  const trainingDays = WEEK_PLAN.filter((d) => d.exerciseIds.length > 0);
  const totalCompleted = Object.values(completed).filter(Boolean).length;

  const completedMondays = Object.keys(completed).filter(
    (k) => k.endsWith(".mon") && completed[k],
  ).length;
  const completedSaturdays = Object.keys(completed).filter(
    (k) => k.endsWith(".sat") && completed[k],
  ).length;

  const hasPerfectWeek = Array.from({ length: TOTAL_WEEKS })
    .map((_, i) => i + 1)
    .some((w) => {
      return trainingDays.every((d) => completed[`${w}.${d.key}`]);
    });

  const achievements = [
    {
      id: "first-step",
      title: "Primo Passo",
      description: "Hai completato il tuo primo allenamento.",
      icon: Star,
      earned: totalCompleted >= 1,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
    },
    {
      id: "weekend-warrior",
      title: "Guerriero del Weekend",
      description: "Hai completato un allenamento di sabato.",
      icon: Flame,
      earned: completedSaturdays >= 1,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
    },
    {
      id: "iron-core",
      title: "Iron Core",
      description: "Hai completato 3 allenamenti focalizzati sul core.",
      icon: Medal,
      earned: completedMondays >= 3,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      id: "consistency-10",
      title: "Costanza",
      description: "Hai completato 10 allenamenti totali.",
      icon: CalendarCheck,
      earned: totalCompleted >= 10,
      color: "text-green-500",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
    },
    {
      id: "perfect-week",
      title: "Settimana Perfetta",
      description: "Hai completato tutti gli allenamenti di una settimana.",
      icon: Trophy,
      earned: hasPerfectWeek,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
    {
      id: "program-complete",
      title: "Campione Assoluto",
      description: "Hai completato tutto il programma di 4 settimane.",
      icon: Crown,
      earned: totalCompleted >= trainingDays.length * TOTAL_WEEKS,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
  ];

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-elegant)]">
      <div className="mb-6 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold">I tuoi Traguardi</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {achievements.map((ach) => {
          const Icon = ach.icon;
          return (
            <div
              key={ach.id}
              className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ${
                ach.earned
                  ? `${ach.border} ${ach.bg}`
                  : "border-border/50 bg-muted/20 opacity-60 grayscale"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`rounded-full p-2 ${ach.earned ? ach.bg : "bg-muted"}`}>
                  <Icon className={`h-6 w-6 ${ach.earned ? ach.color : "text-muted-foreground"}`} />
                </div>
                <div>
                  <h4
                    className={`font-semibold text-sm ${ach.earned ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {ach.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">
                    {ach.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
