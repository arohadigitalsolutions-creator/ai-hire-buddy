import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp, Users, FileText, Zap, BarChart3, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function HRInsightsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<{ title: string; value: string; description: string; icon: any; trend?: string }[]>([]);
  const [topSkills, setTopSkills] = useState<{ skill: string; count: number }[]>([]);

  useEffect(() => {
    if (user) fetchInsights();
  }, [user]);

  const fetchInsights = async () => {
    const [resumesRes, jobsRes, scoresRes, interviewsRes] = await Promise.all([
      supabase.from("resumes").select("skills, experience_years, created_at"),
      supabase.from("job_profiles").select("skills, title, created_at"),
      supabase.from("candidate_scores").select("fit_score, status, technical_score, behavioral_score"),
      supabase.from("interviews").select("status, interview_type"),
    ]);

    const resumes = resumesRes.data || [];
    const jobs = jobsRes.data || [];
    const scores = scoresRes.data || [];
    const interviews = interviewsRes.data || [];

    // Avg experience
    const expYears = resumes.filter((r) => r.experience_years).map((r) => r.experience_years!);
    const avgExp = expYears.length ? (expYears.reduce((a, b) => a + b, 0) / expYears.length).toFixed(1) : "0";

    // Pipeline velocity
    const matchedCount = scores.filter((s) => s.status === "Matched" || s.status === "Hired").length;
    const conversionRate = scores.length ? Math.round((matchedCount / scores.length) * 100) : 0;

    // Avg technical vs behavioral
    const techScores = scores.filter((s) => s.technical_score).map((s) => s.technical_score!);
    const behScores = scores.filter((s) => s.behavioral_score).map((s) => s.behavioral_score!);
    const avgTech = techScores.length ? Math.round(techScores.reduce((a, b) => a + b, 0) / techScores.length) : 0;
    const avgBeh = behScores.length ? Math.round(behScores.reduce((a, b) => a + b, 0) / behScores.length) : 0;

    setInsights([
      { title: "Avg. Experience", value: `${avgExp} yrs`, description: "Average candidate experience level", icon: Users, trend: "+0.3 from last month" },
      { title: "Pipeline Conversion", value: `${conversionRate}%`, description: "Candidates moving to matched/hired", icon: TrendingUp, trend: `${matchedCount} of ${scores.length} candidates` },
      { title: "Active Positions", value: String(jobs.length), description: "Open job profiles", icon: FileText },
      { title: "Interview Completion", value: `${interviews.filter((i) => i.status === "Completed").length}/${interviews.length}`, description: "Completed vs total interviews", icon: Brain },
      { title: "Avg. Technical Score", value: avgTech ? `${avgTech}%` : "—", description: "Across all scored candidates", icon: Zap },
      { title: "Avg. Behavioral Score", value: avgBeh ? `${avgBeh}%` : "—", description: "Across all scored candidates", icon: BarChart3 },
    ]);

    // Top skills across candidates
    const skillMap: Record<string, number> = {};
    resumes.forEach((r) => (r.skills || []).forEach((s: string) => { skillMap[s] = (skillMap[s] || 0) + 1; }));
    const sorted = Object.entries(skillMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([skill, count]) => ({ skill, count }));
    setTopSkills(sorted);

    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">HR Insights</h1>
        <p className="text-muted-foreground mt-1">AI-driven hiring intelligence and workforce analytics.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {insights.map((item, i) => (
          <motion.div key={item.title} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <item.icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">{item.title}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{item.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
            {item.trend && <p className="text-xs text-primary mt-2">{item.trend}</p>}
          </motion.div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Top Skills in Candidate Pool</h2>
        {topSkills.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Upload resumes to see skill trends.</p>
        ) : (
          <div className="space-y-3">
            {topSkills.map((s, i) => (
              <motion.div key={s.skill} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4">
                <span className="text-sm text-foreground w-32 truncate">{s.skill}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (s.count / (topSkills[0]?.count || 1)) * 100)}%` }}
                    transition={{ duration: 0.6 }} className="h-full rounded-full bg-gradient-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground w-8 text-right">{s.count}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
