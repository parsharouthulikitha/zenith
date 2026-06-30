import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Gemini
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY as string,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.use(express.json());

// API Routes
app.post("/api/ai/analyze-mood", async (req, res) => {
  const { journalContent } = req.body;
  if (!journalContent) return res.status(400).json({ error: "Content required" });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following journal entry for mood, recurring themes, potential emotional triggers, and growth areas. Provide a deeply empathetic summary, a sentiment (Positive, Neutral, Negative), and a list of actionable insights. Context: Journal entry: "${journalContent}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            sentiment: { type: Type.STRING },
            mood: { type: Type.STRING },
            themes: { type: Type.ARRAY, items: { type: Type.STRING } },
            triggers: { type: Type.ARRAY, items: { type: Type.STRING } },
            tips: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["summary", "sentiment", "tips", "mood", "themes", "triggers"]
        }
      }
    });

    res.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error("Gemini Mood Error:", error);
    const message = error.message?.includes("UNAVAILABLE") ? "Service temporarily unavailable due to high demand" : "Failed to analyze mood";
    res.status(error.status || 500).json({ error: message });
  }
});

app.post("/api/ai/coach", async (req, res) => {
  const { message, chatHistory } = req.body;
  
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: "You are Zenith, a supportive AI wellness coach. Your goal is to help users manage stress, improve productivity, and maintain emotional wellbeing. Be empathetic, practical, and encouraging. Keep responses relatively concise but deeply helpful.",
      },
      history: chatHistory || []
    });

    const response = await chat.sendMessage({ message });
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Coach Error:", error);
    const message = error.message?.includes("UNAVAILABLE") ? "Service temporarily unavailable due to high demand" : "Assistant failed";
    res.status(error.status || 500).json({ error: message });
  }
});

// Vite Middleware
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

initServer();
