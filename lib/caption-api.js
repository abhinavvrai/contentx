const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["audio/mpeg","audio/mp3","audio/mp4","audio/m4a","audio/wav","audio/x-wav","audio/webm","audio/ogg","video/mp4","video/webm"]);

const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control":"no-store" } });

export async function generateCaptions(request, apiKey) {
  try {
    if (!apiKey) return json({ error:"Caption generation is not connected yet.", code:"SETUP_REQUIRED" }, 503);
    const input = await request.formData(), file = input.get("file"), userPrompt = String(input.get("prompt") || "").trim().slice(0, 800);
    if (!(file instanceof File) || !file.size) return json({ error:"Choose a video or audio file first." }, 400);
    if (file.size > MAX_UPLOAD_BYTES) return json({ error:"Keep the upload below 25 MB to control processing cost." }, 413);
    if (file.type && !ACCEPTED_TYPES.has(file.type)) return json({ error:"Use an MP4, WebM, MP3, M4A, WAV or OGG file." }, 415);

    const form = new FormData();
    form.set("file", file, file.name || "caption-source.mp4");
    form.set("model", "gpt-4o-mini-transcribe");
    form.set("response_format", "verbose_json");
    form.append("timestamp_granularities[]", "segment");
    form.set("temperature", "0");
    form.set("prompt", ["Transcribe exactly what is spoken. For Hindi-English code-switching, write natural Roman Hinglish using the Latin alphabet, while preserving English words, names, numbers, and brand terms accurately.","Do not translate, summarize, add emojis, or invent speech.",userPrompt ? `Caption preference: ${userPrompt}` : ""].filter(Boolean).join(" "));

    const upstream = await fetch("https://api.openai.com/v1/audio/transcriptions", { method:"POST", headers:{ Authorization:`Bearer ${apiKey}` }, body:form });
    const payload = await upstream.json();
    if (!upstream.ok) return json({ error:payload.error?.message || "Caption generation failed. Please try again." }, upstream.status);
    const segments = (payload.segments || []).map(segment => ({ start:Math.max(0, Number(segment.start || 0)), end:Math.max(Number(segment.end || 0), Number(segment.start || 0) + .5), text:String(segment.text || "").trim() })).filter(segment => segment.text);
    return json({ text:String(payload.text || "").trim(), segments, model:"gpt-4o-mini-transcribe", usage:payload.usage || null, creditPasses:1 });
  } catch {
    return json({ error:"The video could not be processed. Check the file and try once more." }, 500);
  }
}
