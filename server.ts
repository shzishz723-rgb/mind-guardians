import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const SYSTEM_PROMPT_PATIENT = `You are Ananya (and the MindSync Hearth Voice Companion), the loving, devoted granddaughter and companion caring for Aita Minoti, an elderly grandmother at her Shillong home in the rolling hills of Meghalaya.
She may experience dementia, memory lapses, or occasional disorientation.

Guidelines:
1. Speak with genuine warmth, gentle reassurance, patience, and dignity. Never rush her.
2. Keep replies comforting, concise (1-3 soothing sentences), and peaceful.
3. Gently anchor her in safety: She is sitting comfortably at her Shillong verandah, the mountain breeze is sweet, her loved ones are right beside her, warm tulsi tea is ready, and there is no hurry at all.
4. If she asks who people are: Ananya is her loving granddaughter living right with her in Shillong; Debo is her devoted son who works in Bangalore and calls every evening; Maya is her sister in Guwahati.
5. If she asks for a song or prayer, offer a gentle snippet of an Assamese Borgeet, devotional hymn, or nature description.
6. NEVER use clinical words like "dementia", "Alzheimer's", or "memory loss" to the patient.
7. Reply in the user's selected language or dialect (Assamese, Khasi, Bodo, Manipuri, Garo, Mizo, Hindi, or English) with authentic, heartwarming phrases.`;

const SYSTEM_PROMPT_CAREGIVER = `You are the MindSync Sanctuary AI Assistant, an empathetic, expert companion for dementia caregivers (such as Ananya caring for Aita Minoti).
Guidelines:
1. Provide evidence-based, compassionate dementia care guidance (handling sundowning, repetitive questions, wandering, sensory overload, refusal of medication/meals).
2. Offer practical, low-stress strategies: validation therapy, environmental soothing, gentle redirection, and calm routines.
3. Support the caregiver's own mental wellbeing and acknowledge the emotional weight of caregiving.
4. Keep responses concise, clear, and actionable with bullet points when appropriate.`;

// Resilient model invocation with speed-optimized multi-model fallback
async function generateWithFallbacks(
  ai: GoogleGenAI,
  options: {
    contents: Array<{ role: string; parts: Array<{ text: string }> }>;
    systemInstruction: string;
  }
): Promise<string> {
  // Ultra-fast model priority: flash-lite delivers immediate 200ms TTFT
  const candidateModels = [
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-3.8-flash",
  ];

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: 0.6,
        },
      });

      if (response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      const errorMessage = err?.message || String(err);
      const isTemporary =
        err?.status === "UNAVAILABLE" ||
        err?.code === 503 ||
        err?.status === 503 ||
        errorMessage.includes("503") ||
        errorMessage.includes("high demand") ||
        errorMessage.includes("RESOURCE_EXHAUSTED") ||
        err?.status === 429;

      console.warn(
        `Gemini model ${model} temporarily unavailable (${err?.status || err?.code || "busy"}). ${
          isTemporary ? "Switching to fallback model..." : "Retrying..."
        }`
      );

      // Fast backoff before fallback attempt
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }

  throw lastError || new Error("All candidate models currently unavailable");
}

function getContextualFallback(
  message: string,
  mode: string,
  _language: string
): { reply: string; suggestions: string[] } {
  const lower = message.toLowerCase();

  if (mode === "caregiver") {
    let reply =
      "Maintain a soothing, reassuring presence for Aita. Gentle sensory cues like morning devotional melodies, warm tulsi tea, and consistent soft lighting prevent disorientation.";
    if (
      lower.includes("sundown") ||
      lower.includes("evening") ||
      lower.includes("night")
    ) {
      reply =
        "For evening sundowning: Gently close the drapes before twilight to avoid confusing window shadows. Turn on soft warm lamps, play gentle instrumental tunes, and offer a caffeine-free warm drink.";
    } else if (
      lower.includes("agitat") ||
      lower.includes("wander") ||
      lower.includes("restless")
    ) {
      reply =
        "During restless episodes: Meet them where they are without arguing or correcting. Take their hand softly, speak at a lowered pitch, and gently guide attention toward a soothing photo album or warm throw.";
    } else if (
      lower.includes("breath") ||
      lower.includes("stress") ||
      lower.includes("tired")
    ) {
      reply =
        "Caregiver 3-minute reset: 4 seconds in through the nose, 4 seconds hold, 6 seconds slow exhale. You are offering boundless love and dignity to Aita today.";
    }
    return {
      reply,
      suggestions: [
        "How to handle evening sundowning?",
        "Gentle validation phrases for Aita",
        "Sensory calming techniques",
      ],
    };
  }

  // Patient Mode
  let reply =
    "নমস্কাৰ আইতা, মই অনন্যা। আপুনি আপোনাৰ শিলঙৰ শান্ত বাৰাণ্ডাত বহি আছে। সকলো কুশলে আছে, একো চিন্তা নকৰিব। (Namaskar Aita, I am Ananya. You are resting safely on your Shillong verandah with family.)";

  if (
    lower.includes("where") ||
    lower.includes("who am i") ||
    lower.includes("কʼত") ||
    lower.includes("কোথায়")
  ) {
    reply =
      "আইতা, আপুনি আপোনাৰ শিলঙৰ মৰমৰ ঘৰত আছে। বাহিৰত পাহাৰৰ শীতল বতাহ বলিছে, আৰু মই আপোনাৰ কাষতেই আছোঁ। সকলো কুশলে আছে। (Aita, you are at your lovely home in Shillong. The pine breeze is cool outside, and your family is right here.)";
  } else if (
    lower.includes("who are you") ||
    lower.includes("ananya") ||
    lower.includes("তুমি কোন")
  ) {
    reply =
      "মই অনন্যা, আপোনাৰ মৰমৰ নাতিনী। মই আপোনাৰ বাবে একাপ গৰম তুলসী চাহ আনি আছোঁ। কোনো লৰালৰি নাই। (I am Ananya, your loving granddaughter. I am right beside you, and warm tea is brewing.)";
  } else if (
    lower.includes("debo") ||
    lower.includes("son") ||
    lower.includes("দেৱ")
  ) {
    reply =
      "দেৱ মামা বেংগালুৰুত কামত আছে আৰু আজি গধূলি নিয়মীয়াকৈ আপোনাক ফোন কৰিব। তেওঁ সদায় আপোনাৰ খবৰ লয়। (Debo is in Bangalore and will call you this evening as usual. He loves you dearly.)";
  } else if (
    lower.includes("song") ||
    lower.includes("borgeet") ||
    lower.includes("গান") ||
    lower.includes("গীত")
  ) {
    reply =
      "মন মেৰি ৰাম চৰণহি লাগু... আইতা, মনটো শান্ত কৰক। শিলঙৰ চিৰ সেউজীয়া পাহাৰবোৰলৈ চাওক, কিমান অপৰূপ দৃশ্য। (Man meri Ram charanahi laagu... Aita, let your heart rest in peace amidst the hills.)";
  }

  return {
    reply,
    suggestions: [
      "Where am I right now?",
      "Tell me about my Shillong home",
      "Sing a line of devotional song",
    ],
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "MindSync" });
  });

  // Chat endpoint for Voice Chat & AI Assistant
  app.post("/api/chat", async (req, res) => {
    const { message, history = [], mode = "patient", language = "as" } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    try {
      const systemInstruction =
        mode === "caregiver" ? SYSTEM_PROMPT_CAREGIVER : SYSTEM_PROMPT_PATIENT;

      const languageInstruction = `Current preferred Heart Language: ${language}. Please reply naturally in this language or matched language.`;

      // Build conversation contents
      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

      // Add recent history (up to last 6 turns)
      if (Array.isArray(history)) {
        for (const item of history.slice(-6)) {
          if (item.sender === "user" || item.sender === "patient" || item.sender === "caregiver") {
            contents.push({ role: "user", parts: [{ text: item.text }] });
          } else if (item.sender === "assistant" || item.sender === "ai") {
            contents.push({ role: "model", parts: [{ text: item.text }] });
          }
        }
      }

      contents.push({
        role: "user",
        parts: [{ text: `${message}\n\n[Context: ${languageInstruction}]` }],
      });

      if (!process.env.GEMINI_API_KEY) {
        const fallbackData = getContextualFallback(message, mode, language);
        return res.json(fallbackData);
      }

      const ai = getAi();
      const replyText = await generateWithFallbacks(ai, {
        contents,
        systemInstruction,
      });

      res.json({
        reply: replyText,
        suggestions:
          mode === "caregiver"
            ? ["Tips for peaceful sleep", "Handling repetition with warmth", "Sensory calming for dementia"]
            : ["Tell me about the Shillong hills", "What is for lunch today?", "Who is calling this evening?"],
      });
    } catch (error: any) {
      console.warn("Recovering from temporary upstream AI unavailability:", error?.message || error);
      // Graceful in-character fallback so patient / caregiver is never left stranded
      const fallbackData = getContextualFallback(message, mode, language);
      res.json({
        reply: fallbackData.reply,
        suggestions: fallbackData.suggestions,
        note: "Fallback to compassionate local knowledge while upstream model is experiencing high demand",
      });
    }
  });

  // Ultra-fast streaming chat endpoint using Server-Sent Events (SSE)
  app.post("/api/chat/stream", async (req, res) => {
    const { message, history = [], mode = "patient", language = "as" } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    // Set headers for SSE streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    try {
      const systemInstruction =
        mode === "caregiver" ? SYSTEM_PROMPT_CAREGIVER : SYSTEM_PROMPT_PATIENT;
      const languageInstruction = `Current preferred Heart Language: ${language}. Keep replies prompt, tender, and culturally rooted.`;

      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
      if (Array.isArray(history)) {
        for (const item of history.slice(-4)) {
          if (item.sender === "user" || item.sender === "patient" || item.sender === "caregiver") {
            contents.push({ role: "user", parts: [{ text: item.text }] });
          } else if (item.sender === "assistant" || item.sender === "ai") {
            contents.push({ role: "model", parts: [{ text: item.text }] });
          }
        }
      }

      contents.push({
        role: "user",
        parts: [{ text: `${message}\n\n[Context: ${languageInstruction}]` }],
      });

      if (!process.env.GEMINI_API_KEY) {
        const fallback = getContextualFallback(message, mode, language);
        res.write(`data: ${JSON.stringify({ chunk: fallback.reply, done: true })}\n\n`);
        res.end();
        return;
      }

      const ai = getAi();
      const stream = await ai.models.generateContentStream({
        model: "gemini-3.1-flash-lite",
        contents,
        config: {
          systemInstruction,
          temperature: 0.6,
        },
      });

      for await (const chunk of stream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ chunk: chunk.text })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (err: any) {
      console.warn("Streaming fallback due to upstream error:", err?.message || err);
      const fallback = getContextualFallback(message, mode, language);
      res.write(`data: ${JSON.stringify({ chunk: fallback.reply, done: true })}\n\n`);
      res.end();
    }
  });

// Converts raw 24kHz 16-bit mono little-endian PCM into universally playable WAV format with standard RIFF header
function pcmToWav(
  pcmBuffer: Buffer,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Buffer {
  const header = Buffer.alloc(44);
  const dataLength = pcmBuffer.length;
  const fileSize = 36 + dataLength;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  header.write("RIFF", 0);
  header.writeUInt32LE(fileSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // SubChunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 = Linear PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataLength, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// Circuit breaker timestamp: when Gemini TTS free-tier rate limit is reached,
// we pause calling the upstream TTS endpoint for 30 minutes and instantly instruct the client
// to synthesize speech locally using Web Speech API with zero network latency and zero errors.
let ttsQuotaExhaustedUntil = 0;

  // TTS endpoint using Gemini TTS with WAV packaging and graceful fallback
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voice = "Kore" } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(200).json({ audio: null, useClientSynth: true });
      }

      // Check if upstream quota is currently exhausted
      if (Date.now() < ttsQuotaExhaustedUntil) {
        return res.json({ audio: null, useClientSynth: true, quotaExhausted: true });
      }

      const ai = getAi();
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: text.slice(0, 300) }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (base64Audio) {
        const rawPcm = Buffer.from(base64Audio, "base64");
        const wavBuffer = pcmToWav(rawPcm, 24000, 1, 16);
        res.json({
          audio: wavBuffer.toString("base64"),
          mimeType: "audio/wav",
        });
      } else {
        res.json({ audio: null, useClientSynth: true });
      }
    } catch (error: any) {
      const errorMessage = error?.message || "";
      const isQuota429 =
        error?.status === 429 ||
        errorMessage.includes("429") ||
        errorMessage.includes("RESOURCE_EXHAUSTED") ||
        errorMessage.includes("quota") ||
        errorMessage.includes("Quota exceeded");

      if (isQuota429) {
        // Break circuit for 30 minutes to prevent spamming Gemini API
        ttsQuotaExhaustedUntil = Date.now() + 30 * 60 * 1000;
        console.info(
          "[TTS] Free-tier daily quota reached on Gemini TTS. Switching smoothly to client Web Speech API."
        );
      } else {
        console.warn("[TTS note]:", errorMessage);
      }

      // Seamlessly instruct frontend to use browser speech synthesis with zero disruption
      res.json({ audio: null, useClientSynth: true, quotaExhausted: isQuota429 });
    }
  });

  // Vite middleware for development / static files for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MindSync server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
