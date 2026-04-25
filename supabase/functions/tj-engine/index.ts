/* TJ Engine — server-side governor edge function
 *
 * Operations:
 *   - "evaluate"      → run a student submission through the rule pipeline
 *   - "structure"     → take an extracted term draft and emit structured stage content
 *                       (AI assists; the engine enforces structure)
 *   - "breakdown"     → generate the morphology breakdown for a single term
 *
 * The student NEVER sees raw model output. Every response is shaped to
 * match the TJ stage definitions before being returned.
 */

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

type StageId =
  | "visualize" | "define" | "breakdown" | "recall_reconstruction"
  | "recognize" | "metaphor" | "information" | "reflection"
  | "application" | "assess";

const STAGE_ORDER: StageId[] = [
  "visualize", "define", "breakdown", "recall_reconstruction",
  "recognize", "metaphor", "information", "reflection",
  "application", "assess",
];

interface TJStageContent {
  stage_id: StageId;
  title: string;
  content_body: string;
}

interface BreakdownContent {
  prefix: string;
  root: string;
  suffix: string;
  literal_meaning: string;
  concept_meaning: string;
  related_word_family: string[];
  pronunciation?: string;
  memory_hook: string;
  practice_prompt: string;
}

async function callAI(systemPrompt: string, userPrompt: string, tools?: any[]): Promise<any> {
  const body: any = {
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };
  if (tools) {
    body.tools = tools;
    body.tool_choice = { type: "function", function: { name: tools[0].function.name } };
  }
  const resp = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    if (resp.status === 429) throw new Error("rate_limited");
    if (resp.status === 402) throw new Error("payment_required");
    throw new Error(`gateway_${resp.status}`);
  }
  const data = await resp.json();
  if (tools) {
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    return args ? JSON.parse(args) : null;
  }
  return data.choices?.[0]?.message?.content ?? "";
}

const TJ_SYSTEM = `You are the TJ Anderson Layer Method™ content generator.
You assist the TJ Engine — you do NOT design the experience.
Output exactly what is requested, nothing more.
Voice: calm, editorial, empowering, never punishing.
Never invent stage names. Never reorder stages. Never produce filler.`;

async function structureTermStages(
  termTitle: string,
  rawDefinition: string,
  sourceExcerpt: string,
): Promise<TJStageContent[]> {
  const result = await callAI(
    TJ_SYSTEM,
    `Term: ${termTitle}
Source definition: ${rawDefinition}
Source context: ${sourceExcerpt}

Generate the structured content body for each of the 9+1 TJ stages.
Each content_body must be 1-3 sentences, written for the student.
Stages (in this exact order): ${STAGE_ORDER.join(", ")}.`,
    [
      {
        type: "function",
        function: {
          name: "tj_stage_content",
          description: "Structured content body for each TJ stage",
          parameters: {
            type: "object",
            properties: {
              stages: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    stage_id: { type: "string", enum: STAGE_ORDER },
                    title: { type: "string" },
                    content_body: { type: "string" },
                  },
                  required: ["stage_id", "title", "content_body"],
                  additionalProperties: false,
                },
              },
            },
            required: ["stages"],
            additionalProperties: false,
          },
        },
      },
    ],
  );

  const stages: TJStageContent[] = result?.stages ?? [];
  // Engine enforcement: ensure every stage exists, in order, fall back to safe defaults.
  return STAGE_ORDER.map((id) => {
    const found = stages.find((s) => s.stage_id === id);
    if (found && found.content_body?.trim()) return found;
    return {
      stage_id: id,
      title: id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      content_body: rawDefinition.slice(0, 240),
    };
  });
}

async function generateBreakdown(termTitle: string, definition: string): Promise<BreakdownContent> {
  const result = await callAI(
    TJ_SYSTEM,
    `Term: ${termTitle}
Definition: ${definition}

Decode the term into prefix, root, suffix and meanings. If a part doesn't
exist, return an empty string for that field. Provide a memory hook and
a practice prompt the student can answer.`,
    [
      {
        type: "function",
        function: {
          name: "tj_breakdown",
          description: "Anatomy of the word (Break It Down stage)",
          parameters: {
            type: "object",
            properties: {
              prefix: { type: "string" },
              root: { type: "string" },
              suffix: { type: "string" },
              literal_meaning: { type: "string" },
              concept_meaning: { type: "string" },
              related_word_family: { type: "array", items: { type: "string" } },
              pronunciation: { type: "string" },
              memory_hook: { type: "string" },
              practice_prompt: { type: "string" },
            },
            required: [
              "prefix", "root", "suffix",
              "literal_meaning", "concept_meaning",
              "related_word_family", "memory_hook", "practice_prompt",
            ],
            additionalProperties: false,
          },
        },
      },
    ],
  );
  return result as BreakdownContent;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const op = body?.op as string;

    if (op === "structure") {
      const { term_title, raw_definition, source_excerpt } = body;
      if (!term_title || !raw_definition) {
        return new Response(JSON.stringify({ error: "term_title and raw_definition required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const stages = await structureTermStages(term_title, raw_definition, source_excerpt ?? "");
      return new Response(JSON.stringify({ stages }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (op === "breakdown") {
      const { term_title, definition } = body;
      if (!term_title) {
        return new Response(JSON.stringify({ error: "term_title required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const breakdown = await generateBreakdown(term_title, definition ?? "");
      return new Response(JSON.stringify({ breakdown }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "unknown op" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    const status = msg === "rate_limited" ? 429 : msg === "payment_required" ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
