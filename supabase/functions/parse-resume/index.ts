import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { resumeText, candidateName, fileBase64, fileMimeType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build user message content - support both text and file (PDF)
    const userContent: any[] = [];
    
    if (fileBase64 && fileMimeType) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:${fileMimeType};base64,${fileBase64}` },
      });
      userContent.push({
        type: "text",
        text: "Parse this resume document and extract key information.",
      });
    } else if (resumeText) {
      userContent.push({
        type: "text",
        text: `Parse this resume and extract key information:\n\n${resumeText}`,
      });
    } else {
      throw new Error("No resume content provided");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert resume parser. Extract structured information from resumes." },
          { role: "user", content: userContent },
        ],
        tools: [{
          type: "function",
          function: {
            name: "parse_resume",
            description: "Extract structured data from a resume",
            parameters: {
              type: "object",
              properties: {
                candidate_name: { type: "string" },
                candidate_email: { type: "string" },
                skills: { type: "array", items: { type: "string" } },
                experience_years: { type: "number" },
                education: { type: "string" },
                summary: { type: "string" },
              },
              required: ["candidate_name", "skills", "experience_years"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "parse_resume" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const parsed = toolCall ? JSON.parse(toolCall.function.arguments) : { candidate_name: candidateName || "Unknown", skills: [], experience_years: 0 };

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-resume error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
