import { generateCaptions } from "../../../lib/caption-api.js";

export async function POST(request: Request) {
  return generateCaptions(request, process.env.OPENAI_API_KEY);
}
