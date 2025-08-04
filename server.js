import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

// n8n'den gelen arama isteğini karşılar
app.post("/start-call", async (req, res) => {
  const { phone, name } = req.body;
  console.log(`Arama başlatılıyor: ${name} - ${phone}`);

  // Şimdilik test için sabit değer
  const summary = `Müşteri ${name} (${phone}) ile görüşme tamamlandı.`;
  const meeting = "Salı 15:00";

  // n8n webhook’una sonuç gönder
  await fetch("http://senin-n8n-url.com/webhook/call-summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, summary, meeting })
  });

  res.json({ status: "Arama başlatıldı", phone });
});

app.listen(3000, () => {
  console.log("Call bot server çalışıyor (http://localhost:3000)");
});
