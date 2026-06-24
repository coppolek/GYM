import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { CATEGORIES, EXERCISES } from "@/lib/exercises";
import { Activity, Calendar, Camera, Timer, LineChart as LineChartIcon } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FormaCoach — Allenamenti a casa con AI" },
      {
        name: "description",
        content:
          "Esercizi guidati per core, forza e mal di schiena con timer e correzione della tecnica via webcam.",
      },
      { property: "og:title", content: "FormaCoach — Allenamenti a casa con AI" },
      {
        property: "og:description",
        content:
          "Esercizi guidati per core, forza e mal di schiena con timer e correzione della tecnica via webcam.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b">
        <div
          className="absolute inset-0 -z-10 opacity-60"
          style={{ background: "var(--gradient-primary)" }}
        />
        <div className="absolute inset-0 -z-10 bg-background/85" />
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card/70 backdrop-blur px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            AI Coach con webcam
          </div>
          <h1 className="mt-6 text-4xl sm:text-6xl font-bold tracking-tight text-foreground">
            Allenati a casa <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              con la tecnica giusta.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base sm:text-lg text-muted-foreground">
            Esercizi guidati per core, sviluppo muscolare e mal di schiena. Timer di lavoro e riposo
            integrato, con la webcam che controlla la correttezza dei movimenti in tempo reale.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/category/$cat"
              params={{ cat: "core" }}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] hover:opacity-95 transition"
            >
              <Activity className="h-4 w-4" /> Inizia ora
            </Link>
            <Link
              to="/progress"
              className="inline-flex items-center gap-2 rounded-xl border bg-card px-5 py-3 text-sm font-semibold hover:bg-accent/30 transition"
            >
              <LineChartIcon className="h-4 w-4" /> I Tuoi Progressi
            </Link>
            <Link
              to="/program"
              className="inline-flex items-center gap-2 rounded-xl border bg-card px-5 py-3 text-sm font-semibold hover:bg-accent/30 transition"
            >
              <Calendar className="h-4 w-4" /> Programma
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FeatureCard
              icon={<Camera className="h-5 w-5" />}
              title="Controllo postura"
              desc="AI in tempo reale via webcam"
            />
            <FeatureCard
              icon={<Timer className="h-5 w-5" />}
              title="Timer integrato"
              desc="Lavoro, riposo e ripetizioni"
            />
            <FeatureCard
              icon={<Activity className="h-5 w-5" />}
              title={`${EXERCISES.length}+ esercizi`}
              desc="Spiegati passo per passo"
            />
          </div>
        </div>
      </section>

      <section id="categorie" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Scegli la tua categoria</h2>
        <p className="mt-2 text-muted-foreground">Programmi mirati per ogni obiettivo.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c) => {
            const count = EXERCISES.filter((e) => e.category === c.id).length;
            return (
              <Link
                key={c.id}
                to="/category/$cat"
                params={{ cat: c.id }}
                className="group relative overflow-hidden rounded-2xl border bg-card p-5 transition hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
              >
                <div className="absolute -right-6 -top-6 text-7xl opacity-15 transition group-hover:opacity-25">
                  {c.emoji}
                </div>
                <div className="relative">
                  <div className="text-3xl">{c.emoji}</div>
                  <h3 className="mt-3 text-lg font-semibold">{c.title}</h3>
                  <p className="text-sm text-muted-foreground">{c.subtitle}</p>
                  <p className="mt-4 text-xs font-medium text-primary">{count} esercizi →</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border bg-card/80 backdrop-blur p-4">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}
