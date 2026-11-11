
import { timingSafeEqual } from "node:crypto";

const VOICE_ID = "397RsrMIJAIk0NsWUDhi";

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const secret = process.env.MORNINGBRIEF_TOKEN;

    if (!apiKey || !secret) {
      return new Response("Not configured", { status: 503 });
    }

    const authorization = request.headers.get("authorization") || "";
    const token = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

    const a = Buffer.from(token);
    const b = Buffer.from(secret);

    if (!a.length || a.length !== b.length ||
        !timingSafeEqual(a, b)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const text = body?.text;

    if (typeof text !== "string" ||
        !text.trim() || text.length > 1000) {
      return new Response("Invalid text", { status: 400 });
    }

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_flash_v2_5",
          }),
        }
      );

      if (!response.ok) {
        return Response.json(
          { error: "Audio generation failed", status: response.status },
          { status: 502 }
        );
      }

      return new Response(response.body, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "no-store",
        },
      });
    } catch {
      return new Response("Service unavailable", { status: 502 });
    }
  },
};
