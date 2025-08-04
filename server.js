import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import { WebSocket } from "ws";

const app = express();
app.use(bodyParser.json());

// Ortam değişkenlerinden keyleri al
const GPT_API_KEY = process.env.GPT_API_KEY;
const ZADARMA_SIP_LOGIN = process.env.ZADARMA_SIP_LOGIN;
const ZADARMA_SIP_PASS = process.env.ZADARMA_SIP_PASS;
const ZADARMA_SIP_SERVER = "sip.zadarma.com";
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

// Çağrı başlatma endpointi
app.post("/start-call", async (req, res) => {
  const { phone, name } = req.body;
  console.log(`📞 Çağrı başlatılıyor: ${name} - ${phone}`);

  try {
    // Zadarma SIP WebSocket bağlantısı
    const ws = new WebSocket(`wss://${ZADARMA_SIP_SERVER}/rtp`, {
      headers: { login: ZADARMA_SIP_LOGIN, password: ZADARMA_SIP_PASS }
    });

    ws.on("open", () => {
      console.log("✅ Zadarma ile bağlantı kuruldu.");
      ws.send(JSON.stringify({ action: "call", number: phone }));
    });

    ws.on("message", async (data) => {
      const msg = data.toString();
      console.log("🔊 Gelen ses datası uzunluğu:", msg.length);

      // STT (Whisper Realtime)
      const sttResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${GPT_API_KEY}` },
        body: msg // RTP ses datası
      });
      const sttData = await sttResponse.json();
      const userText = sttData.text;
      console.log("👂 Müşteri dedi ki:", userText);

      // GPT yanıtı
      const gptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GPT_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Sen bir müşteri temsilcisisin. Kısa ve net yanıtlar ver." },
            { role: "user", content: userText }
          ]
        })
      });
      const gptData = await gptResponse.json();
      const botReply = gptData.choices[0].message.content;
      console.log("🤖 GPT yanıtı:", botReply);

      // TTS (OpenAI)
      const ttsResponse = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GPT_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ model: "gpt-4o-mini-tts", voice: "alloy", input: botReply })
      });

      const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
      ws.send(audioBuffer); // Ses verisini Zadarma'ya geri gönder
    });

    ws.on("close", async () => {
      console.log("📴 Çağrı kapandı.");

      const summary = `Müşteri ${name} (${phone}) ile görüşme tamamlandı.`;
      const meeting = "Salı 15:00";

      // n8n Webhook’una gönder
      await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name, summary, meeting })
      });
    });

    res.json({ status: "Çağrı başlatıldı", phone });
  } catch (error) {
    console.error("❌ Hata:", error);
    res.status(500).json({ error: "Çağrı başlatılamadı" });
  }
});

// Render port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Call bot server aktif (port ${PORT})`);
});
