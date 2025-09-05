const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app); 
const io = new Server(server, { cors: { origin: "*" } });

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Message schema
const messageSchema = new mongoose.Schema({
  sender: String,
  text: String,
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model("Message", messageSchema);

// Store socketId → username mapping
const users = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Set username when frontend sends it
  socket.on("setUsername", (username) => {
    users[socket.id] = username;
    console.log(`Socket ${socket.id} username set to ${username}`);
  });

  // Handle messages
  socket.on("sendMessage", async (data) => {
    const sender = users[socket.id] || `User${Math.floor(Math.random() * 1000)}`;
    const msg = new Message({ sender, text: data.text });
    await msg.save();
    io.emit("receiveMessage", msg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    delete users[socket.id];
  });
});

// REST endpoint to fetch messages
app.get("/messages", async (req, res) => {
  const msgs = await Message.find().sort({ createdAt: 1 });
  res.json(msgs);
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
 