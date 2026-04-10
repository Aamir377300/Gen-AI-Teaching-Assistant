import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GRADE_LEVELS, CURRICULA } from "@/lib/constants";
import { Users, Download } from "lucide-react";
import api from "@/services/api";
import * as XLSX from "xlsx";

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    gradeLevel: user?.gradeLevel || "",
    curriculum: user?.curriculum || "",
  });
  
  const [generateForm, setGenerateForm] = useState({
    count: 10,
    gradeLevel: user?.gradeLevel || "",
    curriculum: user?.curriculum || "",
  });
  const [generating, setGenerating] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = (e) => {
    e.preventDefault();
    updateUser(form);
    toast({ title: "Profile updated", description: "Your preferences have been saved." });
  };

  const handleGenerateStudents = async (e) => {
    e.preventDefault();
    if (generateForm.count < 1 || generateForm.count > 100) {
      return toast({ title: "Invalid count", description: "Please generate between 1 and 100 accounts.", variant: "destructive" });
    }
    
    setGenerating(true);
    try {
      const response = await api.post("/auth/generate-students", generateForm);
      setGeneratedCredentials(response.data.credentials);
      toast({ title: "Success", description: `Generated ${response.data.credentials.length} student accounts.` });
    } catch (error) {
      toast({ title: "Generation failed", description: error.response?.data?.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const exportToExcel = () => {
    if (!generatedCredentials || generatedCredentials.length === 0) return;
    
    const ws = XLSX.utils.json_to_sheet(generatedCredentials.map(cred => ({
      "Student ID": cred.studentId,
      "Password": cred.password,
      "Name": cred.name,
      "Grade": cred.gradeLevel,
      "Curriculum": cred.curriculum
    })));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Student Credentials");
    XLSX.writeFile(wb, `StudentAccounts_${new Date().getTime()}.xlsx`);
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
                {GRADE_LEVELS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Curriculum</label>
              <select value={form.curriculum} onChange={(e) => update("curriculum", e.target.value)} className={selectClass}>
                {CURRICULA.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <button type="submit"
            className="inline-flex items-center gap-2 rounded-lg gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
            <Save className="h-4 w-4" /> Save Changes
          </button>
        </form>
      </div>

      {user?.role !== 'student' && (
      <div className="card-elevated p-6 mt-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">Generate Student Accounts</h3>
            <p className="text-sm text-muted-foreground">Create accounts for your class to give them access to your materials.</p>
          </div>
        </div>

        <form onSubmit={handleGenerateStudents} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Number of Accounts</label>
              <input type="number" min="1" max="100" value={generateForm.count} onChange={(e) => setGenerateForm({ ...generateForm, count: Number(e.target.value) })} className={inputClass} required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Grade Level</label>
              <select value={generateForm.gradeLevel} onChange={(e) => setGenerateForm({ ...generateForm, gradeLevel: e.target.value })} className={selectClass} required>
                <option value="">Select...</option>
                {GRADE_LEVELS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Curriculum</label>
              <select value={generateForm.curriculum} onChange={(e) => setGenerateForm({ ...generateForm, curriculum: e.target.value })} className={selectClass} required>
                <option value="">Select...</option>
                {CURRICULA.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={generating}
            className="inline-flex items-center gap-2 rounded-lg gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
            <Users className="h-4 w-4" /> {generating ? "Generating..." : "Generate Accounts"}
          </button>
        </form>
        
        {generatedCredentials && (
          <div className="mt-8 border-t border-border pt-6">
            <div className="flex items-center justify-between mb-4">
               <h4 className="font-semibold text-foreground">Recently Generated ({generatedCredentials.length})</h4>
               <button onClick={exportToExcel} className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                 <Download className="h-4 w-4" /> Export Excel
               </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-4 py-2">Student ID</th>
                    <th className="px-4 py-2">Password</th>
                    <th className="px-4 py-2">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {generatedCredentials.slice(0, 5).map((cred, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 font-medium">{cred.studentId}</td>
                      <td className="px-4 py-3 font-mono">{cred.password}</td>
                      <td className="px-4 py-3 text-muted-foreground">{cred.gradeLevel} - {cred.curriculum}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {generatedCredentials.length > 5 && (
              <p className="mt-3 text-xs text-muted-foreground italic text-center">
                Showing 5 of {generatedCredentials.length}. Please export to Excel to view all.
              </p>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default ProfilePage;
