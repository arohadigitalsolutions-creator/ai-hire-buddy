import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Send, Loader2, ArrowLeft, CheckCircle, AlertTriangle,
  BarChart3, Shield, Brain, Award, FileText, ChevronDown, ChevronUp,
  Mic, MicOff, Volume2, VolumeX,
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

// ─── Speech Recognition Hook ───
function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let final = "";
        let interim = "";
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript + " ";
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setTranscript((prev) => prev + final);
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error !== "no-speech") {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // Auto-restart if still supposed to be listening
        if (recognitionRef.current?._shouldListen) {
          try { recognition.start(); } catch {}
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      setTranscript("");
      setInterimTranscript("");
      recognitionRef.current._shouldListen = true;
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {}
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current._shouldListen = false;
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimTranscript("");
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return { isListening, transcript, interimTranscript, isSupported, startListening, stopListening, resetTranscript };
}

// ─── Speech Synthesis Helper ───
function speakText(text: string, onEnd?: () => void): SpeechSynthesisUtterance | null {
  if (!window.speechSynthesis) return null;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Try to pick a natural English voice
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha"))
  ) || voices.find((v) => v.lang.startsWith("en"));
  if (preferred) utterance.voice = preferred;

  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
  return utterance;
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const {
    isListening, transcript, interimTranscript, isSupported,
    startListening, stopListening, resetTranscript,
  } = useSpeechRecognition();

  // Load voices (some browsers load them async)
  useEffect(() => {
    window.speechSynthesis?.getVoices();
    const handleVoices = () => window.speechSynthesis?.getVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged", handleVoices);
    return () => window.speechSynthesis?.removeEventListener?.("voiceschanged", handleVoices);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sync transcript into answer field
  useEffect(() => {
    if (transcript || interimTranscript) {
      setAnswer(transcript + interimTranscript);
    }
  }, [transcript, interimTranscript]);

  // Speak interviewer questions aloud
  const speakQuestion = useCallback((text: string) => {
    if (!voiceEnabled) return;
    setIsSpeaking(true);
    speakText(text, () => {
      setIsSpeaking(false);
      // Auto-start listening after question is spoken
      if (isSupported) {
        resetTranscript();
        startListening();
      }
    });
  }, [voiceEnabled, isSupported, resetTranscript, startListening]);

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

      const firstQ = data.first_question.question;
      setMessages([
        { role: "system", content: `Interview started for ${candidateName} — ${role}. Resume match: ${data.plan.skill_matching.resume_skill_match_score}%` },
        { role: "interviewer", content: firstQ },
      ]);

      // Speak the first question
      setTimeout(() => speakQuestion(firstQ), 500);
    } catch (e: any) {
      toast({ title: "Failed to start interview", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    const finalAnswer = (transcript + interimTranscript).trim() || answer.trim();
    if (!finalAnswer || loading) return;

    // Stop listening if active
    if (isListening) stopListening();
    resetTranscript();

    setAnswer("");
    setMessages((prev) => [...prev, { role: "candidate", content: finalAnswer }]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("conduct-interview", {
        body: { action: "answer", interviewId, answer: finalAnswer, questionIndex },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

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
        const nextQ = data.next_question.question;
        setMessages((prev) => [...prev, { role: "interviewer", content: nextQ }]);
        // Speak next question
        setTimeout(() => speakQuestion(nextQ), 300);
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

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      setAnswer("");
      startListening();
    }
  };

  const toggleVoice = () => {
    if (isSpeaking) window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setVoiceEnabled(!voiceEnabled);
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
          <h1 className="text-2xl font-bold text-foreground">Start AI Voice Interview</h1>
          <p className="text-muted-foreground mt-1">Provide the job description and candidate resume. The interview will be conducted via voice.</p>
        </div>

        {/* Voice capability notice */}
        <div className="mb-6 p-4 rounded-xl border border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mic className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Voice-Based Interview</p>
              <p className="text-xs text-muted-foreground">
                {isSupported
                  ? "Questions will be read aloud. Speak your answers using the microphone. You can also type."
                  : "Speech recognition not supported in this browser. You can type answers instead. Use Chrome or Edge for voice."
                }
              </p>
            </div>
          </div>
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
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />}
          {loading ? "Analyzing & Generating Questions..." : "Start Voice Interview"}
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
        <div className="flex items-center gap-3">
          {/* Voice toggle */}
          <button
            onClick={toggleVoice}
            className={`p-2 rounded-lg transition-colors ${voiceEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
            title={voiceEnabled ? "Mute interviewer voice" : "Enable interviewer voice"}
          >
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
              style={{ width: `${totalQuestions > 0 ? ((questionIndex + 1) / totalQuestions) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{totalQuestions > 0 ? Math.round(((questionIndex + 1) / totalQuestions) * 100) : 0}%</span>
        </div>
      </div>

      {/* Speaking indicator */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 py-2 bg-primary/5 border-b border-primary/10 flex items-center gap-2"
          >
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-primary rounded-full"
                  animate={{ height: [4, 16, 4] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                />
              ))}
            </div>
            <span className="text-xs font-medium text-primary">AI Interviewer is speaking...</span>
          </motion.div>
        )}
      </AnimatePresence>

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
                    <Volume2 className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
                {msg.role === "candidate" && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <Mic className="h-3 w-3 text-primary-foreground/70" />
                    <span className="text-xs font-medium text-primary-foreground/70">Spoken Answer</span>
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
          {/* Listening indicator */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mb-3 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-destructive/5 border border-destructive/20"
              >
                <div className="relative">
                  <Mic className="h-5 w-5 text-destructive" />
                  <motion.div
                    className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-destructive"
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-destructive">Listening... Speak your answer</p>
                  {(transcript || interimTranscript) && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {transcript}<span className="text-muted-foreground/50">{interimTranscript}</span>
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3 max-w-4xl mx-auto">
            {/* Mic button */}
            {isSupported && (
              <button
                onClick={toggleMic}
                disabled={loading || isSpeaking}
                className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  isListening
                    ? "bg-destructive text-destructive-foreground animate-pulse"
                    : "bg-muted hover:bg-muted/80 text-foreground"
                } disabled:opacity-50`}
                title={isListening ? "Stop recording" : "Start recording"}
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
            )}

            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitAnswer(); } }}
              placeholder={isListening ? "Listening... or type here" : "Click mic to speak or type your answer..."}
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
          <p className="text-center text-xs text-muted-foreground mt-2">
            {isSupported ? "🎙️ Click the mic to speak, or type your answer. Press Enter to submit." : "Type your answer and press Enter to submit."}
          </p>
        </div>
      )}
    </div>
  );
}
