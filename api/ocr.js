export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { imageData, mediaType } = req.body;

    if (!imageData) return res.status(400).json({ error: "imageData obrigatório" });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.VITE_ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 100,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType || "image/jpeg",
                data: imageData,
              },
            },
            {
              type: "text",
              text: "Você é um sistema OCR especializado em hodômetros de veículos. Leia o número exibido no hodômetro desta foto e responda APENAS com o número inteiro, sem texto, sem pontuação, sem unidade. Se não conseguir ler, responda com '0'.",
            },
          ],
        }],
      }),
    });

    const data = await response.json();
    const texto = data?.content?.[0]?.text?.trim() || "0";
    const numero = parseInt(texto.replace(/\D/g, ""), 10);
    return res.status(200).json({ km: isNaN(numero) ? 0 : numero });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}