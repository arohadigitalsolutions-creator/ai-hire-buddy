import { useState, useEffect } from "react";
import { MessageSquare, Plus, Loader2, X, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Interview {
  id: string;
  candidate_name: string;
  role: string;
  interview_type: string;
  questions: any[];
  status: string;
  scheduled_date: string | null;
  created_at: string;
}

const statusStyles: Record<string, string> = {
  Scheduled: "bg-primary/10 text-primary",
  Pending: "bg-warning/10 text-warning",
  Completed: "bg-success/10 text-success",
};

export default function InterviewsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({ candidateName: "", role: "", interviewType: "Technical", numQuestions: "10" });

  useEffect(() => {
    if (user) fetchInterviews();
  }, [user]);

  const fetchInterviews = async () => {
    const { data } = await supabase.from("interviews").select("*").order("created_at", { ascending: false });
    if (data) setInterviews(data as Interview[]);
    setLoading(false);
  };

  const handleGenerate = async () => {
    if (!form.candidateName || !form.role || !user) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-interview", {
        body: { role: form.role, interviewType: form.interviewType, candidateName: form.candidateName, numQuestions: parseInt(form.numQuestions) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const { error: insertErr } = await supabase.from("interviews").insert({
        user_id: user.id,
        candidate_name: form.candidateName,
        role: form.role,
        interview_type: form.interviewType,
        questions: data.questions || [],
        status: "Pending",
      });
      if (insertErr) throw insertErr;

      toast({ title: "Interview questions generated!" });
      setShowNew(false);
      setForm({ candidateName: "", role: "", interviewType: "Technical", numQuestions: "10" });
      fetchInterviews();
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Interviews</h1>
          <p className="text-muted-foreground mt-1">Generate and manage interview question sets.</p>
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
              <h2 className="text-base font-semibold text-foreground">Generate Interview Questions</h2>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Type</label>
                  <select value={form.interviewType} onChange={(e) => setForm((p) => ({ ...p, interviewType: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>Technical</option>
                    <option>Behavioral</option>
                    <option>System Design</option>
                    <option>Culture Fit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Questions</label>
                  <select value={form.numQuestions} onChange={(e) => setForm((p) => ({ ...p, numQuestions: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                  </select>
                </div>
              </div>
              <button onClick={handleGenerate} disabled={generating || !form.candidateName || !form.role}
                className="w-full h-10 rounded-lg bg-gradient-primary text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                {generating ? "Generating..." : "Generate Questions"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : interviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-border bg-card">
          <MessageSquare className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No interviews yet. Click "New Interview" to generate AI-powered questions.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {interviews.map((interview) => (
            <div key={interview.id} className="rounded-xl border border-border bg-card hover:border-primary/20 transition-colors">
              <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === interview.id ? null : interview.id)}>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{interview.candidate_name}</div>
                    <div className="text-xs text-muted-foreground">{interview.role} · {interview.interview_type} · {(interview.questions || []).length} questions</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[interview.status] || "bg-muted text-muted-foreground"}`}>
                    {interview.status}
                  </span>
                  {expandedId === interview.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>
              {expandedId === interview.id && (interview.questions || []).length > 0 && (
                <div className="px-5 pb-5 border-t border-border pt-4">
                  <ol className="space-y-3">
                    {(interview.questions as any[]).map((q: any, i: number) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-xs font-semibold text-muted-foreground mt-0.5 shrink-0">{i + 1}.</span>
                        <div>
                          <p className="text-sm text-foreground">{q.question}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{q.category}</span>
                            <span className={`text-xs font-medium ${q.difficulty === "hard" ? "text-destructive" : q.difficulty === "medium" ? "text-warning" : "text-success"}`}>{q.difficulty}</span>
                          </div>
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
