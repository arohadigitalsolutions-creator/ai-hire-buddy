import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, department, location, experience, skills, employmentType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `Generate a professional, well-structured job description in markdown format for:
Title: ${title || "Not specified"}
Department: ${department || "Not specified"}
Location: ${location || "Not specified"}
Experience Required: ${experience || "Not specified"}
Key Skills: ${(skills || []).join(", ") || "Not specified"}
Employment Type: ${employmentType || "Full-time"}

IMPORTANT: Tailor the job description specifically to this role's industry and domain. Do NOT default to technology/engineering language unless the role is actually a tech role. For example:
- A Marketing Manager JD should focus on marketing strategy, campaigns, brand management
- An HR Director JD should focus on talent strategy, employee engagement, compliance
- A Sales Executive JD should focus on revenue targets, client relationships, pipeline
- A Finance Analyst JD should focus on financial modeling, reporting, budgeting

Include sections: About the Role, Key Responsibilities (5-7 bullets), Requirements (5-6 bullets), Nice to Have (3-4 bullets), and What We Offer (4-5 bullets). Make it compelling, professional, and domain-appropriate.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert HR recruiter with deep knowledge across all industries — technology, marketing, sales, finance, healthcare, education, operations, HR, design, legal, and more. Generate professional, domain-specific job descriptions in clean markdown. Always match the tone, terminology, and requirements to the specific role and industry." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const jdText = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ jd_text: jdText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-jd error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
