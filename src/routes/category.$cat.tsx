import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  getCategory,
  getExercisesByCategory,
  type Exercise,
  type ExerciseCategory,
} from "@/lib/exercises";
import { ArrowLeft, Clock, Repeat } from "lucide-react";

export const Route = createFileRoute("/category/$cat")({
  head: ({ params }) => {
    const c = getCategory(params.cat);
    return {
      meta: [
        { title: `${c?.title ?? "Categoria"} — FormaCoach` },
        { name: "description", content: c?.subtitle ?? "Esercizi guidati" },
      ],
    };
  },
  loader: ({ params }) => {
    const cat = getCategory(params.cat);
    if (!cat) throw notFound();
    return { cat, list: getExercisesByCategory(params.cat as ExerciseCategory) };
  },
  component: CategoryPage,
  notFoundComponent: () => (
    <div className="p-10 text-center">
      Categoria non trovata.{" "}
      <Link to="/" className="text-primary underline">
        Home
      </Link>
    </div>
  ),
});

function CategoryPage() {
  const { cat, list } = Route.useLoaderData();
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <div className="mt-6 flex items-center gap-3">
          <span className="text-4xl">{cat.emoji}</span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{cat.title}</h1>
            <p className="text-muted-foreground">{cat.subtitle}</p>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {list.map((e: Exercise) => (
            <Link
              key={e.id}
              to="/exercise/$id"
              params={{ id: e.id }}
              className="group rounded-2xl border bg-card p-5 transition hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-3xl">{e.emoji}</div>
                  <h3 className="mt-3 text-lg font-semibold">{e.name}</h3>
                  <p className="text-sm text-muted-foreground">{e.short}</p>
                </div>
                {e.poseTarget !== "none" && (
                  <span className="rounded-full bg-accent/40 px-2 py-1 text-[10px] font-semibold text-accent-foreground">
                    AI Coach
                  </span>
                )}
              </div>
              <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {e.workSeconds}s lavoro
                </span>
                <span className="inline-flex items-center gap-1">
                  <Repeat className="h-3.5 w-3.5" />
                  {e.rounds} round
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
