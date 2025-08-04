import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

// n8n'den gelen arama isteğini karşılar
app.post("/start-call", async (req, res) => {
  const { phone, name } = req.body;
  console.log(`Arama başlatılıyor: ${name} - ${phone}`);

  try {
    const summary = `Müşteri ${name} (${phone}) ile görüşme tamamlandı.`;
    const meeting = "Salı 15:00";

    console.log("Webhook'a gönderiliyor...");

    const response = await fetch("https://8fso0gvh.rcsrv.net/webhook/call-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, summary, meeting })
    });

    console.log("Webhook cevabı status:", response.status);

    res.json({ status: "Arama başlatıldı", phone });
  } catch (error) {
    console.error("Webhook gönderim hatası:", error);
    res.status(500).json({ error: "Webhook gönderilemedi" });
  }
});

// Render'ın doğru çalışması için PORT ayarı
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Call bot server çalışıyor (port ${PORT})`);
});
