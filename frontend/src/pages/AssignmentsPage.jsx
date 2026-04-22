import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";
import {
  ClipboardList, Plus, Upload, Trash2, Eye, X, Link2, ExternalLink, Calendar, Sparkles, Loader2,
} from "lucide-react";

const inputCls = "w-full rounded-lg border border-input bg-background py-2.5 px-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20";

// ─── Teacher: Create Assignment Modal ────────────────────────────────────────
const CreateModal = ({ onClose, onCreated, user }) => {
  const { toast } = useToast();
  const fileRef = useRef();

  // tabs: "manual" | "ai"
  const [tab, setTab] = useState("ai");

  // shared fields
  const [form, setForm] = useState({
    title: "", description: "", dueDate: "",
    gradeLevel: user?.gradeLevel || "", curriculum: user?.curriculum || "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // AI fields
  const [aiPrompt, setAiPrompt] = useState("");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [generating, setGenerating] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return toast({ title: "Enter a prompt first", variant: "destructive" });
    setGenerating(true);
    setAiGenerated(false);
    try {
      const res = await api.post("/assignments/generate", {
        prompt: aiPrompt,
        gradeLevel: form.gradeLevel,
        curriculum: form.curriculum,
        difficulty,
      });
      setForm((f) => ({ ...f, title: res.data.title, description: res.data.description }));
      setAiGenerated(true);
      toast({ title: "Assignment generated!", description: "Review and post it below." });
    } catch (err) {
      toast({ title: "Generation failed", description: err.response?.data?.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      if (file) fd.append("file", file);
      const res = await api.post("/assignments", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onCreated(res.data);
      toast({ title: "Assignment posted!" });
      onClose();
    } catch (err) {
      toast({ title: "Failed to create", description: err.response?.data?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40">
      <div className="relative w-full max-w-lg bg-card rounded-xl shadow-xl border border-border max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h3 className="font-display text-lg font-bold">New Assignment</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border shrink-0">
          {[
            { id: "ai", label: "✨ Generate with AI" },
            { id: "manual", label: "Manual" },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">

            {/* AI Tab */}
            {tab === "ai" && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Describe the assignment</label>
                  <textarea className={inputCls} rows={3} value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Create a Grade 8 assignment on the water cycle with 5 questions including a diagram task and a short essay..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Difficulty</label>
                    <select className={inputCls} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Grade Level</label>
                    <input className={inputCls} value={form.gradeLevel}
                      onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}
                      placeholder="e.g. Grade 8" />
                  </div>
                </div>
                <button type="button" onClick={handleGenerate} disabled={generating}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg gradient-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                  {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4" /> Generate Assignment</>}
                </button>

                {/* Preview after generation */}
                {aiGenerated && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide">AI Generated — Review before posting</p>
                    <p className="text-sm font-semibold text-foreground">{form.title}</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{form.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Manual Tab */}
            {tab === "manual" && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Title</label>
                  <input className={inputCls} required value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Assignment title" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Description / Instructions</label>
                  <textarea className={inputCls} rows={4} value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Instructions for students..." />
                </div>
              </div>
            )}

            {/* Shared fields — always visible */}
            <div className="border-t border-border pt-4 space-y-4">
              {tab === "ai" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Title (editable)</label>
                  <input className={inputCls} required value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Assignment title" />
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium">Due Date (optional)</label>
                <input type="datetime-local" className={inputCls} value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Attachment (optional)</label>
                <div onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-3 rounded-lg border-2 border-dashed border-border px-4 py-3 cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {file ? file.name : "Click to upload PDF, DOCX, image..."}
                  </span>
                </div>
                <input ref={fileRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors">Cancel</button>
              <button type="submit" disabled={loading || !form.title}
                className="px-5 py-2 text-sm rounded-lg gradient-primary text-primary-foreground font-semibold disabled:opacity-50">
                {loading ? "Posting..." : "Post Assignment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─── Submissions Drawer ───────────────────────────────────────────────────────
const SubmissionsDrawer = ({ assignment, onClose }) => {
  const [data, setData] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    api.get(`/assignments/${assignment._id}/submissions`)
      .then((r) => setData(r.data))
      .catch(() => toast({ title: "Failed to load submissions", variant: "destructive" }));
  }, [assignment._id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-card rounded-xl shadow-xl border border-border">
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <h3 className="font-display text-lg font-bold">Submissions — {assignment.title}</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <div className="p-6">
          {!data ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : data.submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No submissions yet.</p>
          ) : (
            <div className="space-y-3">
              {data.submissions.map((s) => (
                <div key={s._id} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{s.student?.name}</p>
                      <p className="text-xs text-muted-foreground">{s.student?.studentId} · {s.student?.gradeLevel}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(s.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {s.note && <p className="mt-2 text-xs text-muted-foreground italic">"{s.note}"</p>}
                  <a href={s.driveLink} target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" /> View Drive Link
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Student: Submit Modal ────────────────────────────────────────────────────
const SubmitModal = ({ assignment, onClose, onSubmitted }) => {
  const { toast } = useToast();
  const [driveLink, setDriveLink] = useState(assignment.mySubmission?.driveLink || "");
  const [note, setNote] = useState(assignment.mySubmission?.note || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/assignments/${assignment._id}/submit`, { driveLink, note });
      toast({ title: "Submitted!" });
      onSubmitted();
      onClose();
    } catch (err) {
      toast({ title: "Submission failed", description: err.response?.data?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full rounded-lg border border-input bg-background py-2.5 px-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40">
      <div className="relative w-full max-w-md bg-card rounded-xl shadow-xl border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-display text-lg font-bold">Submit Assignment</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">{assignment.title}</p>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Google Drive Link</label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                required value={driveLink} onChange={(e) => setDriveLink(e.target.value)}
                placeholder="https://drive.google.com/..." />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Note (optional)</label>
            <textarea className={inputCls} rows={2} value={note}
              onChange={(e) => setNote(e.target.value)} placeholder="Any note for your teacher..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={loading}
              className="px-5 py-2 text-sm rounded-lg gradient-primary text-primary-foreground font-semibold disabled:opacity-50">
              {loading ? "Submitting..." : assignment.mySubmission ? "Update Submission" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const AssignmentsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isTeacher = user?.role === "teacher";

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [viewSubmissions, setViewSubmissions] = useState(null);
  const [submitTarget, setSubmitTarget] = useState(null);

  const fetchAssignments = async () => {
    try {
      const endpoint = isTeacher ? "/assignments/teacher" : "/assignments/student";
      const res = await api.get(endpoint);
      setAssignments(res.data);
    } catch {
      toast({ title: "Failed to load assignments", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssignments(); }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/assignments/${id}`);
      setAssignments((prev) => prev.filter((a) => a._id !== id));
      toast({ title: "Deleted" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={(a) => setAssignments([a, ...assignments])}
          user={user}
        />
      )}
      {viewSubmissions && (
        <SubmissionsDrawer assignment={viewSubmissions} onClose={() => setViewSubmissions(null)} />
      )}
      {submitTarget && (
        <SubmitModal
          assignment={submitTarget}
          onClose={() => setSubmitTarget(null)}
          onSubmitted={fetchAssignments}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Assignments</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isTeacher ? "Manage and track student assignments." : "View and submit your assignments."}
          </p>
        </div>
        {isTeacher && (
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            <Plus className="h-4 w-4" /> New Assignment
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : assignments.length === 0 ? (
        <div className="card-flat flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {isTeacher ? "No assignments yet. Create one to get started." : "No assignments from your teacher yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((a) => (
            <div key={a._id} className="card-elevated p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-display font-semibold text-foreground">{a.title}</h4>
                  {a.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{a.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {a.dueDate && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due {new Date(a.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    {a.gradeLevel && <span>{a.gradeLevel} · {a.curriculum}</span>}
                    {isTeacher && (
                      <span className="text-primary font-medium">
                        {a.submissions?.length || 0} submission{a.submissions?.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {a.fileUrl && (
                    <a href={a.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted transition-colors">
                      <ExternalLink className="h-3 w-3" /> File
                    </a>
                  )}
                  {isTeacher ? (
                    <>
                      <button onClick={() => setViewSubmissions(a)}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted transition-colors">
                        <Eye className="h-3 w-3" /> Submissions
                      </button>
                      <button onClick={() => handleDelete(a._id)}
                        className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setSubmitTarget(a)}
                      className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        a.mySubmission
                          ? "border border-green-500/30 text-green-600 hover:bg-green-50"
                          : "gradient-primary text-primary-foreground"
                      }`}>
                      {a.mySubmission ? "✓ Resubmit" : "Submit"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;
