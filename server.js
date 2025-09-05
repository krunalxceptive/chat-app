const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const Message = require("./models/Message");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connect  
mongoose.connect("mongodb+srv://krunalxceptive_db_user:C0zTc2dTW4xokxMC@cluster0.qtg7kts.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB error:", err));

// REST API: Get all messages
app.get("/messages", async (req, res) => {
  try {
    const msgs = await Message.find().sort({ createdAt: 1 });
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// REST API: Save message (optional for testing without socket)
app.post("/messages", async (req, res) => {
  try {
    const msg = new Message(req.body);
    await msg.save();
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: "Failed to save message" });
  }
});

// Setup WebSocket server
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});
 
// Socket events
io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  socket.on("sendMessage", async (data) => {
    const msg = new Message(data);
    await msg.save();
    io.emit("receiveMessage", msg); // broadcast to all
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

const PORT = 5001;
server.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));