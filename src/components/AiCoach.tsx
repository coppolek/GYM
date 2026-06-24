import { useState } from "react";
import { Bot, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Markdown from "react-markdown";

interface AiCoachProps {
  completedThisWeek: number;
}

export function AiCoach({ completedThisWeek }: AiCoachProps) {
  const [preferences, setPreferences] = useState<string[]>(["strength"]);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PREFERENCES = [
    { id: "mobility", label: "Mobilità & Flessibilità" },
    { id: "strength", label: "Forza" },
    { id: "cardio", label: "Cardio" },
  ];

  const togglePreference = (id: string) => {
    setPreferences((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const getSuggestion = async () => {
    setLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const response = await fetch("/api/suggest-workout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pastVolume: completedThisWeek,
          preferences,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Qualcosa è andato storto");
      }

      setSuggestion(data.suggestion);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card shadow-[var(--shadow-elegant)] overflow-hidden">
      <div className="p-6 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-bold">AI Coach</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Ottieni un piano di allenamento personalizzato dal tuo assistente virtuale, basato sui
          tuoi allenamenti recenti.
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h4 className="text-sm font-semibold mb-3">Le tue preferenze per la settimana:</h4>
          <div className="flex flex-col gap-3">
            {PREFERENCES.map((pref) => (
              <div key={pref.id} className="flex items-center space-x-2">
                <Checkbox
                  id={pref.id}
                  checked={preferences.includes(pref.id)}
                  onCheckedChange={() => togglePreference(pref.id)}
                />
                <label
                  htmlFor={pref.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {pref.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={getSuggestion}
          disabled={loading || preferences.length === 0}
          className="w-full gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? "Elaborazione in corso..." : "Genera Piano di Allenamento"}
        </Button>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>
        )}

        {suggestion && (
          <div className="p-5 bg-primary/5 border border-primary/20 rounded-xl mt-4">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Il tuo piano personalizzato
            </h4>
            <div className="text-sm space-y-2 leading-relaxed">
              <Markdown
                components={{
                  h1: ({ node, ...props }) => (
                    <h1 className="text-xl font-bold mt-4 mb-2" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 className="text-lg font-bold mt-4 mb-2" {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-base font-bold mt-3 mb-2" {...props} />
                  ),
                  p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />
                  ),
                  li: ({ node, ...props }) => <li {...props} />,
                  strong: ({ node, ...props }) => (
                    <strong className="font-semibold text-primary" {...props} />
                  ),
                }}
              >
                {suggestion}
              </Markdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
