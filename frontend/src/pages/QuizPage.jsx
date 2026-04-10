import { useState, useEffect } from "react";
import { CheckCircle, XCircle, RotateCcw, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";

const QuizAttempt = ({ item, onBack }) => {
  const questions = item.questions;
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);

  const score = checked
    ? questions.filter((q, i) => answers[i] === q.correct).length
    : 0;

  const handleCheck = () => {
    if (Object.keys(answers).length < questions.length) return;
    setChecked(true);
  };

  const handleReset = () => {
    setAnswers({});
    setChecked(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">{item.title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{item.topic} · {item.difficulty}</p>
        </div>
        <div className="flex gap-2">
          {checked && (
            <button onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors">
              <RotateCcw className="h-3 w-3" /> Retry
            </button>
          )}
          <button onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors">
            ← Back
          </button>
        </div>
      </div>

      {/* Score banner */}
      {checked && (
        <div className={`rounded-lg p-4 text-center font-semibold text-sm ${score >= questions.length * 0.7 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          You scored {score} / {questions.length} — {Math.round((score / questions.length) * 100)}%
        </div>
      )}

      {/* Questions */}
      {questions.map((q, i) => {
        const selected = answers[i];
        const isCorrect = selected === q.correct;

        return (
          <div key={i} className="card-elevated p-5 space-y-3">
            <p className="text-sm font-semibold text-foreground">
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{i + 1}</span>
              {q.question}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options.map((opt, j) => {
                let cls = "rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ";
                if (!checked) {
                  cls += selected === j
                    ? "border-primary bg-primary/10 text-foreground font-medium"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:bg-muted";
                } else {
                  if (j === q.correct) {
                    cls += "border-green-500 bg-green-50 text-green-800 font-medium";
                  } else if (j === selected && !isCorrect) {
                    cls += "border-red-400 bg-red-50 text-red-700";
                  } else {
                    cls += "border-border text-muted-foreground opacity-60";
                  }
                }
                return (
                  <div key={j} className={cls} onClick={() => !checked && setAnswers((a) => ({ ...a, [i]: j }))}>
                    <span className="mr-2 font-medium">{String.fromCharCode(65 + j)}.</span>
                    {opt}
                    {checked && j === q.correct && <CheckCircle className="inline ml-1.5 h-3.5 w-3.5 text-green-600" />}
                    {checked && j === selected && !isCorrect && <XCircle className="inline ml-1.5 h-3.5 w-3.5 text-red-500" />}
                  </div>
                );
              })}
            </div>
            {checked && (
              <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                <strong className="text-foreground">Explanation:</strong> {q.explanation}
              </p>
            )}
          </div>
        );
      })}

      {/* Check button */}
      {!checked && (
        <button onClick={handleCheck}
          disabled={Object.keys(answers).length < questions.length}
          className="w-full rounded-lg gradient-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40">
          {Object.keys(answers).length < questions.length
            ? `Answer all questions (${Object.keys(answers).length}/${questions.length})`
            : "Check Answers"}
        </button>
      )}
    </div>
  );
};

const QuizPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [active, setActive] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    api.get("/content/saved/quizzes")
      .then((res) => setQuizzes(res.data))
      .catch(() => toast({ title: "Failed to load quizzes", variant: "destructive" }));
  }, []);

  const handleDelete = (id) => {
    api.delete(`/content/quiz/${id}`)
      .then(() => setQuizzes((prev) => prev.filter((q) => q._id !== id)))
      .catch(() => toast({ title: "Delete failed", variant: "destructive" }));
  };

  if (active) return <QuizAttempt item={active} onBack={() => setActive(null)} />;

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">Saved Quizzes</h2>
        <p className="text-sm text-muted-foreground mt-1">Select a quiz to attempt it.</p>
      </div>

      {quizzes.length === 0 ? (
        <div className="card-flat flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No quizzes saved yet. Generate one from the Generate page.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <div key={quiz._id} className="card-elevated group flex flex-col p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                  <ClipboardList className="h-3 w-3" /> Quiz
                </span>
                <span className="text-xs text-muted-foreground">{new Date(quiz.createdAt).toLocaleDateString()}</span>
              </div>
              <h4 className="mb-1 flex-1 font-display text-sm font-semibold text-foreground">{quiz.title}</h4>
              <p className="mb-1 text-xs text-muted-foreground">{quiz.topic}</p>
              <p className="mb-4 text-xs text-muted-foreground">{quiz.questions?.length || 0} questions · {quiz.difficulty}</p>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setActive(quiz)}
                  className="inline-flex items-center gap-1 rounded-md gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90">
                  Attempt
                </button>
                <button onClick={() => handleDelete(quiz._id)}
                  className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizPage;
