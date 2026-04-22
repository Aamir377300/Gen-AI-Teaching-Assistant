import { useState, useEffect } from "react";
import { CheckCircle, XCircle, ClipboardList, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";

// ─── Quiz Attempt (student) ───────────────────────────────────────────────────
const QuizAttempt = ({ item, existingResult, onBack }) => {
  const { toast } = useToast();
  const questions = item.questions;
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(existingResult || null);
  const [submitting, setSubmitting] = useState(false);

  const alreadyDone = !!result;

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) return;
    setSubmitting(true);
    try {
      const answersArray = questions.map((_, i) => answers[i]);
      const res = await api.post(`/content/quiz/${item._id}/attempt`, { answers: answersArray });
      setResult(res.data);
      toast({ title: `Quiz submitted! You scored ${res.data.score}/${res.data.total}` });
    } catch (err) {
      if (err.response?.status === 409) {
        setResult(err.response.data.result);
        toast({ title: "Already attempted", variant: "destructive" });
      } else {
        toast({ title: "Failed to submit", variant: "destructive" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">{item.title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{item.topic} · {item.difficulty}</p>
        </div>
        <button onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
          ← Back
        </button>
      </div>

      {alreadyDone && (
        <div className={`rounded-lg p-4 text-center font-semibold text-sm ${result.percentage >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {result.percentage >= 70 ? '🎉' : '📝'} You scored {result.score} / {result.total} — {result.percentage}%
          {existingResult && <p className="text-xs font-normal mt-1 opacity-75">Attempted on {new Date(result.createdAt).toLocaleDateString()}</p>}
        </div>
      )}

      {questions.map((q, i) => {
        const selected = alreadyDone ? result.answers[i] : answers[i];
        const isCorrect = selected === q.correct;

        return (
          <div key={i} className="card-elevated p-5 space-y-3">
            <p className="text-sm font-semibold text-foreground">
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{i + 1}</span>
              {q.question}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options.map((opt, j) => {
                let cls = "rounded-lg border px-3 py-2 text-sm transition-colors ";
                if (!alreadyDone) {
                  cls += selected === j
                    ? "border-primary bg-primary/10 font-medium cursor-pointer"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:bg-muted cursor-pointer";
                } else {
                  if (j === q.correct) cls += "border-green-500 bg-green-50 text-green-800 font-medium";
                  else if (j === selected && !isCorrect) cls += "border-red-400 bg-red-50 text-red-700";
                  else cls += "border-border text-muted-foreground opacity-60";
                }
                return (
                  <div key={j} className={cls}
                    onClick={() => !alreadyDone && setAnswers((a) => ({ ...a, [i]: j }))}>
                    <span className="mr-2 font-medium">{String.fromCharCode(65 + j)}.</span>
                    {opt}
                    {alreadyDone && j === q.correct && <CheckCircle className="inline ml-1.5 h-3.5 w-3.5 text-green-600" />}
                    {alreadyDone && j === selected && !isCorrect && <XCircle className="inline ml-1.5 h-3.5 w-3.5 text-red-500" />}
                  </div>
                );
              })}
            </div>
            {alreadyDone && (
              <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                <strong className="text-foreground">Explanation:</strong> {q.explanation}
              </p>
            )}
          </div>
        );
      })}

      {!alreadyDone && (
        <button onClick={handleSubmit} disabled={submitting || Object.keys(answers).length < questions.length}
          className="w-full rounded-lg gradient-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40">
          {submitting ? "Submitting..." : Object.keys(answers).length < questions.length
            ? `Answer all questions (${Object.keys(answers).length}/${questions.length})`
            : "Submit Quiz"}
        </button>
      )}
    </div>
  );
};

// ─── Quiz Results Modal (teacher) ─────────────────────────────────────────────
const QuizResultsModal = ({ quiz, onClose }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    api.get(`/content/quiz/${quiz._id}/results`)
      .then((r) => setResults(r.data))
      .finally(() => setLoading(false));
  }, [quiz._id]);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/content/quiz/${quiz._id}/results/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quiz.title}-results.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: 'Failed to download PDF', variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h3 className="font-display font-bold text-foreground">{quiz.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Student Results</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDownloadPDF} disabled={downloading || loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50">
              {downloading ? "Downloading..." : "⬇ Download PDF"}
            </button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto p-5 space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No students have attempted this quiz yet.</p>
          ) : results.map((r) => (
            <div key={r._id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{r.student?.name}</p>
                <p className="text-xs text-muted-foreground">{r.student?.studentId || r.student?.email}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${r.percentage >= 70 ? 'text-green-600' : 'text-red-500'}`}>
                  {r.score}/{r.total} — {r.percentage}%
                </p>
                <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Main Quiz Page ───────────────────────────────────────────────────────────
const QuizPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState([]);
  const [myResults, setMyResults] = useState({}); // quizId -> result
  const [active, setActive] = useState(null);
  const [activeResult, setActiveResult] = useState(null);
  const [viewResultsQuiz, setViewResultsQuiz] = useState(null);

  const isStudent = user?.role === 'student';

  useEffect(() => {
    api.get("/content/saved/quizzes")
      .then((res) => {
        setQuizzes(res.data);
        // For students, fetch their result for each quiz
        if (isStudent) {
          res.data.forEach((quiz) => {
            api.get(`/content/quiz/${quiz._id}/my-result`)
              .then((r) => {
                if (r.data.result) {
                  setMyResults((prev) => ({ ...prev, [quiz._id]: r.data.result }));
                }
              })
              .catch(() => {});
          });
        }
      })
      .catch(() => toast({ title: "Failed to load quizzes", variant: "destructive" }));
  }, []);

  const handleAttempt = (quiz) => {
    setActive(quiz);
    setActiveResult(myResults[quiz._id] || null);
  };

  const handleDelete = (id) => {
    api.delete(`/content/quiz/${id}`)
      .then(() => setQuizzes((prev) => prev.filter((q) => q._id !== id)))
      .catch(() => toast({ title: "Delete failed", variant: "destructive" }));
  };

  if (active) {
    return (
      <QuizAttempt
        item={active}
        existingResult={activeResult}
        onBack={() => { setActive(null); setActiveResult(null); }}
      />
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {viewResultsQuiz && (
        <QuizResultsModal quiz={viewResultsQuiz} onClose={() => setViewResultsQuiz(null)} />
      )}

      <div>
        <h2 className="font-display text-xl font-bold text-foreground">Saved Quizzes</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isStudent ? "Each quiz can only be attempted once." : "Select a quiz to view or manage results."}
        </p>
      </div>

      {quizzes.length === 0 ? (
        <div className="card-flat flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No quizzes saved yet. Generate one from the Generate page.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => {
            const result = myResults[quiz._id];
            const attempted = !!result;

            return (
              <div key={quiz._id} className="card-elevated group flex flex-col p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                    <ClipboardList className="h-3 w-3" /> Quiz
                  </span>
                  {isStudent && attempted && (
                    <span className={`text-xs font-semibold ${result.percentage >= 70 ? 'text-green-600' : 'text-red-500'}`}>
                      {result.score}/{result.total} · {result.percentage}%
                    </span>
                  )}
                  {(!isStudent || !attempted) && (
                    <span className="text-xs text-muted-foreground">{new Date(quiz.createdAt).toLocaleDateString()}</span>
                  )}
                </div>
                <h4 className="mb-1 flex-1 font-display text-sm font-semibold text-foreground">{quiz.title}</h4>
                <p className="mb-1 text-xs text-muted-foreground">{quiz.topic}</p>
                <p className="mb-4 text-xs text-muted-foreground">{quiz.questions?.length || 0} questions · {quiz.difficulty}</p>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isStudent ? (
                    <button onClick={() => handleAttempt(quiz)}
                      className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-opacity ${attempted ? 'bg-muted text-muted-foreground' : 'gradient-primary text-primary-foreground hover:opacity-90'}`}>
                      {attempted ? "View Result" : "Attempt"}
                    </button>
                  ) : (
                    <>
                      <button onClick={() => setViewResultsQuiz(quiz)}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                        <Users className="h-3 w-3" /> Results
                      </button>
                      <button onClick={() => handleDelete(quiz._id)}
                        className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors">
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuizPage;
