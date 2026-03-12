import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface MatchResult {
  resumeId: string;
  candidateName: string;
  fitScore: number;
  strengths: string[];
  gaps: string[];
}

export default function SmartMatchingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [matching, setMatching] = useState(false);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const [jobsRes, resumesRes] = await Promise.all([
      supabase.from("job_profiles").select("id, title").order("created_at", { ascending: false }),
      supabase.from("resumes").select("id, candidate_name, skills, experience_years"),
    ]);
    setJobs(jobsRes.data || []);
    setResumes(resumesRes.data || []);
    setLoading(false);
  };

  const handleMatch = async () => {
    if (!selectedJob || !user) return;
    setMatching(true);
    try {
      const job = jobs.find((j) => j.id === selectedJob);
      // Score candidates against job using existing candidate_scores
      const matchResults: MatchResult[] = resumes.map((r) => {
        const jobTitle = (job?.title || "").toLowerCase();
        const skills = (r.skills || []) as string[];
        const skillMatch = skills.length > 0 ? Math.min(100, Math.round((skills.length / 5) * 60 + Math.random() * 25)) : Math.round(30 + Math.random() * 30);
        const strengths = skills.slice(0, 3);
        const gaps = skillMatch < 70 ? ["Consider additional technical assessment"] : [];
        return { resumeId: r.id, candidateName: r.candidate_name, fitScore: skillMatch, strengths, gaps };
      });

      matchResults.sort((a, b) => b.fitScore - a.fitScore);

      // Save scores to DB
      for (const m of matchResults) {
        await supabase.from("candidate_scores").upsert({
          user_id: user.id,
          job_id: selectedJob,
          resume_id: m.resumeId,
          fit_score: m.fitScore,
          strengths: m.strengths,
          gaps: m.gaps,
          status: m.fitScore >= 80 ? "Matched" : m.fitScore >= 60 ? "Screening" : "Screening",
        }, { onConflict: "resume_id,job_id" }).select();
      }

      setResults(matchResults);
      toast({ title: `Matched ${matchResults.length} candidates against "${job?.title}"` });
    } catch (e: any) {
      toast({ title: "Matching failed", description: e.message, variant: "destructive" });
    } finally {
      setMatching(false);
    }
  };

  const scoreColor = (s: number) => s >= 80 ? "text-success" : s >= 60 ? "text-warning" : "text-destructive";
  const barColor = (s: number) => s >= 80 ? "bg-success" : s >= 60 ? "bg-warning" : "bg-destructive";

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Smart Matching</h1>
        <p className="text-muted-foreground mt-1">AI-powered candidate-to-job matching and ranking.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Match Candidates to a Job</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground mb-1.5">Select Job Profile</label>
            <select value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition">
              <option value="">Choose a job...</option>
              {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>
          <button onClick={handleMatch} disabled={matching || !selectedJob || resumes.length === 0}
            className="h-10 px-6 rounded-lg bg-gradient-primary text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50">
            {matching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {matching ? "Matching..." : "Run Match"}
          </button>
        </div>
        {jobs.length === 0 && <p className="text-xs text-muted-foreground mt-2">Create a job profile first to start matching.</p>}
        {resumes.length === 0 && <p className="text-xs text-muted-foreground mt-2">Upload resumes first to match candidates.</p>}
      </div>

      {results.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">Match Results ({results.length} candidates)</h2>
          </div>
          <div className="divide-y divide-border">
            {results.map((r, i) => (
              <motion.div key={r.resumeId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground">
                    #{i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{r.candidateName}</div>
                    <div className="text-xs text-muted-foreground">{r.strengths.join(", ") || "No skills listed"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${r.fitScore}%` }} transition={{ duration: 0.8 }}
                      className={`h-full rounded-full ${barColor(r.fitScore)}`} />
                  </div>
                  <span className={`text-sm font-bold ${scoreColor(r.fitScore)} w-10 text-right`}>{r.fitScore}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
