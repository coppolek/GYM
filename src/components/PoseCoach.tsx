import { useEffect, useRef, useState } from "react";
import type { PoseTarget } from "@/lib/exercises";

interface Props {
  target: PoseTarget;
  onRep?: (count: number) => void;
}

type Landmark = { x: number; y: number; z: number; visibility?: number };

function angle(a: Landmark, b: Landmark, c: Landmark) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.hypot(ab.x, ab.y);
  const magCB = Math.hypot(cb.x, cb.y);
  const cos = dot / (magAB * magCB + 1e-9);
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}

const CONNECTIONS: [number, number][] = [
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 12],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
];

export function PoseCoach({ target, onRep }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<unknown>(null);
  const rafRef = useRef<number | null>(null);
  const lastStateRef = useRef<"up" | "down">("up");
  const repsRef = useRef(0);

  const [reps, setReps] = useState(0);
  const [feedback, setFeedback] = useState<string>("Inizializzazione fotocamera…");
  const [quality, setQuality] = useState<"good" | "warn" | "bad">("warn");
  const [active, setActive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;

    async function setup() {
      try {
        const vision = await import("@mediapipe/tasks-vision");
        const fileset = await vision.FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
        );
        const landmarker = await vision.PoseLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });
        if (cancelled) return;
        landmarkerRef.current = landmarker;

        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        setActive(true);
        setFeedback("Posizionati davanti alla camera");
        loop();
      } catch (err) {
        const msg = (err as Error)?.message || "";
        if (!msg.includes("Permission denied")) {
          console.error(err);
        }
        let errorDesc = (err as Error)?.message ?? "errore";
        if (msg.includes("Permission denied")) {
          errorDesc =
            "Permesso negato. Clicca l'icona 'Apri in una nuova scheda' (il quadrato con la freccia verso l'esterno) in alto a destra nella preview, oppure controlla le impostazioni del browser.";
        }
        setFeedback("Impossibile accedere alla webcam: " + errorDesc);
        setQuality("bad");
      }
    }

    function loop() {
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const landmarker = landmarkerRef.current;
        if (!video || !canvas || !landmarker) {
          rafRef.current = requestAnimationFrame(loop);
          return;
        }
        if (video.readyState >= 2) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d")!;
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
          ctx.restore();

          const result = landmarker.detectForVideo(video, performance.now());
          if (result.landmarks && result.landmarks[0]) {
            const lm: Landmark[] = result.landmarks[0];
            drawPose(ctx, lm, canvas.width, canvas.height);
            evaluate(lm);
          } else {
            setFeedback("Non ti vedo, mettiti in inquadratura");
            setQuality("warn");
          }
        }
        rafRef.current = requestAnimationFrame(loop);
      } catch (e) {
        console.error("Error in predict loop", e);
        // Do not re-request animation frame on fatal error to prevent infinite error loops
      }
    }

    function drawPose(ctx: CanvasRenderingContext2D, lm: Landmark[], w: number, h: number) {
      ctx.strokeStyle = "oklch(0.78 0.13 200)";
      ctx.fillStyle = "oklch(0.58 0.21 256)";
      ctx.lineWidth = 3;
      for (const [a, b] of CONNECTIONS) {
        const p1 = lm[a];
        const p2 = lm[b];
        if (!p1 || !p2) continue;
        ctx.beginPath();
        ctx.moveTo((1 - p1.x) * w, p1.y * h);
        ctx.lineTo((1 - p2.x) * w, p2.y * h);
        ctx.stroke();
      }
      for (const p of lm) {
        ctx.beginPath();
        ctx.arc((1 - p.x) * w, p.y * h, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function evaluate(lm: Landmark[]) {
      if (target === "squat") {
        const hip = lm[24],
          knee = lm[26],
          ankle = lm[28],
          shoulder = lm[12];
        if (!hip || !knee || !ankle) return;
        const kneeAngle = angle(hip, knee, ankle);
        const backAngle = shoulder ? angle(shoulder, hip, knee) : 180;
        if (kneeAngle < 100 && lastStateRef.current === "up") {
          lastStateRef.current = "down";
        } else if (kneeAngle > 160 && lastStateRef.current === "down") {
          lastStateRef.current = "up";
          repsRef.current += 1;
          setReps(repsRef.current);
          onRep?.(repsRef.current);
        }
        if (kneeAngle < 100 && backAngle < 60) {
          setFeedback("Petto più alto, schiena dritta");
          setQuality("warn");
        } else if (kneeAngle < 110) {
          setFeedback("Ottima profondità! Risali");
          setQuality("good");
        } else {
          setFeedback(`Scendi di più — ginocchio ${Math.round(kneeAngle)}°`);
          setQuality(kneeAngle < 140 ? "good" : "warn");
        }
      } else if (target === "pushup") {
        const shoulder = lm[12],
          elbow = lm[14],
          wrist = lm[16],
          hip = lm[24],
          ankle = lm[28];
        if (!shoulder || !elbow || !wrist || !hip || !ankle) return;
        const elbowAngle = angle(shoulder, elbow, wrist);
        const bodyAngle = angle(shoulder, hip, ankle);
        if (elbowAngle < 95 && lastStateRef.current === "up") {
          lastStateRef.current = "down";
        } else if (elbowAngle > 155 && lastStateRef.current === "down") {
          lastStateRef.current = "up";
          repsRef.current += 1;
          setReps(repsRef.current);
          onRep?.(repsRef.current);
        }
        if (bodyAngle < 160) {
          setFeedback("Allinea il corpo: non far cadere i fianchi");
          setQuality("bad");
        } else if (elbowAngle < 100) {
          setFeedback("Profondità ottima — spingi!");
          setQuality("good");
        } else {
          setFeedback(`Scendi di più — gomito ${Math.round(elbowAngle)}°`);
          setQuality("warn");
        }
      } else if (target === "plank") {
        const shoulder = lm[12],
          hip = lm[24],
          ankle = lm[28];
        if (!shoulder || !hip || !ankle) return;
        const bodyAngle = angle(shoulder, hip, ankle);
        if (bodyAngle > 170) {
          setFeedback("Allineamento perfetto, mantieni!");
          setQuality("good");
        } else if (bodyAngle > 155) {
          setFeedback("Quasi — stringi addominali e glutei");
          setQuality("warn");
        } else {
          setFeedback("Bacino fuori linea, correggi la postura");
          setQuality("bad");
        }
      } else if (target === "lunge") {
        const leftHip = lm[23],
          rightHip = lm[24];
        const leftKnee = lm[25],
          rightKnee = lm[26];
        const leftAnkle = lm[27],
          rightAnkle = lm[28];
        if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle) return;
        const leftKneeAngle = angle(leftHip, leftKnee, leftAnkle);
        const rightKneeAngle = angle(rightHip, rightKnee, rightAnkle);
        const minKneeAngle = Math.min(leftKneeAngle, rightKneeAngle);

        if (minKneeAngle < 100 && lastStateRef.current === "up") {
          lastStateRef.current = "down";
        } else if (minKneeAngle > 150 && lastStateRef.current === "down") {
          lastStateRef.current = "up";
          repsRef.current += 1;
          setReps(repsRef.current);
          onRep?.(repsRef.current);
        }

        if (minKneeAngle < 110) {
          setFeedback("Ottima profondità! Risali");
          setQuality("good");
        } else if (minKneeAngle < 140) {
          setFeedback(`Scendi di più — angolo ${Math.round(minKneeAngle)}°`);
          setQuality("warn");
        } else {
          setFeedback("Inizia l'affondo piegando le ginocchia");
          setQuality("good"); // good because it's the starting position
        }
      } else if (target === "crunch") {
        const shoulder = lm[11] || lm[12];
        const hip = lm[23] || lm[24];
        const knee = lm[25] || lm[26];
        if (!shoulder || !hip || !knee) return;
        const torsoAngle = angle(shoulder, hip, knee);

        if (torsoAngle < 120 && lastStateRef.current === "up") {
          lastStateRef.current = "down";
        } else if (torsoAngle > 140 && lastStateRef.current === "down") {
          lastStateRef.current = "up";
          repsRef.current += 1;
          setReps(repsRef.current);
          onRep?.(repsRef.current);
        }

        if (torsoAngle < 120) {
          setFeedback("Ottima contrazione!");
          setQuality("good");
        } else {
          setFeedback("Solleva le spalle e contrai l'addome");
          setQuality("warn");
        }
      } else {
        setFeedback("Esegui l'esercizio con tecnica controllata");
        setQuality("good");
      }
    }

    setup();
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach((t) => t.stop());
      landmarkerRef.current?.close?.();
    };
  }, [target, onRep]);

  const qColor =
    quality === "good"
      ? "bg-[oklch(0.7_0.17_150)]"
      : quality === "warn"
        ? "bg-[oklch(0.78_0.16_75)]"
        : "bg-destructive";

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-elegant)]">
      <video ref={videoRef} className="hidden" muted playsInline />
      <canvas ref={canvasRef} className="block w-full h-auto" />
      <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-background/85 backdrop-blur px-3 py-1.5 text-xs font-medium">
        <span className={`inline-block h-2 w-2 rounded-full ${qColor}`} />
        {active ? "AI Coach attivo" : "Caricamento modello…"}
      </div>
      {target !== "none" && target !== "any" && target !== "plank" && (
        <div className="absolute right-3 top-3 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold tabular-nums">
          Reps: {reps}
        </div>
      )}
      <div className="absolute inset-x-3 bottom-3 rounded-xl bg-background/90 backdrop-blur px-4 py-2.5 text-sm font-medium text-foreground">
        {feedback}
      </div>
    </div>
  );
}
