import Model, { IExerciseData, Muscle } from "react-body-highlighter";
import { getExercise, Exercise } from "@/lib/exercises";
import { useMemo } from "react";

interface AnatomyChartProps {
  exerciseIds: string[];
}

export function AnatomyChart({ exerciseIds }: AnatomyChartProps) {
  const data = useMemo(() => {
    return exerciseIds
      .map((id) => {
        const ex = getExercise(id);
        if (!ex) return null;
        return {
          name: ex.name,
          muscles: getMusclesForExercise(ex) as Muscle[],
        };
      })
      .filter(Boolean) as IExerciseData[];
  }, [exerciseIds]);

  return (
    <div className="flex flex-col md:flex-row gap-8 items-center justify-center p-6 bg-card rounded-2xl border shadow-[var(--shadow-elegant)]">
      <div className="flex flex-col items-center">
        <h4 className="font-semibold mb-4 text-muted-foreground">Fronte</h4>
        <Model
          data={data}
          type="anterior"
          style={{ width: "15rem", padding: "1rem" }}
          highlightedColors={["#8b5cf6", "#7c3aed"]}
        />
      </div>
      <div className="flex flex-col items-center">
        <h4 className="font-semibold mb-4 text-muted-foreground">Retro</h4>
        <Model
          data={data}
          type="posterior"
          style={{ width: "15rem", padding: "1rem" }}
          highlightedColors={["#8b5cf6", "#7c3aed"]}
        />
      </div>
    </div>
  );
}

function getMusclesForExercise(ex: Exercise): string[] {
  const muscles: string[] = [];
  const text = (ex.name + " " + ex.short + " " + ex.description).toLowerCase();

  if (ex.category === "core") {
    muscles.push("abs", "obliques");
  }
  if (ex.category === "schiena") {
    muscles.push("upper-back", "lower-back", "trapezius");
    if (text.includes("spalle") || text.includes("deltoid")) muscles.push("back-deltoids");
  }
  if (ex.category === "forza") {
    if (
      text.includes("gambe") ||
      text.includes("squat") ||
      text.includes("affond") ||
      text.includes("inferiore") ||
      text.includes("glutei")
    ) {
      muscles.push("quadriceps", "gluteal", "hamstring");
    }
    if (
      text.includes("pettorali") ||
      text.includes("piegamenti") ||
      text.includes("chest") ||
      text.includes("push") ||
      text.includes("superiore")
    ) {
      muscles.push("chest", "triceps", "front-deltoids");
    }
    if (text.includes("spalle")) muscles.push("front-deltoids", "back-deltoids");
    if (text.includes("trazion") || text.includes("pull") || text.includes("rematore")) {
      muscles.push("upper-back", "biceps", "trapezius", "forearm");
    }
  }
  if (ex.category === "mobilita") {
    if (text.includes("collo") || text.includes("cervical")) muscles.push("neck");
    if (text.includes("spalle") || text.includes("braccia"))
      muscles.push("front-deltoids", "back-deltoids", "trapezius");
    if (text.includes("bacino") || text.includes("anche")) muscles.push("gluteal", "abductors");
    if (text.includes("polpacci") || text.includes("caviglie"))
      muscles.push("calves", "left-soleus", "right-soleus");
    if (text.includes("cosce") || text.includes("femorali"))
      muscles.push("hamstring", "quadriceps");
    if (text.includes("pettorali") || text.includes("torace")) muscles.push("chest");
    if (text.includes("schiena") || text.includes("lombari"))
      muscles.push("lower-back", "upper-back");
  }
  if (ex.category === "cardio") {
    muscles.push("calves", "quadriceps", "hamstring", "gluteal");
  }

  return [...new Set(muscles)];
}
