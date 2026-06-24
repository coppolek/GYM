import { getExercise } from "./exercises";

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface ProgramDay {
  key: DayKey;
  label: string;
  focus: string;
  exerciseIds: string[]; // empty = rest day
}

export const WEEK_PLAN: ProgramDay[] = [
  {
    key: "mon",
    label: "Lunedì",
    focus: "Core & Stabilità",
    exerciseIds: [
      "plank",
      "dead-bug",
      "v-up",
      "side-plank",
      "reverse-crunch",
      "plank-jacks",
      "russian-twist",
      "glute-bridge",
      "bear-crawl",
    ],
  },
  {
    key: "tue",
    label: "Martedì",
    focus: "Forza parte superiore",
    exerciseIds: [
      "pushup",
      "wide-pushup",
      "spiderman-pushup",
      "diamond-pushup",
      "archer-pushup",
      "pike-pushup",
      "tricep-dip",
      "inchworm",
    ],
  },
  {
    key: "wed",
    label: "Mercoledì",
    focus: "Mobilità & Recupero attivo",
    exerciseIds: [
      "cat-cow",
      "downward-dog",
      "thoracic-rotation",
      "shoulder-roll",
      "hip-opener",
      "deep-squat-hold",
      "worlds-greatest",
      "butterfly",
    ],
  },
  {
    key: "thu",
    label: "Giovedì",
    focus: "Forza parte inferiore",
    exerciseIds: [
      "squat",
      "jump-squat",
      "lunge",
      "bulgarian-split-squat",
      "wall-sit",
      "step-up",
      "calf-raise",
    ],
  },
  {
    key: "fri",
    label: "Venerdì",
    focus: "Schiena & Postura",
    exerciseIds: [
      "cobra",
      "sphinx",
      "prone-ytw",
      "superman",
      "cat-cow",
      "pelvic-tilt",
      "thread-needle",
      "child-pose",
    ],
  },
  {
    key: "sat",
    label: "Sabato",
    focus: "Cardio & Metabolico",
    exerciseIds: [
      "jumping-jacks",
      "butt-kicks",
      "burpees",
      "skater-jumps",
      "squat-jump",
      "high-knees",
      "mountain-climber",
      "jump-rope-sim",
      "tuck-jump",
    ],
  },
  { key: "sun", label: "Domenica", focus: "Riposo completo", exerciseIds: [] },
];

export const TOTAL_WEEKS = 4;

export interface BaseLoad {
  workSeconds: number;
  restSeconds: number;
  rounds: number;
}

/**
 * Progressione automatica dei carichi.
 * Settimana 1 = baseline. Ogni settimana:
 *  - +15% di tempo di lavoro
 *  -  -8% di tempo di riposo (min 8s)
 *  - +1 round dalla settimana 3 in poi
 */
export function progressionFor(week: number, base: BaseLoad): BaseLoad {
  const w = Math.max(1, Math.min(TOTAL_WEEKS, week));
  const workMul = 1 + (w - 1) * 0.15;
  const restMul = 1 - (w - 1) * 0.08;
  const roundsAdd = w >= 3 ? 1 : 0;
  return {
    workSeconds: Math.max(10, Math.round(base.workSeconds * workMul)),
    restSeconds: Math.max(8, Math.round(base.restSeconds * restMul)),
    rounds: base.rounds + roundsAdd,
  };
}

export function getSmartWarmup(focus: string): string[] {
  const f = focus.toLowerCase();
  if (f.includes("forza parte superiore")) {
    return ["neck-stretch", "shoulder-roll", "arm-circles", "wrist-mobility", "doorway-stretch"];
  }
  if (f.includes("forza parte inferiore")) {
    return ["hip-circles", "hip-opener", "ankle-circles", "deep-squat-hold", "standing-quad"];
  }
  if (f.includes("cardio") || f.includes("core") || f.includes("forza")) {
    return ["arm-circles", "hip-circles", "worlds-greatest", "ankle-circles", "downward-dog"];
  }
  return [];
}

export function getSessionExercises(day: ProgramDay | undefined): string[] {
  if (!day || day.exerciseIds.length === 0) return [];
  // Appends warmup to the start if applicable
  const warmup = getSmartWarmup(day.focus);
  return [...warmup, ...day.exerciseIds];
}

export function estimatedMinutes(exerciseIds: string[], week: number): number {
  let secs = 0;
  for (const id of exerciseIds) {
    const e = getExercise(id);
    if (!e) continue;
    const p = progressionFor(week, e);
    secs += p.rounds * p.workSeconds + Math.max(0, p.rounds - 1) * p.restSeconds + 30; // 30s di transizione
  }
  return Math.max(1, Math.round(secs / 60));
}

export function progressionLabel(week: number) {
  const workPct = Math.round((1 + (week - 1) * 0.15) * 100);
  const restPct = Math.round((1 - (week - 1) * 0.08) * 100);
  const roundsAdd = week >= 3 ? 1 : 0;
  return { workPct, restPct, roundsAdd };
}
