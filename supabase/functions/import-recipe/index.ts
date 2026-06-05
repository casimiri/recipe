// import-recipe — parses a recipe from a link / pasted text / photo using
// OpenAI and returns a structured recipe. Deploy:
//   supabase functions deploy import-recipe
// Requires the OPENAI_API_KEY secret:
//   supabase secrets set OPENAI_API_KEY=sk-...
import { corsHeaders, json } from '../_shared/cors.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini';

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80';

const SYSTEM = `You are a recipe extraction engine. Given a link, pasted text, or a photo of a
recipe, return a single JSON object describing the recipe. Infer reasonable values when a field
is not explicit (e.g. estimate nutrition and difficulty). Respond with ONLY the JSON object,
matching exactly this shape:
{
  "title": string,
  "cuisine": string,
  "meal": "Breakfast"|"Lunch"|"Dinner"|"Dessert"|"Drink",
  "time": number,            // total minutes
  "servings": number,
  "cal": number,             // calories per serving
  "difficulty": "Easy"|"Medium"|"Hard",
  "desc": string,            // 1-2 sentence description
  "tags": string[],          // up to 3 short tags
  "nutrition": { "cal": number, "protein": number, "carbs": number, "fat": number, "fiber": number, "sugar": number },
  "ingredients": [ { "qty": number, "unit": string, "item": string, "g": string } ],  // g = ingredient group label
  "steps": [ { "t": string, "d": string, "timer"?: number } ]  // timer in seconds, optional
}`;

interface ImportBody {
  url?: string;
  text?: string;
  imageBase64?: string;
  sourceKind?: string;
}

async function fetchPageText(url: string): Promise<string> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 RecipeSnapBot' } });
    const html = await res.text();
    // crude strip of tags/scripts; the model handles the rest
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 12000);
  } catch {
    return '';
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = (await req.json()) as ImportBody;

    if (!OPENAI_API_KEY) {
      return json({ error: 'OPENAI_API_KEY not configured on the function.' }, 500);
    }

    // Build the user content (text + optional image for vision).
    const userContent: any[] = [];
    let prompt = '';
    if (body.imageBase64) {
      prompt = 'Extract the recipe shown in this image.';
      userContent.push({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${body.imageBase64}` } });
    } else if (body.text) {
      prompt = `Extract the recipe from this text:\n\n${body.text.slice(0, 12000)}`;
    } else if (body.url) {
      const page = await fetchPageText(body.url);
      prompt = page
        ? `Extract the recipe from this page (${body.url}):\n\n${page}`
        : `Extract the most likely recipe referenced by this link: ${body.url}. Use your knowledge to produce a plausible, complete recipe.`;
    } else {
      return json({ error: 'Provide url, text, or imageBase64.' }, 400);
    }
    userContent.unshift({ type: 'text', text: prompt });

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: userContent },
        ],
      }),
    });

    if (!resp.ok) {
      return json({ error: `OpenAI error: ${await resp.text()}` }, 502);
    }

    const data = await resp.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    const recipe = {
      id: `imp-${Date.now()}`,
      title: parsed.title ?? 'Imported recipe',
      cuisine: parsed.cuisine ?? 'Imported',
      meal: parsed.meal ?? 'Dinner',
      time: parsed.time ?? 30,
      servings: parsed.servings ?? 2,
      cal: parsed.cal ?? parsed.nutrition?.cal ?? 400,
      difficulty: parsed.difficulty ?? 'Easy',
      rating: 0,
      reviews: 0,
      img: parsed.img ?? FALLBACK_IMG,
      source: { kind: body.sourceKind ?? 'url', handle: body.url ?? 'Imported', name: 'Imported' },
      saves: 0,
      cooked: 0,
      desc: parsed.desc ?? '',
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 3) : [],
      nutrition: parsed.nutrition ?? { cal: parsed.cal ?? 400, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 },
      ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
      steps: Array.isArray(parsed.steps) ? parsed.steps : [],
      imported: true,
    };

    return json({ recipe });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
