require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { OpenAI } = require("openai");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

// ✅ Use OpenRouter-compatible OpenAI instance
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY, // Make sure it's the correct env variable
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000", // Your frontend domain
    "X-Title": "My Chat Bot App"
  }
});

// ✅ Free model
const MODEL_NAME = "openai/gpt-3.5-turbo";

async function getAIResponse(prompt, socket) {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: "You are a helpful AI assistant." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    socket.emit("bot_typing", { isTyping: false });
    return response.choices[0].message.content;
  } catch (error) {
    socket.emit("bot_typing", { isTyping: false });
    console.error("OpenAI Error:", error);
    return "❌ Sorry, something went wrong while processing your request.";
  }
}

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("chat message", async (data) => {
    socket.emit("chat message", {
      sender: "user",
      message: data.message
    });

    socket.emit("bot_typing", { isTyping: true });

    const botResponse = await getAIResponse(data.message, socket);

    setTimeout(() => {
      socket.emit("chat message", {
        sender: "bot",
        message: botResponse
      });
      socket.emit("bot_typing", { isTyping: false });
    }, 200);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

server.listen(3002, () => {
  console.log("🚀 Server listening on port 3002");
});
