import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ totalCandidates: 0, totalJobs: 0, totalInterviews: 0, avgScore: 0 });
  const [funnel, setFunnel] = useState<{ stage: string; count: number; pct: number }[]>([]);

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    const [resumesRes, jobsRes, interviewsRes, scoresRes] = await Promise.all([
      supabase.from("resumes").select("id", { count: "exact", head: true }),
      supabase.from("job_profiles").select("id", { count: "exact", head: true }),
      supabase.from("interviews").select("id", { count: "exact", head: true }),
      supabase.from("candidate_scores").select("fit_score, status"),
    ]);

    const scores = scoresRes.data || [];
    const avgScore = scores.length ? Math.round(scores.reduce((s, r) => s + r.fit_score, 0) / scores.length) : 0;
    const totalCandidates = resumesRes.count || 0;

    setMetrics({
      totalCandidates,
      totalJobs: jobsRes.count || 0,
      totalInterviews: interviewsRes.count || 0,
      avgScore,
    });

    // Build funnel from candidate_scores statuses
    const statusCounts: Record<string, number> = {};
    scores.forEach((s) => { statusCounts[s.status] = (statusCounts[s.status] || 0) + 1; });

    const stages = [
      { stage: "Total Candidates", count: totalCandidates },
      { stage: "Screening", count: statusCounts["Screening"] || 0 },
      { stage: "Interview", count: statusCounts["Interview"] || 0 },
      { stage: "Matched", count: statusCounts["Matched"] || 0 },
      { stage: "Hired", count: statusCounts["Hired"] || 0 },
    ];
    const max = Math.max(totalCandidates, 1);
    setFunnel(stages.map((s) => ({ ...s, pct: Math.round((s.count / max) * 100) })));
    setLoading(false);
  };

  const metricCards = [
    { label: "Total Candidates", value: String(metrics.totalCandidates), icon: Users },
    { label: "Active Jobs", value: String(metrics.totalJobs), icon: Clock },
    { label: "Interviews", value: String(metrics.totalInterviews), icon: TrendingUp },
    { label: "Avg. Fit Score", value: metrics.avgScore ? `${metrics.avgScore}%` : "—", icon: BarChart3 },
  ];

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Hiring performance insights powered by AI.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metricCards.map((m) => (
          <div key={m.label} className="rounded-xl border border-border bg-card p-5">
            <m.icon className="h-5 w-5 text-primary mb-3" />
            <div className="text-2xl font-bold text-foreground">{m.value}</div>
            <span className="text-xs text-muted-foreground">{m.label}</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Hiring Funnel</h2>
        {funnel.every((s) => s.count === 0) ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No data yet. Start by uploading resumes and scoring candidates.</p>
        ) : (
          <div className="space-y-3">
            {funnel.map((s) => (
              <div key={s.stage} className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-36">{s.stage}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-primary transition-all duration-700" style={{ width: `${s.pct}%` }} />
                </div>
                <span className="text-sm font-medium text-foreground w-12 text-right">{s.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
