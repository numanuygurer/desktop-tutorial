import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

// n8n'den gelen arama isteğini karşılar
app.post("/start-call", async (req, res) => {
  console.log("📩 Gelen istek body:", req.body);

  // Gelen body'deki verileri al
  const { phone, name, Telefon, Isim } = req.body;

  // Hem küçük harf hem büyük harf destekliyoruz
  const finalPhone = phone || Telefon;
  const finalName = name || Isim;

  console.log(`📞 Arama başlatılıyor: ${finalName} - ${finalPhone}`);

  try {
    const summary = `Müşteri ${finalName} (${finalPhone}) ile görüşme tamamlandı.`;
    const meeting = "Salı 15:00";

    console.log("➡️ Webhook'a gönderiliyor...");

    const webhookUrl = "https://8fso0gvh.rcsrv.net/webhook-test/call-summary";

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: finalPhone, name: finalName, summary, meeting })
    });

    console.log("✅ Webhook cevabı status:", response.status);

    res.json({ status: "Arama başlatıldı", phone: finalPhone, name: finalName });
  } catch (error) {
    console.error("❌ Webhook gönderim hatası:", error);
    res.status(500).json({ error: "Webhook gönderilemedi" });
  }
});

// Render için PORT ayarı
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Call bot server çalışıyor (port ${PORT})`);
});
