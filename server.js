import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

app.post("/start-call", async (req, res) => {
  const { phone, name } = req.body;
  console.log(`Arama başlatılıyor: ${name} - ${phone}`);

  const summary = `Müşteri ${name} (${phone}) ile görüşme tamamlandı.`;
  const meeting = "Salı 15:00";

  // n8n webhook’una gönder
  await fetch("https://8fso0gvh.rcsrv.net/webhook-test/call-summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, summary, meeting })
  });

  res.json({ status: "Arama başlatıldı", phone });
});

app.listen(process.env.PORT || 10000, () => {
  console.log("Call bot server çalışıyor");
});
