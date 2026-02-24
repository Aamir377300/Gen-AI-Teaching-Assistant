import { useState } from "react";
import { Search, FileText, Presentation, HelpCircle, Copy, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MOCK_ITEMS = [
  { id: "1", title: "Quadratic Equations — Study Notes", type: "notes", subject: "Mathematics", createdAt: "2 hours ago" },
  { id: "2", title: "Photosynthesis — MCQ Quiz", type: "quiz", subject: "Biology", createdAt: "Yesterday" },
  { id: "3", title: "World War II — Presentation", type: "slides", subject: "History", createdAt: "2 days ago" },
  { id: "4", title: "Newton's Laws — Study Notes", type: "notes", subject: "Physics", createdAt: "3 days ago" },
  { id: "5", title: "Shakespeare — Quiz", type: "quiz", subject: "English", createdAt: "1 week ago" },
  { id: "6", title: "Chemical Bonding — Slides", type: "slides", subject: "Chemistry", createdAt: "1 week ago" },
];

const typeIcons = { notes: FileText, slides: Presentation, quiz: HelpCircle };
const typeLabels = { notes: "Notes", slides: "Slides", quiz: "Quiz" };

const SavedContentPage = () => {
  const [items, setItems] = useState(MOCK_ITEMS);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const { toast } = useToast();

  const filtered = items.filter((item) => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || item.type === filterType;
    return matchSearch && matchType;
  });

  const handleDelete = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast({ title: "Deleted", description: "Content has been removed." });
  };

  const handleDuplicate = (item) => {
    const dup = { ...item, id: Date.now().toString(), title: `${item.title} (Copy)`, createdAt: "Just now" };
    setItems((prev) => [dup, ...prev]);
    toast({ title: "Duplicated", description: "A copy has been created." });
  };

  const selectClass =
    "rounded-lg border border-input bg-background py-2 px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20";

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
            placeholder="Search materials..." />
        </div>
        <div className="flex gap-2">
          {["all", "notes", "slides", "quiz"].map((t) => (
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
              <div key={item.id} className="card-elevated group flex flex-col p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                    <Icon className="h-3 w-3" />
                    {typeLabels[item.type]}
                  </span>
                  <span className="text-xs text-muted-foreground">{item.createdAt}</span>
                </div>
                <h4 className="mb-1 flex-1 font-display text-sm font-semibold text-foreground">{item.title}</h4>
                <p className="mb-4 text-xs text-muted-foreground">{item.subject}</p>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-foreground hover:bg-muted transition-colors">
                    <Eye className="h-3 w-3" /> View
                  </button>
                  <button onClick={() => handleDuplicate(item)} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-foreground hover:bg-muted transition-colors">
                    <Copy className="h-3 w-3" /> Duplicate
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors">
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
