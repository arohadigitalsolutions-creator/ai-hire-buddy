import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Mail, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Check your email for a reset link!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-hero" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">RecruitAI</span>
        </Link>
        <div className="rounded-xl border border-border bg-card p-8">
          <h1 className="text-xl font-bold text-foreground text-center mb-2">Reset your password</h1>
          {sent ? (
            <p className="text-sm text-muted-foreground text-center">We've sent a reset link to <strong className="text-foreground">{email}</strong>. Check your inbox.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full h-11 pl-10 pr-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition" />
              </div>
              <button type="submit" disabled={loading} className="w-full h-11 rounded-lg bg-gradient-primary text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Link"}
              </button>
            </form>
          )}
          <Link to="/auth" className="flex items-center gap-1 justify-center mt-6 text-sm text-primary hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
