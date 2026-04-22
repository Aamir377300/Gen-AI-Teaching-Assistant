import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import {
  Sparkles, HelpCircle, FolderOpen, FileText, Video, Brain, ClipboardList, BookOpen,
} from "lucide-react";

const teacherActions = [
  {
    label: "Generate Content",
    icon: Sparkles,
    description: "Create notes, slides & quizzes with AI",
    path: "/generate",
    color: "from-violet-500 to-indigo-500",
  },
  {
    label: "Assignments",
    icon: FileText,
    description: "Create & manage student assignments",
    path: "/assignments",
    color: "from-orange-400 to-pink-500",
  },
  {
    label: "Live Class",
    icon: Video,
    description: "Start a Google Meet session",
    path: "/live",
    color: "from-green-400 to-emerald-500",
  },
  {
    label: "Chat Assistant",
    icon: Brain,
    description: "Ask AI questions about your materials",
    path: "/rag",
    color: "from-sky-400 to-blue-500",
  },
  {
    label: "Quizzes",
    icon: HelpCircle,
    description: "View & manage saved quizzes",
    path: "/quizzes",
    color: "from-yellow-400 to-amber-500",
  },
  {
    label: "Saved Materials",
    icon: FolderOpen,
    description: "Browse your notes and slides",
    path: "/saved",
    color: "from-teal-400 to-cyan-500",
  },
];

const studentActions = [
  {
    label: "Quizzes",
    icon: HelpCircle,
    description: "Attempt quizzes assigned by your teacher",
    path: "/quizzes",
    color: "from-yellow-400 to-amber-500",
  },
  {
    label: "Assignments",
    icon: FileText,
    description: "View & submit your assignments",
    path: "/assignments",
    color: "from-orange-400 to-pink-500",
  },
  {
    label: "Live Class",
    icon: Video,
    description: "Join your teacher's live session",
    path: "/live",
    color: "from-green-400 to-emerald-500",
  },
  {
    label: "Saved Materials",
    icon: FolderOpen,
    description: "Access notes and slides shared by teacher",
    path: "/saved",
    color: "from-teal-400 to-cyan-500",
  },
];

const DashboardPage = () => {
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const actions = isStudent ? studentActions : teacherActions;
  const firstName = user?.name?.split(" ")[0] || (isStudent ? "Student" : "Teacher");

  return (
    <div className="max-w-5xl space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">
          Welcome back, {firstName} 👋
        </h2>
        <p className="mt-1 text-muted-foreground">
          {isStudent ? "Here's what you can do today." : "What would you like to do today?"}
        </p>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => (
            <Link
              key={action.label}
              to={action.path}
              className="card-elevated group flex items-start gap-4 p-5 transition-all hover:-translate-y-0.5"
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${action.color} transition-transform group-hover:scale-110`}>
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-display font-semibold text-foreground">{action.label}</h4>
                <p className="mt-0.5 text-sm text-muted-foreground">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
