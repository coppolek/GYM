import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getCategory, getExercise } from "@/lib/exercises";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Camera, CameraOff, Pause, Play, RotateCcw } from "lucide-react";
import { PoseCoach } from "@/components/PoseCoach";
import { WorkoutLogger } from "@/components/WorkoutLogger";
import { useQuery } from "@tanstack/react-query";
import { getYoutubeId } from "@/lib/youtube";

export const Route = createFileRoute("/exercise/$id")({
  head: ({ params }) => {
    const e = getExercise(params.id);
    return {
      meta: [
        { title: `${e?.name ?? "Esercizio"} — FormaCoach` },
        { name: "description", content: e?.short ?? "" },
      ],
    };
  },
  validateSearch: (search: Record<string, unknown>) => {
    const num = (v: unknown) => {
      if (v === undefined || v === null || v === "") return undefined;
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? n : undefined;
    };
    return {
      w: num(search.w), // workSeconds override (progressione)
      r: num(search.r), // rounds override
      s: num(search.s), // restSeconds override
    };
  },
  loader: ({ params }) => {
    const ex = getExercise(params.id);
    if (!ex) throw notFound();
    return { ex, cat: getCategory(ex.category)! };
  },
  component: ExercisePage,
  notFoundComponent: () => (
    <div className="p-10 text-center">
      Esercizio non trovato.{" "}
      <Link to="/" className="text-primary underline">
        Home
      </Link>
    </div>
  ),
});

type Phase = "idle" | "ready" | "work" | "rest" | "done";

function ExercisePage() {
  const { ex: baseEx, cat } = Route.useLoaderData();
  const search = Route.useSearch();
  const ex = useMemo(
    () => ({
      ...baseEx,
      workSeconds: search.w ?? baseEx.workSeconds,
      restSeconds: search.s ?? baseEx.restSeconds,
      rounds: search.r ?? baseEx.rounds,
    }),
    [baseEx, search.w, search.s, search.r],
  );
  const isProgressed =
    (search.w !== undefined && search.w !== baseEx.workSeconds) ||
    (search.r !== undefined && search.r !== baseEx.rounds) ||
    (search.s !== undefined && search.s !== baseEx.restSeconds);
  const [phase, setPhase] = useState<Phase>("idle");
  const [round, setRound] = useState(1);
  const [seconds, setSeconds] = useState(ex.workSeconds);
  const [paused, setPaused] = useState(false);
  const [useCam, setUseCam] = useState(ex.poseTarget !== "none");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: youtubeId, isLoading: youtubeLoading } = useQuery({
    queryKey: ["youtubeId", ex.name],
    queryFn: () => getYoutubeId({ data: `${ex.name} esercizio tutorial palestra` }),
  });

  function clearTick() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  useEffect(() => () => clearTick(), []);

  function start() {
    setRound(1);
    setPhase("ready");
    setSeconds(3);
    setPaused(false);
  }

  function reset() {
    clearTick();
    setPhase("idle");
    setRound(1);
    setSeconds(ex.workSeconds);
    setPaused(false);
  }

  useEffect(() => {
    if (phase === "idle" || phase === "done" || paused) return;
    clearTick();
    intervalRef.current = setInterval(() => {
      setSeconds((s: number) => {
        if (s > 1) return s - 1;
        // transition
        if (phase === "ready") {
          setPhase("work");
          return ex.workSeconds;
        }
        if (phase === "work") {
          if (round >= ex.rounds) {
            setPhase("done");
            clearTick();
            try {
              new Audio(
                "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=",
              )
                .play()
                .catch(() => {});
            } catch {
              // ignore
            }
            return 0;
          }
          setPhase("rest");
          return ex.restSeconds;
        }
        if (phase === "rest") {
          setRound((r) => r + 1);
          setPhase("work");
          return ex.workSeconds;
        }
        return s;
      });
    }, 1000);
    return clearTick;
  }, [phase, paused, ex, round]);

  const phaseColor =
    phase === "work"
      ? "text-primary"
      : phase === "rest"
        ? "text-[oklch(0.78_0.16_75)]"
        : phase === "done"
          ? "text-[oklch(0.7_0.17_150)]"
          : "text-foreground";

  const phaseLabel = {
    idle: "Pronto",
    ready: "Preparati",
    work: "LAVORA",
    rest: "RIPOSO",
    done: "COMPLETATO",
  }[phase];

  const totalSeconds =
    phase === "work"
      ? ex.workSeconds
      : phase === "rest"
        ? ex.restSeconds
        : phase === "ready"
          ? 3
          : ex.workSeconds;
  const progress =
    phase === "idle" || phase === "done" ? 0 : ((totalSeconds - seconds) / totalSeconds) * 100;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link
          to="/category/$cat"
          params={{ cat: cat.id }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {cat.title}
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_minmax(0,420px)]">
          {/* LEFT: description */}
          <div>
            <div className="flex items-center gap-3">
              <span className="text-5xl">{ex.emoji}</span>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{ex.name}</h1>
                <p className="text-muted-foreground">{ex.short}</p>
              </div>
            </div>

            <p className="mt-6 text-foreground/90 leading-relaxed">{ex.description}</p>

            <h2 className="mt-8 text-lg font-semibold">Esecuzione</h2>
            <ol className="mt-3 space-y-2.5">
              {ex.steps.map((s: string, i: number) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="text-sm text-foreground/90">{s}</span>
                </li>
              ))}
            </ol>

            <h2 className="mt-8 text-lg font-semibold">Video Tutorial</h2>
            <div className="mt-3 aspect-video w-full overflow-hidden rounded-xl border bg-muted flex items-center justify-center">
              {youtubeLoading ? (
                <div className="text-muted-foreground text-sm">Ricerca video in corso...</div>
              ) : youtubeId ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title={`Video tutorial per ${ex.name}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="border-0"
                />
              ) : (
                <div className="text-muted-foreground text-sm">Video non trovato</div>
              )}
            </div>

            <h2 className="mt-8 text-lg font-semibold">Consigli</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {ex.tips.map((t: string, i: number) => (
                <li
                  key={i}
                  className="rounded-lg border bg-card px-3 py-2 text-sm text-foreground/90"
                >
                  • {t}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <Stat label="Lavoro" value={`${ex.workSeconds}s`} />
              <Stat label="Riposo" value={`${ex.restSeconds}s`} />
              <Stat label="Round" value={`${ex.rounds}`} />
              {ex.poseTarget !== "none" && <Stat label="AI Coach" value="Sì" highlight />}
              {isProgressed && <Stat label="Carico" value="Progressione" highlight />}
            </div>
          </div>

          {/* RIGHT: timer + cam */}
          <div className="space-y-4">
            <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-elegant)]">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
                <span>
                  Round {round} / {ex.rounds}
                </span>
                <span className={phaseColor}>{phaseLabel}</span>
              </div>
              <div className="mt-4 text-center">
                <div className={`text-7xl font-bold tabular-nums ${phaseColor}`}>
                  {phase === "idle" ? ex.workSeconds : seconds}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">secondi</div>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full transition-all duration-1000"
                  style={{ width: `${progress}%`, background: "var(--gradient-primary)" }}
                />
              </div>
              <div className="mt-5 flex gap-2">
                {phase === "idle" || phase === "done" ? (
                  <button
                    onClick={start}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-95"
                  >
                    <Play className="h-4 w-4" /> {phase === "done" ? "Ricomincia" : "Inizia"}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setPaused((p) => !p)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-95"
                    >
                      {paused ? (
                        <>
                          <Play className="h-4 w-4" /> Riprendi
                        </>
                      ) : (
                        <>
                          <Pause className="h-4 w-4" /> Pausa
                        </>
                      )}
                    </button>
                    <button
                      onClick={reset}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-accent/30"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
              {ex.poseTarget !== "none" && (
                <button
                  onClick={() => setUseCam((v) => !v)}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium hover:bg-accent/30"
                >
                  {useCam ? (
                    <>
                      <CameraOff className="h-3.5 w-3.5" /> Disattiva webcam
                    </>
                  ) : (
                    <>
                      <Camera className="h-3.5 w-3.5" /> Attiva AI Coach
                    </>
                  )}
                </button>
              )}
            </div>

            {useCam && phase !== "idle" && phase !== "done" && <PoseCoach target={ex.poseTarget} />}
            {useCam && (phase === "idle" || phase === "done") && (
              <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
                La webcam si attiverà quando avvii l'allenamento.
              </div>
            )}

            <WorkoutLogger exerciseId={ex.id} />
          </div>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${highlight ? "bg-accent/30 border-accent" : "bg-card"}`}
    >
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
