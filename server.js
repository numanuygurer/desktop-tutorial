import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

// Render ortamında PORT değişkenini kullan
const PORT = process.env.PORT || 3000;

// n8n webhook URL'ni buraya yaz (Test URL veya Production URL)
const N8N_WEBHOOK_URL = "https://8fso0gvh.rcsrv.net/webhook-test/call-summary";

// HTTP POST endpoint: /start-call
app.post("/start-call", async (req, res) => {
  const { phone, name } = req.body;
  console.log(`Gelen istek body: { name: ${name}, phone: ${phone} }`);

  try {
    // Burada test için sahte veri gönderiyoruz
    const summary = `Müşteri ${name} (${phone}) ile görüşme tamamlandı.`;
    const meeting = "Salı 15:00";

    console.log("Webhook'a gönderiliyor...");

    // n8n Webhook'una gönder
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, name, summary, meeting })
    });

    console.log("Webhook cevabı status:", response.status);

    if (!response.ok) {
      throw new Error(`Webhook hatası: ${response.status}`);
    }

    res.json({ status: "Arama başlatıldı", phone, name });
  } catch (error) {
    console.error("Webhook gönderim hatası:", error.message);
    res.status(500).json({ error: "Webhook gönderilemedi" });
  }
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`✅ Call bot server çalışıyor (port ${PORT})`);
});
