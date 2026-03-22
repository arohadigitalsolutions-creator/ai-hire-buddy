import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Send, Loader2, ArrowLeft, CheckCircle, AlertTriangle,
  BarChart3, Shield, Brain, Award, FileText, ChevronDown, ChevronUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  interviewId: string;
  candidateName: string;
  role: string;
  onBack: () => void;
  onComplete: () => void;
}

interface Message {
  role: "interviewer" | "candidate" | "system";
  content: string;
  evaluation?: any;
}

export default function AIInterviewSession({ interviewId, candidateName, role, onBack, onComplete }: Props) {
  const { toast } = useToast();
  const [phase, setPhase] = useState<"setup" | "interview" | "evaluating" | "report">("setup");
  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [report, setReport] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [showSkillMatch, setShowSkillMatch] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startInterview = async () => {
    if (!jdText.trim() || !resumeText.trim()) {
      toast({ title: "Please provide both JD and resume", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("conduct-interview", {
        body: { action: "start", interviewId, jdText, resumeText },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setPlan(data.plan);
      setTotalQuestions(data.total_questions);
      setQuestionIndex(0);
      setPhase("interview");
      setMessages([
        { role: "system", content: `Interview started for ${candidateName} — ${role}. Resume match: ${data.plan.skill_matching.resume_skill_match_score}%` },
        { role: "interviewer", content: data.first_question.question },
      ]);
    } catch (e: any) {
      toast({ title: "Failed to start interview", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim() || loading) return;
    const currentAnswer = answer;
    setAnswer("");
    setMessages((prev) => [...prev, { role: "candidate", content: currentAnswer }]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("conduct-interview", {
        body: { action: "answer", interviewId, answer: currentAnswer, questionIndex },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Add evaluation feedback (hidden scores, just acknowledgment)
      const evalMsg: Message = {
        role: "system",
        content: `Answer recorded (Q${data.question_number}/${data.total_questions})`,
        evaluation: data.evaluation,
      };
      setMessages((prev) => [...prev, evalMsg]);
      setTotalQuestions(data.total_questions);

      if (data.is_complete) {
        setPhase("evaluating");
        setMessages((prev) => [...prev, { role: "system", content: "All questions answered. Generating evaluation report..." }]);
        await generateReport();
      } else if (data.next_question) {
        setQuestionIndex(questionIndex + 1);
        setMessages((prev) => [...prev, { role: "interviewer", content: data.next_question.question }]);
      }
    } catch (e: any) {
      toast({ title: "Error processing answer", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("conduct-interview", {
        body: { action: "report", interviewId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setReport(data);
      setPhase("report");
      onComplete();
    } catch (e: any) {
      toast({ title: "Report generation failed", description: e.message, variant: "destructive" });
      setPhase("interview");
    }
  };

  const getRecommendationColor = (rec: string) => {
    if (rec === "Strong Hire") return "text-emerald-400";
    if (rec === "Hire") return "text-green-400";
    if (rec === "Borderline") return "text-yellow-400";
    return "text-destructive";
  };

  const getSuspicionColor = (level: string) => {
    if (level === "low") return "text-emerald-400";
    if (level === "medium") return "text-yellow-400";
    return "text-destructive";
  };

  // ─── SETUP PHASE ───
  if (phase === "setup") {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Interviews
        </button>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Start AI Interview</h1>
          <p className="text-muted-foreground mt-1">Provide the job description and candidate resume to begin.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Job Description</label>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the full job description here..."
              className="w-full h-64 px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Candidate Resume</label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste the candidate's resume text here..."
              className="w-full h-64 px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>
        <div className="mt-4 p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{candidateName}</p>
              <p className="text-xs text-muted-foreground">{role}</p>
            </div>
          </div>
        </div>
        <button
          onClick={startInterview}
          disabled={loading || !jdText.trim() || !resumeText.trim()}
          className="mt-6 w-full h-12 rounded-xl bg-gradient-primary text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageSquare className="h-5 w-5" />}
          {loading ? "Analyzing & Generating Questions..." : "Start Interview"}
        </button>
      </div>
    );
  }

  // ─── REPORT PHASE ───
  if (phase === "report" && report) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Interviews
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Interview Report</h1>
          <p className="text-muted-foreground mt-1">{candidateName} — {role}</p>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Resume Match", value: `${report.resume_skill_match}%`, icon: FileText, color: "text-primary" },
            { label: "Interview Score", value: `${report.interview_score}%`, icon: BarChart3, color: "text-accent" },
            { label: "Final Fit", value: `${report.final_fit_score}%`, icon: Award, color: "text-primary" },
            { label: "Confidence", value: `${report.confidence_score}%`, icon: Brain, color: "text-accent" },
          ].map((card) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card p-4 text-center">
              <card.icon className={`h-5 w-5 mx-auto mb-2 ${card.color}`} />
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Recommendation */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Hiring Recommendation</h2>
            <span className={`text-lg font-bold ${getRecommendationColor(report.hiring_recommendation)}`}>
              {report.hiring_recommendation}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Shield className={`h-4 w-4 ${getSuspicionColor(report.suspicion_level)}`} />
            <span className={`text-sm font-medium ${getSuspicionColor(report.suspicion_level)}`}>
              Suspicion Level: {report.suspicion_level}
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{report.recruiter_summary}</p>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" /> Strengths
            </h3>
            <ul className="space-y-2">
              {(report.strengths || []).map((s: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">•</span> {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" /> Weaknesses
            </h3>
            <ul className="space-y-2">
              {(report.weaknesses || []).map((w: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span> {w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Missing Skills */}
        {report.missing_skills?.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5 mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Missing Skills</h3>
            <div className="flex flex-wrap gap-2">
              {report.missing_skills.map((s: string, i: number) => (
                <span key={i} className="px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Skill Matching from plan */}
        {plan?.skill_matching && (
          <div className="rounded-xl border border-border bg-card p-5">
            <button onClick={() => setShowSkillMatch(!showSkillMatch)} className="flex items-center justify-between w-full">
              <h3 className="text-sm font-semibold text-foreground">Skill Match Breakdown</h3>
              {showSkillMatch ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {showSkillMatch && (
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Matching Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.skill_matching.matching_skills?.map((s: string, i: number) => (
                      <span key={i} className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Missing Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.skill_matching.missing_skills?.map((s: string, i: number) => (
                      <span key={i} className="px-2.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs">{s}</span>
                    ))}
                  </div>
                </div>
                {plan.skill_matching.partially_matching?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Partially Matching</p>
                    <div className="flex flex-wrap gap-1.5">
                      {plan.skill_matching.partially_matching.map((s: string, i: number) => (
                        <span key={i} className="px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-xs">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── INTERVIEW / EVALUATING PHASE ───
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-foreground">{candidateName}</h2>
            <p className="text-xs text-muted-foreground">{role} · Q{Math.min(questionIndex + 1, totalQuestions)}/{totalQuestions}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
              style={{ width: `${totalQuestions > 0 ? ((questionIndex + 1) / totalQuestions) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{totalQuestions > 0 ? Math.round(((questionIndex + 1) / totalQuestions) * 100) : 0}%</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "candidate" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "interviewer"
                  ? "bg-card border border-border text-foreground"
                  : msg.role === "candidate"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground text-xs text-center rounded-lg max-w-full"
              }`}>
                {msg.role === "interviewer" && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <Brain className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium text-primary">AI Interviewer</span>
                  </div>
                )}
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                {phase === "evaluating" ? "Generating report..." : "Evaluating..."}
              </span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      {phase === "interview" && (
        <div className="px-6 py-4 border-t border-border bg-card">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitAnswer(); } }}
              placeholder="Type your answer... (Shift+Enter for new line)"
              disabled={loading}
              className="flex-1 min-h-[48px] max-h-32 px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-50"
              rows={2}
            />
            <button
              onClick={submitAnswer}
              disabled={loading || !answer.trim()}
              className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
