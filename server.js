import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import { WebSocket } from "ws";

const app = express();
app.use(bodyParser.json());

// API Keys
const GPT_API_KEY = "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";
const ZADARMA_SIP_LOGIN = "183746";
const ZADARMA_SIP_PASS = "0Mgp0ENypB";
const ZADARMA_SIP_SERVER = "sip.zadarma.com";
const N8N_WEBHOOK_URL = "https://8fso0gvh.rcsrv.net/webhook/call-summary";

// Çağrı başlatma endpointi
app.post("/start-call", async (req, res) => {
  const { phone, name } = req.body;
  console.log(`📞 Çağrı başlatılıyor: ${name} - ${phone}`);

  try {
    // Zadarma üzerinden SIP çağrısını başlat
    // (Burada basit bir websocket simülasyonu ile ilerliyoruz)
    const ws = new WebSocket(`wss://${ZADARMA_SIP_SERVER}/rtp`, {
      headers: { login: ZADARMA_SIP_LOGIN, password: ZADARMA_SIP_PASS }
    });

    ws.on("open", () => {
      console.log("✅ Zadarma ile bağlantı kuruldu.");
      // Çağrı başlatma isteği
      ws.send(JSON.stringify({ action: "call", number: phone }));
    });

    ws.on("message", async (data) => {
      const msg = data.toString();
      console.log("🔊 Gelen ses verisi:", msg.length);

      // STT (Whisper)
      const sttResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${GPT_API_KEY}` },
        body: msg // RTP'den gelen ses
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

      // n8n Webhook’una sonuç gönder
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

// Render için port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Call bot server aktif (port ${PORT})`);
});
