import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { WEEK_PLAN, estimatedMinutes, getSessionExercises } from "@/lib/program";
import { CalendarDays, Clock, Flame, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface HistoryEntry {
  id: string; // "1.mon"
  timestamp: string;
}

interface WorkoutHistoryProps {
  history: HistoryEntry[];
  completed: Record<string, boolean>;
}

export function WorkoutHistory({ history, completed }: WorkoutHistoryProps) {
  const logEntries = useMemo(() => {
    // Gather all explicitly saved history
    const entries = history.map((entry) => {
      const [weekStr, dayKey] = entry.id.split(".");
      const week = parseInt(weekStr, 10);
      const day = WEEK_PLAN.find((d) => d.key === dayKey);

      return {
        id: entry.id,
        week,
        day,
        timestamp: entry.timestamp,
      };
    });

    // Also find completed sessions that might not be in history (e.g. from before history was added)
    Object.keys(completed).forEach((key) => {
      if (completed[key] && !entries.some((e) => e.id === key)) {
        const [weekStr, dayKey] = key.split(".");
        const week = parseInt(weekStr, 10);
        const day = WEEK_PLAN.find((d) => d.key === dayKey);
        if (day) {
          entries.push({
            id: key,
            week,
            day,
            timestamp: "", // empty means unknown
          });
        }
      }
    });

    // Filter out invalid ones, and sort by timestamp descending
    return entries
      .filter((e) => e.day)
      .sort((a, b) => {
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  }, [history, completed]);

  const exportCSV = () => {
    if (logEntries.length === 0) return;

    const headers = ["ID", "Settimana", "Giorno", "Focus", "Data", "Durata (minuti)"];

    const rows = logEntries.map((entry) => {
      const duration = entry.day ? estimatedMinutes(getSessionExercises(entry.day), entry.week) : 0;
      const date = entry.timestamp
        ? format(parseISO(entry.timestamp), "yyyy-MM-dd HH:mm", { locale: it })
        : "Sconosciuta";

      return [
        entry.id,
        entry.week.toString(),
        entry.day?.label || "",
        entry.day?.focus || "",
        date,
        duration.toString(),
      ]
        .map((val) => `"${val}"`)
        .join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `cronologia_allenamenti_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (logEntries.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-elegant)]">
        <h3 className="text-lg font-bold mb-4">Cronologia Allenamenti</h3>
        <p className="text-sm text-muted-foreground text-center py-8">
          Nessun allenamento completato. Inizia oggi!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card shadow-[var(--shadow-elegant)] overflow-hidden">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Cronologia Allenamenti</h3>
          <p className="text-sm text-muted-foreground">I tuoi ultimi allenamenti completati.</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Esporta CSV</span>
        </Button>
      </div>
      <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
        {logEntries.map((entry) => {
          const duration = entry.day
            ? estimatedMinutes(getSessionExercises(entry.day), entry.week)
            : 0;
          return (
            <div
              key={entry.id}
              className="p-4 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground">
                    Settimana {entry.week} - {entry.day?.label}
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-xs bg-primary/10 text-primary hover:bg-primary/20 border-transparent flex items-center gap-1"
                  >
                    <Flame className="h-3 w-3" />
                    {entry.day?.focus}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {entry.timestamp
                      ? format(parseISO(entry.timestamp), "d MMM yyyy, HH:mm", { locale: it })
                      : "Data sconosciuta"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium">
                <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {duration} min
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
