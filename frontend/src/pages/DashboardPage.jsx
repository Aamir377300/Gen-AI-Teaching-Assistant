import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { FileText, Presentation, HelpCircle, Sparkles, TrendingUp, Clock } from "lucide-react";

const quickActions = [
  { label: "Generate Notes", icon: FileText, description: "Create structured study notes", path: "/generate", type: "notes" },
  { label: "Generate Slides", icon: Presentation, description: "Build presentation decks", path: "/generate", type: "slides" },
  { label: "Generate Quiz", icon: HelpCircle, description: "Create MCQ assessments", path: "/generate", type: "quiz" },
];

const stats = [
  { label: "Materials Created", value: "24", icon: Sparkles },
  { label: "This Week", value: "7", icon: TrendingUp },
  { label: "Hours Saved", value: "12", icon: Clock },
];

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-5xl space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">
          Welcome back, {user?.name?.split(" ")[0] || "Teacher"} 👋
        </h2>
        <p className="mt-1 text-muted-foreground">What would you like to create today?</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="card-elevated flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <stat.icon className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              to={`${action.path}?type=${action.type}`}
              className="card-elevated group flex flex-col items-center p-6 text-center transition-all hover:-translate-y-0.5"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl gradient-primary transition-transform group-hover:scale-110">
                <action.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h4 className="font-display font-semibold text-foreground">{action.label}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Recent Activity</h3>
        <div className="card-flat divide-y divide-border">
          {[
            { title: "Quadratic Equations — Study Notes", type: "Notes", time: "2 hours ago" },
            { title: "Photosynthesis — Quiz (15 MCQs)", type: "Quiz", time: "Yesterday" },
            { title: "World War II — Presentation Slides", type: "Slides", time: "2 days ago" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.time}</p>
              </div>
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                {item.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
