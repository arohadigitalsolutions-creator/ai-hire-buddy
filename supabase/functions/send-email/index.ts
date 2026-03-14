import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { to, subject, body, candidateName, testMode } = await req.json();

    // In test mode, redirect all emails to the Resend account owner's email
    const RESEND_ACCOUNT_EMAIL = "priyamcop@gmail.com";
    const actualRecipient = testMode ? RESEND_ACCOUNT_EMAIL : to;

    if (!to || !subject || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const testLabel = testMode ? `\n<p style="background: #fff3cd; padding: 8px 12px; border-radius: 4px; font-size: 12px; color: #856404;"><strong>⚠️ TEST MODE:</strong> Originally intended for <strong>${to}</strong></p>` : "";

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        ${testLabel}
        <p>Dear ${candidateName || "Candidate"},</p>
        <div style="white-space: pre-wrap; line-height: 1.6;">${body}</div>
        <br/>
        <p style="color: #666; font-size: 12px;">This email was sent via TalentFlowAI HR Platform.</p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "TalentFlowAI <onboarding@resend.dev>",
        to: [actualRecipient],
        subject: testMode ? `[TEST] ${subject}` : subject,
        html: htmlBody,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", data);
      return new Response(
        JSON.stringify({ error: data.message || "Failed to send email", details: data }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
