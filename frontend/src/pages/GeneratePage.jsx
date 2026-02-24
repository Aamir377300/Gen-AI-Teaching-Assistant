import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Sparkles, RotateCcw, Save, Edit3, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Loader from "@/components/Loader";

const MOCK_NOTES = {
  title: "Quadratic Equations",
  sections: [
    { heading: "Introduction", content: "A quadratic equation is a second-degree polynomial equation of the form ax² + bx + c = 0, where a ≠ 0. These equations appear frequently in physics, engineering, and everyday problem-solving." },
    { heading: "The Quadratic Formula", content: "The solutions to any quadratic equation can be found using x = (-b ± √(b² - 4ac)) / 2a. The discriminant (b² - 4ac) determines the nature of the roots." },
    { heading: "Methods of Solving", content: "Quadratic equations can be solved by factoring, completing the square, or using the quadratic formula. Each method has its advantages depending on the equation structure." },
  ],
  summary: "Quadratic equations are fundamental algebraic expressions with wide applications. Mastering the quadratic formula and factoring techniques is essential for advanced mathematics.",
};

const MOCK_SLIDES = [
  { title: "Quadratic Equations", bullets: ["Definition and standard form", "Real-world applications", "Learning objectives for today"] },
  { title: "Standard Form", bullets: ["ax² + bx + c = 0", "a, b, c are constants where a ≠ 0", "x represents the unknown variable"] },
  { title: "Solving Methods", bullets: ["Factoring", "Completing the square", "Quadratic formula", "Graphical method"] },
  { title: "The Discriminant", bullets: ["Δ = b² - 4ac", "Δ > 0: Two real roots", "Δ = 0: One repeated root", "Δ < 0: Complex roots"] },
];

const MOCK_QUIZ = [
  { question: "What is the standard form of a quadratic equation?", options: ["ax + b = 0", "ax² + bx + c = 0", "ax³ + bx² + cx + d = 0", "a/x + b = 0"], correct: 1, explanation: "The standard form is ax² + bx + c = 0 where a ≠ 0." },
  { question: "What does the discriminant determine?", options: ["The degree of the equation", "The nature of the roots", "The coefficient values", "The graph direction"], correct: 1, explanation: "The discriminant (b² - 4ac) tells us whether roots are real, repeated, or complex." },
  { question: "If the discriminant is zero, the equation has:", options: ["No real roots", "Two distinct real roots", "One repeated real root", "Infinitely many roots"], correct: 2, explanation: "When Δ = 0, both roots are equal, giving one repeated root." },
];

const GeneratePage = () => {
  const [searchParams] = useSearchParams();
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState(searchParams.get("type") || "notes");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [length, setLength] = useState("medium");
  const [tone, setTone] = useState("engaging");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { toast } = useToast();

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 2000));
    if (contentType === "notes") setResult(MOCK_NOTES);
    else if (contentType === "slides") setResult(MOCK_SLIDES);
    else setResult(MOCK_QUIZ);
    setLoading(false);
  };

  const handleSave = () => {
    toast({ title: "Saved!", description: "Content saved to your materials." });
  };

  const selectClass =
    "w-full rounded-lg border border-input bg-background py-2.5 px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20";

  return (
    <div className="max-w-5xl space-y-6">
      {/* Form */}
      <form onSubmit={handleGenerate} className="card-elevated p-6">
        <h3 className="mb-5 font-display text-lg font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" /> Generate Content
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Topic</label>
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded-lg border border-input bg-background py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
              placeholder="Enter the topic name" required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Content Type</label>
            <select value={contentType} onChange={(e) => { setContentType(e.target.value); setResult(null); }} className={selectClass}>
              <option value="notes">📄 Study Notes</option>
              <option value="slides">📊 Presentation Slides</option>
              <option value="quiz">📝 Quiz (MCQs)</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Difficulty</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={selectClass}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Length</label>
            <select value={length} onChange={(e) => setLength(e.target.value)} className={selectClass}>
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="detailed">Detailed</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Tone</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)} className={selectClass}>
              <option value="formal">Formal</option>
              <option value="simple">Simple</option>
              <option value="engaging">Engaging</option>
            </select>
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="mt-5 inline-flex items-center gap-2 rounded-lg gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
          <Sparkles className="h-4 w-4" /> {loading ? "Generating..." : "Generate"}
        </button>
      </form>

      {/* Loading */}
      {loading && <Loader text="AI is generating your content..." />}

      {/* Notes Result */}
      {!loading && result && contentType === "notes" && (
        <div className="card-elevated p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-bold text-foreground">{result.title}</h3>
            <div className="flex gap-2">
              <button onClick={() => { setResult(null); }} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors">
                <RotateCcw className="h-3 w-3" /> Regenerate
              </button>
              <button onClick={handleSave} className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                <Save className="h-3 w-3" /> Save
              </button>
            </div>
          </div>
          {result.sections.map((s, i) => (
            <div key={i}>
              <h4 className="mb-2 flex items-center gap-2 font-display text-base font-semibold text-foreground">
                <ChevronRight className="h-4 w-4 text-primary" /> {s.heading}
              </h4>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.content}</p>
            </div>
          ))}
          <div className="rounded-lg bg-accent/50 p-4">
            <h4 className="mb-1 text-sm font-semibold text-accent-foreground">Summary</h4>
            <p className="text-sm text-muted-foreground">{result.summary}</p>
          </div>
        </div>
      )}

      {/* Slides Result */}
      {!loading && result && contentType === "slides" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-foreground">Generated Slides</h3>
            <div className="flex gap-2">
              <button onClick={() => setResult(null)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors">
                <RotateCcw className="h-3 w-3" /> Regenerate
              </button>
              <button onClick={handleSave} className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                <Save className="h-3 w-3" /> Save
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors">
                Export PDF
              </button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {result.map((slide, i) => (
              <div key={i} className="card-elevated p-5 group">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Slide {i + 1}</span>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <h4 className="mb-3 font-display font-semibold text-foreground">{slide.title}</h4>
                <ul className="space-y-1.5">
                  {slide.bullets.map((b, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiz Result */}
      {!loading && result && contentType === "quiz" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-foreground">Generated Quiz</h3>
            <div className="flex gap-2">
              <button onClick={() => setResult(null)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors">
                <RotateCcw className="h-3 w-3" /> Regenerate
              </button>
              <button onClick={handleSave} className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                <Save className="h-3 w-3" /> Save
              </button>
            </div>
          </div>
          {result.map((q, i) => (
            <div key={i} className="card-elevated p-5">
              <p className="mb-3 text-sm font-semibold text-foreground">
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{i + 1}</span>
                {q.question}
              </p>
              <div className="mb-3 grid gap-2 sm:grid-cols-2">
                {q.options.map((opt, j) => (
                  <div key={j} className={`rounded-lg border px-3 py-2 text-sm ${j === q.correct ? "border-primary bg-accent text-accent-foreground font-medium" : "border-border text-muted-foreground"}`}>
                    <span className="mr-2 font-medium">{String.fromCharCode(65 + j)}.</span>{opt}
                  </div>
                ))}
              </div>
              <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                <strong className="text-foreground">Explanation:</strong> {q.explanation}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GeneratePage;
