import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, MailX } from "lucide-react";

export default function UnsubscribePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "valid" | "already" | "invalid" | "success" | "error">("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`;
      const res = await fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } });
      const data = await res.json();
      if (data.valid === false && data.reason === "already_unsubscribed") setStatus("already");
      else if (data.valid) setStatus("valid");
      else setStatus("invalid");
    } catch { setStatus("error"); }
  };

  const handleUnsubscribe = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
      if (error) throw error;
      if (data?.success) setStatus("success");
      else if (data?.reason === "already_unsubscribed") setStatus("already");
      else setStatus("error");
    } catch { setStatus("error"); }
    setProcessing(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full rounded-xl border border-border bg-card p-8 text-center">
        {status === "loading" && <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />}
        {status === "valid" && (
          <>
            <MailX className="h-10 w-10 text-primary mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">Unsubscribe</h1>
            <p className="text-sm text-muted-foreground mb-6">Are you sure you want to unsubscribe from future emails?</p>
            <button onClick={handleUnsubscribe} disabled={processing}
              className="w-full h-11 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mx-auto">
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {processing ? "Processing..." : "Confirm Unsubscribe"}
            </button>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">Unsubscribed</h1>
            <p className="text-sm text-muted-foreground">You have been successfully unsubscribed.</p>
          </>
        )}
        {status === "already" && (
          <>
            <CheckCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">Already Unsubscribed</h1>
            <p className="text-sm text-muted-foreground">You are already unsubscribed from our emails.</p>
          </>
        )}
        {(status === "invalid" || status === "error") && (
          <>
            <XCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">Invalid Link</h1>
            <p className="text-sm text-muted-foreground">This unsubscribe link is invalid or has expired.</p>
          </>
        )}
      </div>
    </div>
  );
}
