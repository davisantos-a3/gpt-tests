import "dotenv/config";
import express, { json } from "express";
import Axios from "axios";
import { conhecimento, getMemory, politica, seguranca } from "./memory.js";

const app = express();
app.use(json());

async function processMessage(message, userNumber) {
  const user = getMemory(userNumber);
  user.historico.push({ role: "user", content: message });

  const systemMessage = {
    role: "system",
    content: `${politica}\n\n${seguranca}\n\n${conhecimento}`,
  };

  const messages = [systemMessage, ...user.historico];

  console.log(user.historico);

  try {
    const resposta = await Axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: messages,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const reply = resposta.data.choices[0].message;
    user.historico.push(reply);

    return reply.content;
  } catch (error) {
    console.error("Erro na API:", error?.response?.data || error.message);
    res.status(500).json({ erro: "Erro ao conversar com o assistente" });
  }
}

async function sendMessageToGuru(message, res, celular) {
  try {
    await Axios.post(
      "https://s9.chatguru.app/api/v1",
      {
        action: "message_send",
        text: message,
        key: process.env.GURU_KEY,
        account_id: process.env.GURU_ACCOUNT_ID,
        phone_id: process.env.GURU_PHONE_ID,
        chat_number: celular,
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    res.json("Mensagem enviada com sucesso!!");
  } catch (error) {
    console.error("Erro na API:", error?.response?.data || error.message);
    res.status(500).json({ erro: "Erro ao enviar mensagem." });
  }
}

app.post("/message/gpt", async (req, res) => {
  const { texto_mensagem, celular } = req.body;

  const resposta = await processMessage(texto_mensagem, celular);

  await sendMessageToGuru(resposta, res, celular);
});

app.post("/message", async (req, res) => {
  console.log(req.body);
  res.json(req.body);
});

app.listen(process.env.PORT, () => {
  console.log(`Servidor rodando na porta ${process.env.PORT}`);
});
