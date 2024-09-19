const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const mongoose = require("mongoose")
const cors = require("cors")
const connectDB = require("./config/db")
const authRoutes = require("./routes/authRoutes")
const { saveMessage } = require("./controllers/chatController")
const dotenv = require("dotenv")

// Load environment variables
if (process.env.NODE_ENV === "test") {
	dotenv.config({ path: ".env.test" })
} else {
	dotenv.config()
}

const app = express()
const server = http.createServer(app)

app.use(cors())
const io = new Server(server, {
	cors: {
		origin: "*", // Allow any origin (for testing purposes)
		methods: ["GET", "POST"] // Allow these HTTP methods
		// allowedHeaders: ["my-custom-header"], // Optional: Add custom headers if necessary
		// credentials: true // Allow credentials (cookies, authorization headers)
	}
})
app.use(express.json())

// Routes
app.use("/api/auth", authRoutes)

// Connect to MongoDB
connectDB()

// Global handler for uncaught exceptions
process.on("uncaughtException", (err) => {
	console.error("Uncaught Exception:", err.message)
	// Optional: You can choose to exit the process if necessary
	if (process.env.NODE_ENV !== "test") {
		process.exit(1)
	}
})

// Global handler for unhandled promise rejections
process.on("unhandledRejection", (err) => {
	console.error("Unhandled Rejection:", err.message)
	// Optional: You can choose to exit the process if necessary
	if (process.env.NODE_ENV !== "test") {
		process.exit(1)
	}
})

// Handle Socket.IO connections
io.on("connection", (socket) => {
	console.log("User connected:", socket.id)

	socket.on("chatMessage", async (msg) => {
		console.log("Message received on server:", msg)
		await saveMessage(msg.senderId, msg.receiverId, msg.content)
		io.emit("chatMessage", msg) // Broadcast message to all clients
		console.log("Message broadcasted to all clients:", msg)
	})

	socket.on("disconnect", () => {
		console.log("User disconnected")
	})

	// Listen for WebSocket errors (Optional, for debugging)
	socket.on("error", (err) => {
		console.error("Socket error:", err)
	})
})

// Conditionally start the server if not in a test environment
if (process.env.NODE_ENV !== "test") {
	const PORT = process.env.PORT || 5000
	server.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`)
	})
}

// FOR TESTING
// Export the server for testing
module.exports = { app, server, io }
