const express = require("express");
const http = require("http");
const path = require("path");
const dotenv = require("dotenv").config();
const connectDB = require("./config/db");
const cors = require("cors");
const { initSocket } = require("./socket");
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const storyRoutes = require('./routes/storyRoutes');
const reelRoutes = require('./routes/reelRoutes');

connectDB();

const app = express();
const httpServer = http.createServer(app);

initSocket(httpServer);

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/reels', reelRoutes);

app.get("/", (req, res) => {
    res.send("Social Media App is Running....");
});

const PORT = process.env.PORT || 5002;

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} with Socket.io`);
});