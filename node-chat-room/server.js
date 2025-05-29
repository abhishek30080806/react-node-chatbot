const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", 
    methods: ["GET", "POST"],
  },
});

io.on('connection', (socket) => {
  console.log('socket connected.....')
  socket.on('chat message', (data) => {

    // Broadcast user message to requested clients
    socket.emit('chat message', { sender: 'user', message: data.message });

    // Bot response logic
    const botResponse = generateBotReply(data.message);

    socket.emit('bot_typing')

    // Delay response to feel realistic
    setTimeout(() => {
      socket.emit('chat message', { sender: 'bot', message: botResponse });
    }, 1000); 
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

function generateBotReply(message) {
  const msg = message.toLowerCase();

  if (msg.includes('hello')) return 'Hi there! How can I help you?';
  if (msg.includes('name')) return 'I am ChatBot 🤖';
  if (msg.includes('bye')) return 'Goodbye! Have a nice day!';
  return "Sorry, I didn't understand that. 😕";
}

server.listen(3002, () => {
  console.log("Server listening on port 3002");
});
