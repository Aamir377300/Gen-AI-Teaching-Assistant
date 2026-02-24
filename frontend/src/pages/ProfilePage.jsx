import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    gradeLevel: user?.gradeLevel || "",
    curriculum: user?.curriculum || "",
  });

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = (e) => {
    e.preventDefault();
    updateUser(form);
    toast({ title: "Profile updated", description: "Your preferences have been saved." });
  };

  const inputClass =
    "w-full rounded-lg border border-input bg-background py-2.5 px-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20";
  const selectClass =
    "w-full rounded-lg border border-input bg-background py-2.5 px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20";

  return (
    <div className="max-w-2xl">
      <div className="card-elevated p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full gradient-primary text-xl font-bold text-primary-foreground">
            {user?.name?.charAt(0) || "T"}
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">{user?.name}</h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Full Name</label>
              <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
              <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputClass} disabled />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Grade Level</label>
              <select value={form.gradeLevel} onChange={(e) => update("gradeLevel", e.target.value)} className={selectClass}>
                {Array.from({ length: 12 }, (_, i) => <option key={i}>Grade {i + 1}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Curriculum</label>
              <select value={form.curriculum} onChange={(e) => update("curriculum", e.target.value)} className={selectClass}>
                <option>CBSE</option>
                <option>ICSE</option>
                <option>IB</option>
                <option>Cambridge</option>
                <option>State Board</option>
                <option>Common Core</option>
              </select>
            </div>
          </div>

          <button type="submit"
            className="inline-flex items-center gap-2 rounded-lg gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
            <Save className="h-4 w-4" /> Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
