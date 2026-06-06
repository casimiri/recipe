// ai-tools — recipe AI helpers: ingredient substitutions and simplified steps.
// Deploy: supabase functions deploy ai-tools
// Requires: supabase secrets set OPENAI_API_KEY=sk-...
import { corsHeaders, json } from '../_shared/cors.ts';
import { checkAiQuota } from '../_shared/billing.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini';

interface Body {
  tool: 'substitute' | 'simplify';
  recipe: {
    title: string;
    ingredients: { qty: number; unit: string; item: string }[];
    steps: { t: string; d: string }[];
  };
  ingredient?: string;
  lang?: string;
}

const LANG_NAMES: Record<string, string> = { en: 'English', fr: 'French', es: 'Spanish', de: 'German' };

/** A trailing instruction so the model answers in the user's language. */
function inLang(lang?: string): string {
  const name = lang && LANG_NAMES[lang];
  return name && lang !== 'en' ? ` Respond entirely in ${name}.` : '';
}

async function chat(system: string, user: string) {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!resp.ok) throw new Error(await resp.text());
  const data = await resp.json();
  return JSON.parse(data.choices[0].message.content);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    if (!OPENAI_API_KEY) return json({ error: 'OPENAI_API_KEY not configured.' }, 500);

    const quota = await checkAiQuota(req);
    if (!quota.allowed) return json({ quotaExceeded: true, limit: quota.limit });

    if (body.tool === 'substitute') {
      const target = body.ingredient ?? body.recipe.ingredients[0]?.item ?? '';
      const out = await chat(
        `You are a culinary assistant. Suggest 3 practical substitutions for a single ingredient, accounting for ratio adjustments. Respond as JSON: { "substitutions": string[] }.${inLang(body.lang)}`,
        `Recipe: ${body.recipe.title}. Suggest substitutions for: "${target}".`,
      );
      return json({ substitutions: (out.substitutions ?? []).slice(0, 4) });
    }

    if (body.tool === 'simplify') {
      const steps = body.recipe.steps.map((s, i) => `${i + 1}. ${s.t}: ${s.d}`).join('\n');
      const out = await chat(
        `You simplify cooking instructions for beginners. Rewrite each step to be shorter and clearer while preserving order and meaning. Respond as JSON: { "steps": [ { "t": string, "d": string } ] } with the same number of steps.${inLang(body.lang)}`,
        `Recipe: ${body.recipe.title}\n\nSteps:\n${steps}`,
      );
      return json({ steps: out.steps ?? body.recipe.steps.map((s) => ({ t: s.t, d: s.d })) });
    }

    return json({ error: 'Unknown tool.' }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
