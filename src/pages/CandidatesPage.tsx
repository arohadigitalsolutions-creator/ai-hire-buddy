import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, Search, Filter, Loader2, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Resume {
  id: string;
  candidate_name: string;
  candidate_email: string | null;
  skills: string[];
  experience_years: number | null;
  education: string | null;
  created_at: string;
}

interface CandidateScore {
  id: string;
  resume_id: string;
  fit_score: number;
  status: string;
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 90 ? "bg-success" : score >= 80 ? "bg-primary" : score >= 70 ? "bg-warning" : "bg-destructive";
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8 }} className={`h-full rounded-full ${color}`} />
      </div>
      <span className="text-sm font-semibold text-foreground w-8">{score}</span>
    </div>
  );
}

const statusStyles: Record<string, string> = {
  Interview: "bg-primary/10 text-primary",
  Screening: "bg-accent/10 text-accent",
  Matched: "bg-success/10 text-success",
};

export default function CandidatesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [scores, setScores] = useState<CandidateScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [resumeText, setResumeText] = useState("");

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const [resumeRes, scoreRes] = await Promise.all([
      supabase.from("resumes").select("*").order("created_at", { ascending: false }),
      supabase.from("candidate_scores").select("id, resume_id, fit_score, status"),
    ]);
    if (resumeRes.data) setResumes(resumeRes.data);
    if (scoreRes.data) setScores(scoreRes.data);
    setLoading(false);
  };

  const handleParseResume = async () => {
    if (!resumeText.trim() || !user) return;
    setUploading(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-resume", {
        body: { resumeText, candidateName: "" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const { error: insertErr } = await supabase.from("resumes").insert({
        user_id: user.id,
        candidate_name: data.candidate_name || "Unknown",
        candidate_email: data.candidate_email || null,
        skills: data.skills || [],
        experience_years: data.experience_years || null,
        education: data.education || null,
        parsed_json: data,
      });
      if (insertErr) throw insertErr;

      toast({ title: "Resume parsed and saved!" });
      setResumeText("");
      setShowUpload(false);
      fetchData();
    } catch (e: any) {
      toast({ title: "Failed to parse resume", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const getScore = (resumeId: string) => scores.find((s) => s.resume_id === resumeId);

  const filtered = resumes.filter((r) =>
    r.candidate_name.toLowerCase().includes(search.toLowerCase()) ||
    (r.skills || []).some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Candidates</h1>
          <p className="text-muted-foreground mt-1">Manage and score your candidate pipeline.</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="inline-flex h-10 px-5 items-center gap-2 rounded-lg bg-gradient-primary text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
          <Upload className="h-4 w-4" />
          Upload Resume
        </button>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="rounded-xl border border-border bg-card p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">Paste Resume Text</h2>
              <button onClick={() => setShowUpload(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste the candidate's resume text here..."
              className="w-full h-48 p-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <button onClick={handleParseResume} disabled={uploading || !resumeText.trim()}
              className="w-full h-10 mt-4 rounded-lg bg-gradient-primary text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {uploading ? "Parsing with AI..." : "Parse & Save"}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search candidates..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Upload className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No candidates yet. Upload a resume to get started.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Candidate</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Experience</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Skills</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Fit Score</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c, i) => {
                const score = getScore(c.id);
                return (
                  <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-secondary-foreground shrink-0">
                          {c.candidate_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{c.candidate_name}</div>
                          <div className="text-xs text-muted-foreground">{c.candidate_email || "No email"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{c.experience_years ? `${c.experience_years} years` : "N/A"}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1.5 flex-wrap">
                        {(c.skills || []).slice(0, 3).map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">{s}</span>
                        ))}
                        {(c.skills || []).length > 3 && <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">+{c.skills!.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4">{score ? <ScoreBar score={score.fit_score} /> : <span className="text-xs text-muted-foreground">Not scored</span>}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[score?.status || "Screening"] || "bg-muted text-muted-foreground"}`}>
                        {score?.status || "Screening"}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
