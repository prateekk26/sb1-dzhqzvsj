// analyze-resume.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { corsHeaders } from "../_shared/cors.ts";

const DEBUG = true;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await req.json();
    const { resumeUrl, userId, projectIds = [], experienceYears } = payload;

    if (!resumeUrl || !userId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let experienceLevel = "0-2";
    if (experienceYears >= 7) experienceLevel = "7+";
    else if (experienceYears >= 3) experienceLevel = "3-6";

    let projectsContext = "";
    if (projectIds.length > 0) {
      const { data: projects } = await supabase
        .from("projects")
        .select("title, enhanced_description, raw_input, impact_statement")
        .in("id", projectIds);

      if (projects) {
        projectsContext = "RELEVANT PROJECTS:\n" +
          projects.map((p) => `- ${p.title}: ${p.enhanced_description || p.raw_input}\nImpact: ${p.impact_statement || ''}`).join("\n\n");
      }
    }

    const imageBytes = await fetch(resumeUrl).then(r => r.arrayBuffer());
    const imageBase64 = `data:image/png;base64,${btoa(String.fromCharCode(...new Uint8Array(imageBytes)))}`;

    const categoryWeights = getCategoryWeightsByExperience(experienceLevel);

    const prompt = `You are an expert resume reviewer. Evaluate the resume using the rubric with these weighted dimensions: ${JSON.stringify(categoryWeights)}. Use projects below if available. Return valid JSON.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-2025-04-14",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt + (projectsContext ? `\n\n${projectsContext}` : "") },
              { type: "image_url", image_url: { url: imageBase64, detail: "high" } }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.5,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`OpenAI API error: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const parsed = JSON.parse(data.choices[0].message.content);
    parsed.weights = categoryWeights;
    parsed.experienceLevel = experienceLevel;

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in analyze-resume:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getCategoryWeightsByExperience(level: string) {
  switch (level) {
    case "3-6": return {
      quantified_impact: 0.18,
      depth_of_ownership: 0.18,
      growth_trajectory: 0.15,
      structure_and_formatting: 0.08,
      language_and_clarity: 0.08,
      action_orientation: 0.10,
      project_substance: 0.10,
      keyword_optimization: 0.07,
      brand_equity: 0.04,
      academic_prestige: 0.02
    };
    case "7+": return {
      quantified_impact: 0.20,
      depth_of_ownership: 0.20,
      growth_trajectory: 0.15,
      structure_and_formatting: 0.07,
      language_and_clarity: 0.07,
      action_orientation: 0.10,
      project_substance: 0.12,
      keyword_optimization: 0.05,
      brand_equity: 0.03,
      academic_prestige: 0.01
    };
    default: return {
      quantified_impact: 0.15,
      depth_of_ownership: 0.15,
      growth_trajectory: 0.12,
      structure_and_formatting: 0.10,
      language_and_clarity: 0.10,
      action_orientation: 0.10,
      project_substance: 0.08,
      keyword_optimization: 0.07,
      brand_equity: 0.07,
      academic_prestige: 0.06
    };
  }
}
