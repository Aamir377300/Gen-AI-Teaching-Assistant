import { useState, useEffect } from "react";
import { Search, FileText, Presentation, HelpCircle, Trash2, Eye, X, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";

const typeIcons = { notes: FileText, slides: Presentation, quiz: HelpCircle };
const typeLabels = { notes: "Notes", slides: "Slides", quiz: "Quiz" };

const NotesViewer = ({ content }) => (
  <div className="space-y-5">
    {content?.sections?.map((s, i) => (
      <div key={i}>
        <h4 className="mb-2 flex items-center gap-2 font-display text-base font-semibold text-foreground">
          <ChevronRight className="h-4 w-4 text-primary" /> {s.heading}
        </h4>
        <p className="text-sm leading-relaxed text-muted-foreground">{s.content}</p>
      </div>
    ))}
    {content?.summary && (
      <div className="rounded-lg bg-accent/50 p-4">
        <h4 className="mb-1 text-sm font-semibold text-accent-foreground">Summary</h4>
        <p className="text-sm text-muted-foreground">{content.summary}</p>
      </div>
    )}
  </div>
);

const ViewModal = ({ item, onClose }) => {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl bg-card shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">{item.content?.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{item.topic} · {item.difficulty} · {item.tone}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          <NotesViewer content={item.content} />
        </div>
      </div>
    </div>
  );
};

const SavedContentPage = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [viewing, setViewing] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    api.get("/content/saved")
      .then((res) => setItems(res.data))
      .catch(() => toast({ title: "Failed to load saved materials", variant: "destructive" }));
  }, []);

  const filtered = items.filter((item) => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || item.type === filterType;
    return matchSearch && matchType;
  });

  const handleDelete = (id) => {
    api.delete(`/content/saved/${id}`)
      .then(() => {
        setItems((prev) => prev.filter((i) => i._id !== id));
        toast({ title: "Deleted", description: "Content has been removed." });
      })
      .catch(() => toast({ title: "Delete failed", variant: "destructive" }));
  };

  const handleView = (item) => {
    if ((item.type === "slides" || item.type === "notes") && item.pdfUrl) {
      window.open(item.pdfUrl, "_blank", "noopener,noreferrer");
    } else {
      setViewing(item);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <ViewModal item={viewing} onClose={() => setViewing(null)} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
            placeholder="Search materials..." />
        </div>
        <div className="flex gap-2">
          {["all", "notes", "slides"].map((t) => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${filterType === t ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              {t === "all" ? "All" : typeLabels[t]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card-flat flex flex-col items-center justify-center py-16 text-center">
          <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No saved materials found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const Icon = typeIcons[item.type];
            return (
              <div key={item._id} className="card-elevated group flex flex-col p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                    <Icon className="h-3 w-3" />
                    {typeLabels[item.type]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="mb-1 flex-1 font-display text-sm font-semibold text-foreground">{item.title}</h4>
                <p className="mb-4 text-xs text-muted-foreground">{item.topic}</p>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleView(item)}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-foreground hover:bg-muted transition-colors">
                    <Eye className="h-3 w-3" /> View
                  </button>
                  <button onClick={() => handleDelete(item._id)}
                    className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SavedContentPage;
