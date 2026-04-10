import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Sparkles, RotateCcw, Save, ChevronRight, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Loader from "@/components/Loader";
import { CONTENT_TYPES, DIFFICULTY_LEVELS, CONTENT_LENGTHS, TONE_OPTIONS } from "@/lib/constants";
import api from "@/services/api";

const GeneratePage = () => {
  const [searchParams] = useSearchParams();
  const [topic, setTopic] = useState("");
  const contentType = "quiz"; // Always quiz now since notes/slides moved to Chat
  const [difficulty, setDifficulty] = useState("intermediate");
  const [length, setLength] = useState("medium");
  const [tone, setTone] = useState("engaging");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [savedPdfUrl, setSavedPdfUrl] = useState(null);
  const { toast } = useToast();

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setSavedPdfUrl(null);
    try {
      const response = await api.post('/content/generate/quiz', { topic, difficulty, tone });
      setResult(response.data);
    } catch {
      toast({ title: "Generation failed", description: "Could not generate content. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };


  const handleSaveQuiz = async () => {
    try {
      await api.post("/content/saved/quiz", { title: result.title, topic, difficulty, tone, content: result });
      toast({ title: "Saved!", description: "Quiz saved. Students can now attempt it." });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    }
  };

  const selectClass = "w-full rounded-lg border border-input bg-background py-2.5 px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20";

  return (
    <div className="max-w-5xl space-y-6">
      {/* Form */}
      <form onSubmit={handleGenerate} className="card-elevated p-6">
        <h3 className="mb-5 font-display text-lg font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" /> Generate Quiz
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Topic</label>
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded-lg border border-input bg-background py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
              placeholder="Enter the topic name" required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Difficulty</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={selectClass}>
              {DIFFICULTY_LEVELS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Tone</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)} className={selectClass}>
              {TONE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="mt-5 inline-flex items-center gap-2 rounded-lg gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
          <Sparkles className="h-4 w-4" /> {loading ? "Generating..." : "Generate"}
        </button>
      </form>

      {loading && <Loader text="AI is generating your quiz..." />}

      {/* Quiz Preview (answers hidden) */}
      {!loading && result && contentType === "quiz" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-foreground">{result.title}</h3>
            <div className="flex gap-2">
              <button onClick={() => setResult(null)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors">
                <RotateCcw className="h-3 w-3" /> Regenerate
              </button>
              <button onClick={handleSaveQuiz}
                className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                <Save className="h-3 w-3" /> Save Quiz
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Preview — answers are hidden. Save to let students attempt it.</p>
          {result.questions.map((q, i) => (
            <div key={i} className="card-elevated p-5">
              <p className="mb-3 text-sm font-semibold text-foreground">
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{i + 1}</span>
                {q.question}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {q.options.map((opt, j) => (
                  <div key={j} className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
                    <span className="mr-2 font-medium">{String.fromCharCode(65 + j)}.</span>{opt}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GeneratePage;
