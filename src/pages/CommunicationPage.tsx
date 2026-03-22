import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Send, Clock, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface CommunicationLog {
  id: string;
  candidateName: string;
  email: string;
  type: string;
  sentAt: string;
}

export default function CommunicationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [messageType, setMessageType] = useState("Interview Invitation");
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchCandidates();
  }, [user]);

  const fetchCandidates = async () => {
    const { data } = await supabase.from("resumes").select("id, candidate_name, candidate_email").order("created_at", { ascending: false });
    setCandidates(data || []);
    setLoading(false);
  };

  const templates: Record<string, { text: string; templateName: string }> = {
    "Interview Invitation": { text: "We are pleased to invite you for an interview for the position. Please let us know your availability.", templateName: "interview-invitation" },
    "Status Update": { text: "We wanted to update you on the status of your application. We are currently reviewing your profile.", templateName: "status-update" },
    "Offer Letter": { text: "Congratulations! We are excited to extend an offer for the position. Please review the details.", templateName: "offer-letter" },
    "Rejection": { text: "Thank you for your interest. After careful review, we have decided to move forward with other candidates.", templateName: "rejection" },
  };

  const handleSend = async () => {
    if (!selectedCandidate) return;
    setSending(true);
    const candidate = candidates.find((c) => c.id === selectedCandidate);
    const candidateEmail = candidate?.candidate_email;
    const candidateName = candidate?.candidate_name || "Unknown";
    const tpl = templates[messageType];
    const message = customMessage || tpl.text;

    if (!candidateEmail) {
      toast({ title: "No email address", description: "This candidate doesn't have an email on file.", variant: "destructive" });
      setSending(false);
      return;
    }

    try {
      const idempotencyKey = `comm-${selectedCandidate}-${tpl.templateName}-${Date.now()}`;
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: tpl.templateName,
          recipientEmail: candidateEmail,
          idempotencyKey,
          templateData: { candidateName, message },
        },
      });

      if (error) throw error;

      const newLog: CommunicationLog = {
        id: crypto.randomUUID(),
        candidateName,
        email: candidateEmail,
        type: messageType,
        sentAt: new Date().toISOString(),
      };
      setLogs((prev) => [newLog, ...prev]);
      toast({ title: `Email sent to ${candidateName}`, description: `${messageType} sent to ${candidateEmail}` });
      setCustomMessage("");
    } catch (err: any) {
      toast({ title: "Failed to send", description: err?.message || "Something went wrong.", variant: "destructive" });
    }
    setSending(false);
  };

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Communication</h1>
        <p className="text-muted-foreground mt-1">Draft and track candidate communications.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-5">Compose Message</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Candidate</label>
              <select value={selectedCandidate} onChange={(e) => setSelectedCandidate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition">
                <option value="">Select candidate...</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>{c.candidate_name} ({c.candidate_email || "no email"})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Template</label>
              <select value={messageType} onChange={(e) => { setMessageType(e.target.value); setCustomMessage(templates[e.target.value] || ""); }}
                className="w-full h-10 px-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition">
                {Object.keys(templates).map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Message</label>
              <textarea value={customMessage || templates[messageType]}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full h-32 p-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            </div>
            <button onClick={handleSend} disabled={sending || !selectedCandidate}
              className="w-full h-11 rounded-lg bg-gradient-primary text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Sending..." : "Send Message"}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="p-5 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">Communication Log</h2>
          </div>
          <div className="divide-y divide-border">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Mail className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No messages sent yet.</p>
              </div>
            ) : logs.map((log) => (
              <motion.div key={log.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="px-5 py-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-success shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-foreground">{log.candidateName}</div>
                      <div className="text-xs text-muted-foreground">{log.type} · {log.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(log.sentAt).toLocaleTimeString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
