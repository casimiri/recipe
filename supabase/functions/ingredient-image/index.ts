// ingredient-image — returns a photo of a single ingredient. On the first
// request it generates one with OpenAI (DALL·E) and uploads it to the public
// `ingredient-images` bucket; later requests return the cached URL for free.
// Generation counts against the monthly AI quota (signed-in non-Pro users).
//   supabase functions deploy ingredient-image --no-verify-jwt
import { corsHeaders, json } from '../_shared/cors.ts';
import { checkAiQuota } from '../_shared/billing.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const IMAGE_MODEL = Deno.env.get('OPENAI_IMAGE_MODEL') ?? 'gpt-image-1';
const SUPABASE_URL = Deno.env.get('SB_URL') ?? Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SB_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const BUCKET = 'ingredient-images';

/** Slug for the cached path — must match the client's ingredientSlug(). */
function slugify(item: string): string {
  return item.split(',')[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
const publicUrl = (path: string) => `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;

/** Is the object already in the public bucket? */
async function cached(path: string): Promise<boolean> {
  try {
    const res = await fetch(publicUrl(path), { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

async function upload(path: string, bytes: Uint8Array): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SERVICE_ROLE}`, 'Content-Type': 'image/png', 'x-upsert': 'true' },
    body: bytes,
  });
  return res.ok;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { item } = (await req.json()) as { item?: string };
    if (!item || !item.trim()) return json({ error: 'Provide item.' }, 400);
    const slug = slugify(item);
    if (!slug) return json({ error: 'Invalid item.' }, 400);
    const path = `${slug}.png`;

    // Cache hit → free, no quota.
    if (SUPABASE_URL && (await cached(path))) return json({ url: publicUrl(path), generated: false });

    if (!OPENAI_API_KEY) return json({ error: 'OPENAI_API_KEY not configured.' }, 500);
    if (!SUPABASE_URL || !SERVICE_ROLE) return json({ error: 'Storage not configured.' }, 500);

    // Generation is a billable AI action.
    const quota = await checkAiQuota(req);
    if (!quota.allowed) return json({ quotaExceeded: true, limit: quota.limit });

    const subject = item.split(',')[0].trim();
    const prompt = `A clean, appetizing studio photograph of ${subject}, the raw food ingredient, on a plain white background. Centered, soft natural lighting, no text, no packaging, no hands.`;
    const resp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      // No response_format: gpt-image-1 always returns b64; dall-e-* return a url.
      // `quality: low` keeps generation cheap (gpt-image-1 ignores unknown values gracefully).
      body: JSON.stringify({ model: IMAGE_MODEL, prompt, size: '1024x1024', n: 1, quality: 'low' }),
    });
    if (!resp.ok) return json({ error: `OpenAI error: ${(await resp.text()).slice(0, 300)}` }, 502);

    const data = await resp.json();
    const d = data?.data?.[0];
    let bytes: Uint8Array;
    if (d?.b64_json) {
      bytes = Uint8Array.from(atob(d.b64_json), (c) => c.charCodeAt(0));
    } else if (d?.url) {
      const img = await fetch(d.url);
      if (!img.ok) return json({ error: 'Image download failed.' }, 502);
      bytes = new Uint8Array(await img.arrayBuffer());
    } else {
      return json({ error: 'No image returned.' }, 502);
    }
    if (!(await upload(path, bytes))) return json({ error: 'Upload failed.' }, 502);

    return json({ url: publicUrl(path), generated: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
