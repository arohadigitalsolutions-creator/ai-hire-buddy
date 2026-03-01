import { motion } from "framer-motion";
import { FileText, Users, Zap, TrendingUp, ArrowUpRight, Clock } from "lucide-react";

const stats = [
  { label: "Active Jobs", value: "12", change: "+3 this week", icon: FileText, color: "text-primary" },
  { label: "Candidates", value: "284", change: "+47 today", icon: Users, color: "text-accent" },
  { label: "Avg. Score", value: "78.4", change: "+2.1 pts", icon: Zap, color: "text-warning" },
  { label: "Hired", value: "23", change: "This month", icon: TrendingUp, color: "text-success" },
];

const recentCandidates = [
  { name: "Sarah Chen", role: "Sr. Frontend Engineer", score: 94, status: "Interview" },
  { name: "James Wilson", role: "Backend Developer", score: 87, status: "Screening" },
  { name: "Maria Garcia", role: "Product Manager", score: 82, status: "Matched" },
  { name: "Alex Kim", role: "DevOps Engineer", score: 79, status: "Interview" },
  { name: "David Park", role: "Data Scientist", score: 76, status: "Screening" },
];

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? "text-success" : score >= 80 ? "text-primary" : "text-warning";
  return <span className={`text-sm font-semibold ${color}`}>{score}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Interview: "bg-primary/10 text-primary",
    Screening: "bg-accent/10 text-accent",
    Matched: "bg-success/10 text-success",
  };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

export default function DashboardOverview() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back. Here's your hiring overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.change}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Candidates */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">Recent Candidates</h2>
            <button className="text-xs text-primary hover:underline">View All</button>
          </div>
          <div className="divide-y divide-border">
            {recentCandidates.map((c) => (
              <div key={c.name} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-secondary-foreground">
                    {c.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <ScoreBadge score={c.score} />
                  <StatusBadge status={c.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className="rounded-xl border border-border bg-card">
          <div className="p-5 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
          </div>
          <div className="p-5 space-y-4">
            {[
              "New JD created for Sr. Engineer",
              "12 resumes parsed for PM role",
              "Interview questions generated",
              "3 invitation emails sent",
              "Scoring weights updated",
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-3">
                <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-foreground">{activity}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{i + 1}h ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
