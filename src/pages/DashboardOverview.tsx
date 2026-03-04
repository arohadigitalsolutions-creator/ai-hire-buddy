import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Users, Zap, TrendingUp, ArrowUpRight, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ jobs: 0, candidates: 0, avgScore: 0, interviews: 0 });
  const [recentCandidates, setRecentCandidates] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchDashboard();
  }, [user]);

  const fetchDashboard = async () => {
    const [jobsRes, resumesRes, scoresRes, interviewsRes] = await Promise.all([
      supabase.from("job_profiles").select("id", { count: "exact", head: true }),
      supabase.from("resumes").select("id, candidate_name, candidate_email, skills, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("candidate_scores").select("fit_score, status, resume_id"),
      supabase.from("interviews").select("id, candidate_name, role, created_at", { count: "exact" }).order("created_at", { ascending: false }).limit(5),
    ]);

    const avgScore = scoresRes.data?.length
      ? Math.round(scoresRes.data.reduce((sum, s) => sum + s.fit_score, 0) / scoresRes.data.length)
      : 0;

    setStats({
      jobs: jobsRes.count || 0,
      candidates: resumesRes.data?.length || 0,
      avgScore,
      interviews: interviewsRes.count || 0,
    });

    const candidates = (resumesRes.data || []).map((r) => {
      const score = scoresRes.data?.find((s) => s.resume_id === r.id);
      return { ...r, score: score?.fit_score, status: score?.status || "Screening" };
    });
    setRecentCandidates(candidates);

    const activity: string[] = [];
    if (jobsRes.count) activity.push(`${jobsRes.count} job profiles created`);
    (interviewsRes.data || []).slice(0, 3).forEach((i: any) => activity.push(`Interview generated for ${i.candidate_name}`));
    (resumesRes.data || []).slice(0, 2).forEach((r: any) => activity.push(`Resume parsed: ${r.candidate_name}`));
    setRecentActivity(activity.length ? activity : ["No activity yet. Start by creating a job profile!"]);
    setLoading(false);
  };

  const statItems = [
    { label: "Active Jobs", value: String(stats.jobs), icon: FileText, color: "text-primary" },
    { label: "Candidates", value: String(stats.candidates), icon: Users, color: "text-accent" },
    { label: "Avg. Score", value: stats.avgScore ? String(stats.avgScore) : "—", icon: Zap, color: "text-warning" },
    { label: "Interviews", value: String(stats.interviews), icon: TrendingUp, color: "text-success" },
  ];

  const statusStyles: Record<string, string> = {
    Interview: "bg-primary/10 text-primary",
    Screening: "bg-accent/10 text-accent",
    Matched: "bg-success/10 text-success",
  };

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back. Here's your hiring overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statItems.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.4 }} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card">
          <div className="p-5 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">Recent Candidates</h2>
          </div>
          <div className="divide-y divide-border">
            {recentCandidates.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">No candidates yet.</div>
            ) : recentCandidates.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-secondary-foreground">
                    {c.candidate_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{c.candidate_name}</div>
                    <div className="text-xs text-muted-foreground">{(c.skills || []).slice(0, 2).join(", ")}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {c.score != null && <span className="text-sm font-semibold text-primary">{c.score}</span>}
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[c.status] || "bg-muted text-muted-foreground"}`}>{c.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="p-5 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
          </div>
          <div className="p-5 space-y-4">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-start gap-3">
                <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">{activity}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
