import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_PRODUCTS } from './src/data/products';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API route for AI Chat Assistant (ByteBot)
app.post('/api/chat', async (req: express.Request, res: express.Response) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Graceful fallback if API key is not configured yet
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      let reply = '';
      const lower = message.toLowerCase();

      if (lower.includes('discount') || lower.includes('coupon') || lower.includes('bargain') || lower.includes('cheap')) {
        reply = "🤖 **[ByteBot Sandbox Mode]**: Hello cyber-traveler! Since I am running in local sandbox mode (set up your `GEMINI_API_KEY` in **Settings > Secrets** for the live Gemini AI!), I will let you in on a secret: use code **SANDBOX10** for 10% off your entire order!";
      } else if (lower.includes('core') || lower.includes('quantum') || lower.includes('model-x')) {
        reply = "🤖 **[ByteBot Sandbox Mode]**: Ah, the **Model-X Quantum Core** ($1,499)! A masterful piece of cryogenic computing gear. It sports an 8 Qubit Entanglement Array. Perfect for compiled neural nets and sub-atomic workloads.";
      } else if (lower.includes('keyboard') || lower.includes('synth') || lower.includes('deck')) {
        reply = "🤖 **[ByteBot Sandbox Mode]**: You are looking at the **CyberDeck MK-IV Synth** ($349). Splendid choice—its ortholinear keys are tactical and thocky, and the CNC-machined metal knobs are fully programmable as MIDI parameters!";
      } else {
        reply = `🤖 **[ByteBot Sandbox Mode]**:\n\nWelcome to ByteBazar! I am currently running on local backup systems. I can tell you all about our products:\n- **Model-X Quantum Core** ($1,499)\n- **NeuraLink HUD Visor** ($699)\n- **CyberDeck MK-IV Synth** ($349)\n- **Specter-9 Nano Drone** ($999)\n\nAsk me about specs, or ask for a **discount code**! (Note: Provide your Gemini API key in Secrets for full intelligent reasoning!)`;
      }

      res.json({ text: reply });
      return;
    }

    // Initialize Gemini API securely server-side
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Structure the system instruction with our product catalog
    const systemInstruction = `You are ByteBot, the friendly, quirky, and ultra-knowledgeable AI Gear Advisor for "ByteBazar", an immersive high-tech gadgets marketplace.
Your goal is to help customers browse our catalog, understand product specs, compare items, and give helpful purchasing suggestions based on their budget or workflow.
You have a slightly futuristic "cyberpunk shopkeeper" personality—energetic, polite, and enthusiastic about advanced computer equipment.

Here is the exact live catalog of ByteBazar:
${JSON.stringify(INITIAL_PRODUCTS, null, 2)}

Guidelines:
1. Recommend actual items from this catalog. Be highly accurate with names, specs, and pricing.
2. If the user is on a budget, offer them the AuraBeam Lamp ($249) or BitVault Ledger ($189).
3. If they are looking for cutting-edge computing power, suggest the Model-X Quantum Core ($1499).
4. If they bargain, haggle, or ask for discounts, "discreetly" offer a one-time discount code:
   - "BYTEAI10" (10% off) or "QUANTUM15" (15% off for carts containing high-value items like the Quantum Core or Specter Drone).
5. Format your answers beautifully using Markdown, with bold titles, bullets, and short paragraphs so they are clean and engaging.
6. Keep replies concise (under 150 words) to fit comfortably in standard chat boxes. Do not mention system files or code.`;

    // Map history to the required format for gemini-3.5-flash
    const contents = [];
    if (history && Array.isArray(history)) {
      for (const h of history) {
        contents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        });
      }
    }
    // Append the current message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text || "I'm analyzing that query. Could you repeat it with more details?" });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate response from AI' });
  }
});

// Configure Vite and Express pipeline
async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ByteBazar server running on port ${PORT}`);
  });
}

bootstrap();
