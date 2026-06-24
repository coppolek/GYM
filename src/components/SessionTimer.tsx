import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, Square, SkipForward, SkipBack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getExercise, Exercise } from "@/lib/exercises";
import { progressionFor } from "@/lib/program";

interface SessionTimerProps {
  week: number;
  exerciseIds: string[];
  onClose: () => void;
  onComplete: () => void;
}

type TimerPhase = "prepare" | "work" | "rest" | "done";

interface TimerStep {
  exerciseId: string;
  name: string;
  emoji: string;
  round: number;
  totalRounds: number;
  phase: TimerPhase;
  duration: number;
}

export function SessionTimer({ week, exerciseIds, onClose, onComplete }: SessionTimerProps) {
  const [steps, setSteps] = useState<TimerStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Generate sequence of steps
    const newSteps: TimerStep[] = [];

    // Add initial preparation
    newSteps.push({
      exerciseId: "",
      name: "Preparazione",
      emoji: "⏱️",
      round: 1,
      totalRounds: 1,
      phase: "prepare",
      duration: 10,
    });

    exerciseIds.forEach((id, exIndex) => {
      const ex = getExercise(id);
      if (!ex) return;
      const prog = progressionFor(week, ex);

      for (let r = 1; r <= prog.rounds; r++) {
        newSteps.push({
          exerciseId: id,
          name: ex.name,
          emoji: ex.emoji,
          round: r,
          totalRounds: prog.rounds,
          phase: "work",
          duration: prog.workSeconds,
        });

        // Add rest if not the very last round of the very last exercise
        if (r < prog.rounds || exIndex < exerciseIds.length - 1) {
          newSteps.push({
            exerciseId: id,
            name: r < prog.rounds ? "Riposo" : "Cambio Esercizio",
            emoji: "🧘",
            round: r,
            totalRounds: prog.rounds,
            phase: "rest",
            duration: prog.restSeconds,
          });
        }
      }
    });

    newSteps.push({
      exerciseId: "",
      name: "Allenamento Completato!",
      emoji: "🎉",
      round: 1,
      totalRounds: 1,
      phase: "done",
      duration: 0,
    });

    setSteps(newSteps);
    setTimeLeft(newSteps[0].duration);
  }, [week, exerciseIds]);

  const handleNextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setTimeLeft(steps[nextIndex].duration);
      if (steps[nextIndex].phase === "done") {
        setIsRunning(false);
        onComplete();
      }
    }
  }, [currentStepIndex, steps, onComplete]);

  useEffect(() => {
    if (isRunning && steps[currentStepIndex]?.phase !== "done") {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleNextStep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, currentStepIndex, steps, handleNextStep]);

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      setTimeLeft(steps[prevIndex].duration);
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);

  if (steps.length === 0) return null;

  const currentStep = steps[currentStepIndex];
  const isDone = currentStep.phase === "done";
  const progress = isDone ? 100 : ((currentStep.duration - timeLeft) / currentStep.duration) * 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
      <div className="max-w-xl w-full mx-auto flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold">Timer Sessione</h2>
          <Button variant="ghost" onClick={onClose}>
            Chiudi
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
          <div className="text-8xl mb-4">{currentStep.emoji}</div>

          <div className="space-y-2">
            <h3 className="text-3xl font-bold">{currentStep.name}</h3>
            {currentStep.phase === "work" && (
              <p className="text-xl text-muted-foreground">
                Set {currentStep.round} di {currentStep.totalRounds}
              </p>
            )}
            {currentStep.phase === "rest" && (
              <p className="text-xl text-muted-foreground">Recupero</p>
            )}
          </div>

          {!isDone && (
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="128" cy="128" r="120" className="stroke-muted fill-none stroke-[8]" />
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  className={`fill-none stroke-[8] transition-all duration-1000 linear ${
                    currentStep.phase === "work" ? "stroke-primary" : "stroke-green-500"
                  }`}
                  strokeDasharray={120 * 2 * Math.PI}
                  strokeDashoffset={120 * 2 * Math.PI * (1 - progress / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-7xl font-bold tabular-nums">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
              </div>
            </div>
          )}

          {isDone && (
            <div className="text-2xl text-primary font-bold">
              Bravissimo! Hai completato la sessione.
            </div>
          )}
        </div>

        <div className="flex justify-center items-center gap-6 mt-8 pb-8">
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={handlePrevStep}
            disabled={currentStepIndex === 0}
          >
            <SkipBack className="h-6 w-6" />
          </Button>

          {!isDone && (
            <Button size="icon" className="h-20 w-20 rounded-full" onClick={toggleTimer}>
              {isRunning ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={handleNextStep}
            disabled={isDone}
          >
            <SkipForward className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
