import { useState, useEffect } from "react";
import { MessageSquare, Plus, Loader2, X, ChevronDown, ChevronUp, Brain, Play, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AIInterviewSession from "@/components/AIInterviewSession";

interface Interview {
  id: string;
  candidate_name: string;
  role: string;
  interview_type: string;
  questions: any[];
  status: string;
  scheduled_date: string | null;
  created_at: string;
  resume_skill_match: number;
  interview_score: number;
  final_fit_score: number;
  confidence_score: number;
  suspicion_level: string;
  report: any;
}

const statusStyles: Record<string, string> = {
  Scheduled: "bg-primary/10 text-primary",
  Pending: "bg-yellow-500/10 text-yellow-400",
  "In Progress": "bg-blue-500/10 text-blue-400",
  Evaluating: "bg-purple-500/10 text-purple-400",
  Completed: "bg-emerald-500/10 text-emerald-400",
};

export default function InterviewsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<Interview | null>(null);
  const [form, setForm] = useState({ candidateName: "", role: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user) fetchInterviews();
  }, [user]);

  const fetchInterviews = async () => {
    const { data } = await supabase.from("interviews").select("*").order("created_at", { ascending: false });
    if (data) setInterviews(data as unknown as Interview[]);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.candidateName || !form.role || !user) return;
    setCreating(true);
    try {
      const { data, error } = await supabase.from("interviews").insert({
        user_id: user.id,
        candidate_name: form.candidateName,
        role: form.role,
        interview_type: "AI Interview",
        status: "Pending",
        questions: [],
      }).select().single();
      if (error) throw error;

      setShowNew(false);
      setForm({ candidateName: "", role: "" });
      toast({ title: "Interview created" });
      setActiveSession(data as unknown as Interview);
    } catch (e: any) {
      toast({ title: "Failed to create", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from("interviews").delete().eq("id", id);
    if (!error) {
      setInterviews((prev) => prev.filter((i) => i.id !== id));
      toast({ title: "Interview deleted" });
    }
  };

  const getRecommendationBadge = (report: any) => {
    if (!report?.hiring_recommendation) return null;
    const rec = report.hiring_recommendation;
    const colors: Record<string, string> = {
      "Strong Hire": "bg-emerald-500/10 text-emerald-400",
      "Hire": "bg-green-500/10 text-green-400",
      "Borderline": "bg-yellow-500/10 text-yellow-400",
      "No Hire": "bg-destructive/10 text-destructive",
    };
    return (
      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[rec] || "bg-muted text-muted-foreground"}`}>
        {rec}
      </span>
    );
  };

  // Active interview session
  if (activeSession) {
    return (
      <AIInterviewSession
        interviewId={activeSession.id}
        candidateName={activeSession.candidate_name}
        role={activeSession.role}
        onBack={() => { setActiveSession(null); fetchInterviews(); }}
        onComplete={() => fetchInterviews()}
      />
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Interviews</h1>
          <p className="text-muted-foreground mt-1">Conduct AI-powered technical screening interviews with detailed evaluation.</p>
        </div>
        <button onClick={() => setShowNew(true)} className="inline-flex h-10 px-5 items-center gap-2 rounded-lg bg-gradient-primary text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> New Interview
        </button>
      </div>

      {/* New Interview Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="rounded-xl border border-border bg-card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">New AI Interview</h2>
              <button onClick={() => setShowNew(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Candidate Name</label>
                <input type="text" value={form.candidateName} onChange={(e) => setForm((p) => ({ ...p, candidateName: e.target.value }))}
                  placeholder="e.g. Sarah Chen" className="w-full h-10 px-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Role</label>
                <input type="text" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  placeholder="e.g. Sr. Frontend Engineer" className="w-full h-10 px-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <p className="text-xs text-muted-foreground">You'll provide the Job Description and Resume in the next step.</p>
              <button onClick={handleCreate} disabled={creating || !form.candidateName || !form.role}
                className="w-full h-10 rounded-lg bg-gradient-primary text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                {creating ? "Creating..." : "Create & Start Interview"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : interviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-border bg-card">
          <Brain className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No interviews yet. Click "New Interview" to start an AI-powered screening.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {interviews.map((interview) => (
            <div key={interview.id} className="rounded-xl border border-border bg-card hover:border-primary/20 transition-colors">
              <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === interview.id ? null : interview.id)}>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{interview.candidate_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {interview.role} · {(interview.questions || []).length} questions
                      {interview.final_fit_score > 0 && ` · Fit: ${interview.final_fit_score}%`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getRecommendationBadge(interview.report)}
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[interview.status] || "bg-muted text-muted-foreground"}`}>
                    {interview.status}
                  </span>
                  {(interview.status === "Pending" || interview.status === "In Progress") && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveSession(interview); }}
                      className="h-8 px-3 rounded-lg bg-primary/10 text-primary text-xs font-medium flex items-center gap-1.5 hover:bg-primary/20 transition-colors"
                    >
                      <Play className="h-3.5 w-3.5" /> {interview.status === "Pending" ? "Start" : "Resume"}
                    </button>
                  )}
                  {interview.status === "Completed" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveSession(interview); }}
                      className="h-8 px-3 rounded-lg bg-accent/10 text-accent text-xs font-medium flex items-center gap-1.5 hover:bg-accent/20 transition-colors"
                    >
                      View Report
                    </button>
                  )}
                  <button onClick={(e) => handleDelete(interview.id, e)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {expandedId === interview.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>
              {expandedId === interview.id && (interview.questions || []).length > 0 && (
                <div className="px-5 pb-5 border-t border-border pt-4">
                  <ol className="space-y-3">
                    {(interview.questions as any[]).map((q: any, i: number) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-xs font-semibold text-muted-foreground mt-0.5 shrink-0">{i + 1}.</span>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">{q.question}</p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-muted-foreground">{q.category}</span>
                            <span className={`text-xs font-medium ${
                              q.difficulty === "advanced" ? "text-destructive" :
                              q.difficulty === "intermediate" ? "text-yellow-400" : "text-emerald-400"
                            }`}>{q.difficulty}</span>
                            {q.evaluation && (
                              <span className="text-xs font-medium text-primary">Score: {q.evaluation.question_score}/10</span>
                            )}
                            {q.is_follow_up && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">Follow-up</span>
                            )}
                          </div>
                          {q.answer && (
                            <p className="text-xs text-muted-foreground mt-1.5 bg-muted/30 rounded-lg px-3 py-2 line-clamp-2">{q.answer}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
