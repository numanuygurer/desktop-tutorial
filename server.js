import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// Test endpoint
app.get("/", (req, res) => {
  res.send("Server çalışıyor ✅");
});

// n8n için webhook'a veri gönderen endpoint
app.post("/start-call", async (req, res) => {
  const { phone, name } = req.body;
  console.log("Gelen veri:", { phone, name });

  // Sahte sonuçlar
  const summary = `Müşteri ${name} (${phone}) ile görüşme tamamlandı.`;
  const meeting = "Salı 15:00";

  // Test amaçlı yanıt döndür
  res.json({
    status: "Arama başlatıldı",
    phone,
    name,
    summary,
    meeting
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server çalışıyor: http://localhost:${PORT}`);
});
