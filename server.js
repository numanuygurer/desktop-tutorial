import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

app.post("/start-call", async (req, res) => {
  console.log("🚀 /start-call endpoint tetiklendi");
  console.log("Gelen body:", req.body);

  const { phone, name } = req.body;
  if (!phone || !name) {
    console.error("Eksik veri geldi:", req.body);
    return res.status(400).json({ error: "Eksik veri" });
  }

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

app.listen(process.env.PORT || 10000, () => {
  console.log(`Call bot server çalışıyor (port ${process.env.PORT || 10000})`);
});
