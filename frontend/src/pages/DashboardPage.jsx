import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { FileText, Presentation, HelpCircle, Sparkles, TrendingUp, Clock } from "lucide-react";
import { CONTENT_TYPES } from "@/lib/constants";

const quickActions = [
  { label: "Generate Quiz", icon: HelpCircle, description: "Create MCQ assessments", path: "/generate", type: "quiz" },
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

    </div>
  );
};

export default DashboardPage;
