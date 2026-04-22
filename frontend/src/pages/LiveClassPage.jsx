import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";
import { Video, VideoOff, ExternalLink, Clock, Users, Plus, X, Link2, Link2Off } from "lucide-react";

// ─── Google Connect Banner ────────────────────────────────────────────────────
const GoogleConnectBanner = ({ isConnected, onConnect, onDisconnect }) => {
  if (isConnected) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-green-500/30 bg-green-50/30 dark:bg-green-950/10 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
          <Link2 className="h-4 w-4" />
          <span>Google account connected — Meet links will use your Google Calendar.</span>
        </div>
        <button onClick={onDisconnect}
          className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
          <Link2Off className="h-3 w-3" /> Disconnect
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between rounded-lg border border-yellow-500/30 bg-yellow-50/30 dark:bg-yellow-950/10 px-4 py-3">
      <div className="text-sm text-yellow-700 dark:text-yellow-400">
        <span className="font-medium">Connect your Google account</span> to create Google Meet links for your students.
      </div>
      <button onClick={onConnect}
        className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Connect Google
      </button>
    </div>
  );
};

// ─── Teacher View ─────────────────────────────────────────────────────────────
const TeacherView = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [form, setForm] = useState({ title: "Live Class", gradeLevel: user?.gradeLevel || "", curriculum: user?.curriculum || "" });

  useEffect(() => {
    api.get("/live/teacher")
      .then((r) => setClasses(r.data))
      .catch(() => toast({ title: "Failed to load classes", variant: "destructive" }))
      .finally(() => setLoading(false));

    // Check Google connection status
    api.get("/gauth/status")
      .then((r) => setIsGoogleConnected(r.data.isGoogleConnected))
      .catch(() => {});

    // Handle redirect back from Google OAuth
    const params = new URLSearchParams(window.location.search);
    if (params.get("google") === "connected") {
      setIsGoogleConnected(true);
      toast({ title: "Google account connected!", description: "You can now create Meet links." });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("google") === "error") {
      toast({ title: "Failed to connect Google account", variant: "destructive" });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleGoogleConnect = async () => {
    try {
      const res = await api.get("/gauth/connect");
      window.location.href = res.data.url;
    } catch {
      toast({ title: "Failed to initiate Google connection", variant: "destructive" });
    }
  };

  const handleGoogleDisconnect = async () => {
    try {
      await api.post("/gauth/disconnect");
      setIsGoogleConnected(false);
      toast({ title: "Google account disconnected" });
    } catch {
      toast({ title: "Failed to disconnect", variant: "destructive" });
    }
  };

  const handleStart = async (e) => {
    e.preventDefault();
    setStarting(true);
    try {
      const res = await api.post("/live/start", form);
      setClasses([res.data, ...classes]);
      setShowForm(false);
      toast({ title: "Live class started!", description: "Students can now see the meeting link." });
      window.open(res.data.meetLink, "_blank", "noopener,noreferrer");
    } catch (err) {
      if (err.response?.data?.requiresGoogleConnect) {
        toast({ title: "Connect Google first", description: "Please connect your Google account to create Meet links.", variant: "destructive" });
      } else {
        toast({ title: "Failed to start", description: err.response?.data?.message, variant: "destructive" });
      }
    } finally {
      setStarting(false);
    }
  };

  const handleEnd = async (id) => {
    try {
      await api.put(`/live/${id}/end`);
      setClasses((prev) => prev.map((c) => c._id === id ? { ...c, isActive: false } : c));
      toast({ title: "Live class ended" });
    } catch {
      toast({ title: "Failed to end class", variant: "destructive" });
    }
  };

  const inputCls = "w-full rounded-lg border border-input bg-background py-2.5 px-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20";

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Live Classes</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Start a Google Meet session for your students.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          {showForm ? <X className="h-4 w-4" /> : <><Video className="h-4 w-4" /> Start Live Class</>}
        </button>
      </div>

      <GoogleConnectBanner
        isConnected={isGoogleConnected}
        onConnect={handleGoogleConnect}
        onDisconnect={handleGoogleDisconnect}
      />

      {showForm && (
        <form onSubmit={handleStart} className="card-elevated p-6 space-y-4">
          <h3 className="font-semibold text-foreground">New Live Session</h3>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Session Title</label>
            <input className={inputCls} value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Grade Level</label>
              <input className={inputCls} value={form.gradeLevel}
                onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Curriculum</label>
              <input className={inputCls} value={form.curriculum}
                onChange={(e) => setForm({ ...form, curriculum: e.target.value })} required />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            A Google Meet link will be generated. Make sure you're signed into Google to host the meeting.
          </p>
          <button type="submit" disabled={starting}
            className="inline-flex items-center gap-2 rounded-lg gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            <Video className="h-4 w-4" /> {starting ? "Starting..." : "Start & Open Meet"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : classes.length === 0 ? (
        <div className="card-flat flex flex-col items-center justify-center py-16 text-center">
          <Video className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No live classes yet. Start one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map((c) => (
            <div key={c._id} className={`card-elevated p-5 ${c.isActive ? "border-green-500/30 bg-green-50/30 dark:bg-green-950/10" : ""}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${c.isActive ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"}`}>
                    {c.isActive ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-foreground">{c.title}</p>
                      {c.isActive && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{c.gradeLevel} · {c.curriculum} · {new Date(c.startedAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a href={c.meetLink} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted transition-colors">
                    <ExternalLink className="h-3 w-3" /> Open Meet
                  </a>
                  {c.isActive && (
                    <button onClick={() => handleEnd(c._id)}
                      className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors">
                      <VideoOff className="h-3 w-3" /> End
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

// ─── Student View ─────────────────────────────────────────────────────────────
const StudentView = () => {
  const { toast } = useToast();
  const [liveClass, setLiveClass] = useState(undefined); // undefined = loading
  const [lastChecked, setLastChecked] = useState(null);

  const fetchActive = async () => {
    try {
      const res = await api.get("/live/active");
      setLiveClass(res.data.liveClass);
      setLastChecked(new Date());
    } catch {
      toast({ title: "Failed to check live class", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchActive();
    // Poll every 30 seconds
    const interval = setInterval(fetchActive, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">Live Class</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Join your teacher's live session when it's active.
        </p>
      </div>

      {liveClass === undefined ? (
        <p className="text-sm text-muted-foreground">Checking for active class...</p>
      ) : liveClass ? (
        <div className="card-elevated p-6 border-green-500/30 bg-green-50/30 dark:bg-green-950/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Video className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-foreground">{liveClass.title}</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE NOW
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {liveClass.gradeLevel} · {liveClass.curriculum} · Started {new Date(liveClass.startedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <a href={liveClass.meetLink} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
            <Video className="h-4 w-4" /> Join Google Meet
          </a>
        </div>
      ) : (
        <div className="card-flat flex flex-col items-center justify-center py-16 text-center">
          <VideoOff className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">No live class right now</p>
          <p className="text-xs text-muted-foreground mt-1">
            You'll see a join button here when your teacher starts a session.
          </p>
          <button onClick={fetchActive}
            className="mt-4 text-xs text-primary hover:underline">
            Refresh
          </button>
        </div>
      )}

      {lastChecked && (
        <p className="text-xs text-muted-foreground text-center">
          Last checked: {lastChecked.toLocaleTimeString()} · Auto-refreshes every 30s
        </p>
      )}
    </div>
  );
};

// ─── Page Entry ───────────────────────────────────────────────────────────────
const LiveClassPage = () => {
  const { user } = useAuth();
  return user?.role === "teacher" ? <TeacherView /> : <StudentView />;
};

export default LiveClassPage;
