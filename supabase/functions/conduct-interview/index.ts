import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAI(apiKey: string, messages: any[], tools?: any[], toolChoice?: any) {
  const body: any = { model: "google/gemini-2.5-flash", messages };
  if (tools) { body.tools = tools; body.tool_choice = toolChoice; }

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    if (res.status === 429) throw { status: 429, message: "Rate limit exceeded." };
    if (res.status === 402) throw { status: 402, message: "AI credits exhausted." };
    throw new Error(`AI gateway error: ${res.status}`);
  }

  const data = await res.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall) return JSON.parse(toolCall.function.arguments);
  return { text: data.choices?.[0]?.message?.content || "" };
}

// ─── ACTION: START ───
async function handleStart(apiKey: string, jdText: string, resumeText: string) {
  const systemPrompt = `You are an expert AI interviewer conducting a first-round technical screening.

TASK: Analyze the Job Description and Candidate Resume, then generate a structured interview plan.

Job Description:
${jdText}

Candidate Resume:
${resumeText}

Generate exactly 8-10 interview questions following this distribution:
- 1 question about candidate background
- 3 questions about required technical skills from the JD
- 2 questions probing skills missing from resume but required in JD
- 2 problem solving or system design questions
- 1 behavioral/teamwork question

For each question, specify the category, difficulty level, and what skill/area it targets.
Also analyze the resume against JD requirements and calculate a skill match score.`;

  const result = await callAI(apiKey, [
    { role: "system", content: "You are an expert technical interviewer and recruiter." },
    { role: "user", content: systemPrompt },
  ], [{
    type: "function",
    function: {
      name: "create_interview_plan",
      description: "Create structured interview plan with questions and skill analysis",
      parameters: {
        type: "object",
        properties: {
          jd_analysis: {
            type: "object",
            properties: {
              role_title: { type: "string" },
              required_skills: { type: "array", items: { type: "string" } },
              preferred_skills: { type: "array", items: { type: "string" } },
              experience_level: { type: "string" },
              key_responsibilities: { type: "array", items: { type: "string" } },
              core_competencies: { type: "array", items: { type: "string" } },
            },
            required: ["role_title", "required_skills", "experience_level"],
          },
          resume_analysis: {
            type: "object",
            properties: {
              skills: { type: "array", items: { type: "string" } },
              experience_summary: { type: "string" },
              education: { type: "string" },
              projects: { type: "array", items: { type: "string" } },
            },
            required: ["skills"],
          },
          skill_matching: {
            type: "object",
            properties: {
              matching_skills: { type: "array", items: { type: "string" } },
              missing_skills: { type: "array", items: { type: "string" } },
              partially_matching: { type: "array", items: { type: "string" } },
              resume_skill_match_score: { type: "integer" },
            },
            required: ["matching_skills", "missing_skills", "resume_skill_match_score"],
          },
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                category: { type: "string", enum: ["background", "technical", "missing_skill", "problem_solving", "behavioral"] },
                difficulty: { type: "string", enum: ["basic", "intermediate", "advanced"] },
                target_skill: { type: "string" },
                follow_up: { type: "string" },
              },
              required: ["question", "category", "difficulty", "target_skill"],
            },
          },
        },
        required: ["jd_analysis", "resume_analysis", "skill_matching", "questions"],
        additionalProperties: false,
      },
    },
  }], { type: "function", function: { name: "create_interview_plan" } });

  return result;
}

// ─── ACTION: EVALUATE ANSWER ───
async function handleAnswer(
  apiKey: string, jdText: string, resumeText: string,
  question: any, answer: string, previousScores: number[], questionIndex: number
) {
  const avgPrevScore = previousScores.length > 0
    ? previousScores.reduce((a, b) => a + b, 0) / previousScores.length
    : 5;

  const result = await callAI(apiKey, [
    { role: "system", content: `You are an expert technical interviewer evaluating a candidate's answer.

Context:
- Job Description: ${jdText.substring(0, 500)}...
- Question category: ${question.category}
- Target skill: ${question.target_skill}
- Difficulty: ${question.difficulty}
- Average score so far: ${avgPrevScore.toFixed(1)}
- This is question ${questionIndex + 1}

Evaluate the answer thoroughly. Check for signs of AI-generated or copy-pasted responses.` },
    { role: "user", content: `Question: ${question.question}\n\nCandidate's Answer: ${answer}\n\nEvaluate this response.` },
  ], [{
    type: "function",
    function: {
      name: "evaluate_answer",
      description: "Evaluate the candidate's answer",
      parameters: {
        type: "object",
        properties: {
          technical_accuracy: { type: "integer", description: "0-10" },
          depth_of_knowledge: { type: "integer", description: "0-10" },
          relevance: { type: "integer", description: "0-10" },
          communication_clarity: { type: "integer", description: "0-10" },
          question_score: { type: "number", description: "Average of above metrics" },
          confidence_indicators: {
            type: "object",
            properties: {
              clarity: { type: "integer", description: "0-10" },
              completeness: { type: "integer", description: "0-10" },
              terminology_usage: { type: "integer", description: "0-10" },
              logical_reasoning: { type: "integer", description: "0-10" },
            },
            required: ["clarity", "completeness", "terminology_usage", "logical_reasoning"],
          },
          suspicion_flags: {
            type: "object",
            properties: {
              is_generic: { type: "boolean" },
              is_copy_paste: { type: "boolean" },
              is_overly_long: { type: "boolean" },
              is_unrelated_to_experience: { type: "boolean" },
              suspicion_level: { type: "string", enum: ["low", "medium", "high"] },
            },
            required: ["suspicion_level"],
          },
          needs_follow_up: { type: "boolean", description: "True if answer was weak/vague" },
          follow_up_question: { type: "string", description: "Deeper follow-up if needed" },
          difficulty_adjustment: { type: "string", enum: ["increase", "maintain", "decrease"] },
          brief_feedback: { type: "string", description: "Internal note for report, not shown to candidate" },
        },
        required: ["technical_accuracy", "depth_of_knowledge", "relevance", "communication_clarity", "question_score", "confidence_indicators", "suspicion_flags", "needs_follow_up", "difficulty_adjustment", "brief_feedback"],
        additionalProperties: false,
      },
    },
  }], { type: "function", function: { name: "evaluate_answer" } });

  return result;
}

// ─── ACTION: GENERATE REPORT ───
async function handleReport(
  apiKey: string, jdText: string, resumeText: string,
  questions: any[], resumeSkillMatch: number
) {
  const questionSummary = questions.map((q: any, i: number) => {
    const e = q.evaluation || {};
    return `Q${i + 1} [${q.category}/${q.difficulty}]: ${q.question}\nAnswer: ${q.answer || "N/A"}\nScore: ${e.question_score || 0}/10 | Suspicion: ${e.suspicion_flags?.suspicion_level || "low"}`;
  }).join("\n\n");

  const scores = questions.map((q: any) => q.evaluation?.question_score || 0);
  const interviewScore = scores.length > 0
    ? Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10)
    : 0;
  const finalFit = Math.round(resumeSkillMatch * 0.3 + interviewScore * 0.7);

  const result = await callAI(apiKey, [
    { role: "system", content: "You are generating a final interview evaluation report." },
    { role: "user", content: `Generate a comprehensive interview report.

Resume Skill Match Score: ${resumeSkillMatch}/100
Interview Score: ${interviewScore}/100
Final Fit Score: ${finalFit}/100

Question Details:
${questionSummary}

Provide strengths, weaknesses, missing skills, overall suspicion level, hiring recommendation, and recruiter summary.` },
  ], [{
    type: "function",
    function: {
      name: "generate_report",
      description: "Generate final interview report",
      parameters: {
        type: "object",
        properties: {
          strengths: { type: "array", items: { type: "string" } },
          weaknesses: { type: "array", items: { type: "string" } },
          missing_skills: { type: "array", items: { type: "string" } },
          suspicion_level: { type: "string", enum: ["low", "medium", "high"] },
          confidence_score: { type: "integer" },
          hiring_recommendation: { type: "string", enum: ["Strong Hire", "Hire", "Borderline", "No Hire"] },
          recruiter_summary: { type: "string" },
        },
        required: ["strengths", "weaknesses", "missing_skills", "suspicion_level", "confidence_score", "hiring_recommendation", "recruiter_summary"],
        additionalProperties: false,
      },
    },
  }], { type: "function", function: { name: "generate_report" } });

  return { ...result, interview_score: interviewScore, final_fit_score: finalFit, resume_skill_match: resumeSkillMatch };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { action, interviewId, jdText, resumeText, answer, questionIndex } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === "start") {
      const plan = await handleStart(LOVABLE_API_KEY, jdText, resumeText);

      // Update interview record
      await supabase.from("interviews").update({
        jd_text: jdText,
        resume_text: resumeText,
        questions: plan.questions,
        resume_skill_match: plan.skill_matching.resume_skill_match_score,
        current_question_index: 0,
        status: "In Progress",
        report: { jd_analysis: plan.jd_analysis, resume_analysis: plan.resume_analysis, skill_matching: plan.skill_matching },
      }).eq("id", interviewId);

      return new Response(JSON.stringify({
        plan,
        first_question: plan.questions[0],
        total_questions: plan.questions.length,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "answer") {
      // Get current interview state
      const { data: interview } = await supabase.from("interviews").select("*").eq("id", interviewId).single();
      if (!interview) throw new Error("Interview not found");

      const questions = interview.questions as any[];
      const currentQ = questions[questionIndex];

      const previousScores = questions
        .slice(0, questionIndex)
        .filter((q: any) => q.evaluation)
        .map((q: any) => q.evaluation.question_score);

      const evaluation = await handleAnswer(
        LOVABLE_API_KEY, interview.jd_text || "", interview.resume_text || "",
        currentQ, answer, previousScores, questionIndex
      );

      // Update question with answer and evaluation
      questions[questionIndex] = { ...currentQ, answer, evaluation };

      const nextIndex = evaluation.needs_follow_up && currentQ.follow_up
        ? questionIndex // Stay on same question for follow-up
        : questionIndex + 1;
      const isComplete = nextIndex >= questions.length && !evaluation.needs_follow_up;

      // If follow-up needed, insert follow-up question
      if (evaluation.needs_follow_up && evaluation.follow_up_question && !currentQ.is_follow_up) {
        const followUpQ = {
          question: evaluation.follow_up_question,
          category: currentQ.category,
          difficulty: currentQ.difficulty,
          target_skill: currentQ.target_skill,
          is_follow_up: true,
        };
        questions.splice(questionIndex + 1, 0, followUpQ);
      }

      await supabase.from("interviews").update({
        questions,
        current_question_index: isComplete ? questionIndex : questionIndex + 1,
        status: isComplete ? "Evaluating" : "In Progress",
      }).eq("id", interviewId);

      const nextQuestion = !isComplete ? questions[questionIndex + 1] : null;

      return new Response(JSON.stringify({
        evaluation,
        next_question: nextQuestion,
        question_number: questionIndex + 1,
        total_questions: questions.length,
        is_complete: isComplete,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "report") {
      const { data: interview } = await supabase.from("interviews").select("*").eq("id", interviewId).single();
      if (!interview) throw new Error("Interview not found");

      const report = await handleReport(
        LOVABLE_API_KEY, interview.jd_text || "", interview.resume_text || "",
        interview.questions as any[], interview.resume_skill_match || 0
      );

      await supabase.from("interviews").update({
        report: { ...(interview.report as any || {}), ...report },
        interview_score: report.interview_score,
        final_fit_score: report.final_fit_score,
        confidence_score: report.confidence_score,
        suspicion_level: report.suspicion_level,
        status: "Completed",
      }).eq("id", interviewId);

      return new Response(JSON.stringify(report), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (e: any) {
    console.error("conduct-interview error:", e);
    const status = e.status || 500;
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
