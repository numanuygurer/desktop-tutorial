import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import crypto from "crypto";

const app = express();
app.use(bodyParser.json());

// Ortam değişkenleri (Render Dashboard > Environment'dan gireceksin)
const ZADARMA_KEY = process.env.ZADARMA_API_KEY;
const ZADARMA_SECRET = process.env.ZADARMA_API_SECRET;
const ZADARMA_SIP = process.env.ZADARMA_SIP_ID;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

// Zadarma için imza fonksiyonu
function createSignature(query) {
  return crypto
    .createHmac("sha1", ZADARMA_SECRET)
    .update(query)
    .digest("hex");
}

// Çağrı başlatma
app.post("/start-call", async (req, res) => {
  const { phone, name } = req.body;
  console.log(`📞 Arama başlatılıyor: ${name} - ${phone}`);

  try {
    // GPT'den hoş geldin mesajı al
    const gptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Sen bir müşteri temsilcisisin, kibarca hoş geldin de." },
          { role: "user", content: `Müşteri adı ${name}, telefon ${phone}. Hoş geldin mesajı söyle.` }
        ],
      }),
    });

    const gptData = await gptResponse.json();
    const welcomeMessage = gptData.choices[0].message.content;
    console.log("🤖 GPT Mesajı:", welcomeMessage);

    // Zadarma API parametreleri
    const query = `sip=${ZADARMA_SIP}&number=${phone}&caller_id=ZadarmaBot&tts_text=${encodeURIComponent(welcomeMessage)}`;
    const signature = createSignature(query);

    // Zadarma araması
    const zadarmaResponse = await fetch(
      `https://api.zadarma.com/v1/request/callback/?${query}`,
      {
        headers: {
          Authorization: `ZD ${ZADARMA_KEY}:${signature}`,
        },
      }
    );

    const zadarmaData = await zadarmaResponse.json();
    console.log("📲 Zadarma Cevabı:", zadarmaData);

    // Sonucu n8n webhook’una gönder
    await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        name,
        summary: `Müşteri ${name} (${phone}) arandı ve hoş geldin mesajı iletildi.`,
        meeting: "Henüz planlanmadı"
      }),
    });

    res.json({ status: "Arama yapıldı", phone, welcomeMessage });
  } catch (error) {
    console.error("❌ Hata:", error);
    res.status(500).json({ error: "Arama başlatılamadı" });
  }
});

// Render port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Call bot server aktif (port ${PORT})`);
});
