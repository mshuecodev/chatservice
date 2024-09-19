const mongoose = require("mongoose")
const request = require("supertest")
const io = require("socket.io-client")
const { app, server } = require("../server")
const User = require("../models/user")
const Message = require("../models/message")

let socket
let httpServer

beforeAll(async () => {
	// Start the server explicitly in the test environment
	httpServer = server.listen(5000, () => {
		console.log("Test server running on port 5000")
	})

	// Connect to MongoDB for the test
	await mongoose.connect(process.env.MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})

	// Register two users: sender and receiver
	const senderUser = await request(app).post("/api/auth/register").send({
		username: "senderUser",
		email: "sender@example.com",
		password: "password123"
	})

	const receiverUser = await request(app).post("/api/auth/register").send({
		username: "receiverUser",
		email: "receiver@example.com",
		password: "password123"
	})

	// Log the registration responses to inspect the structure
	console.log("Sender registration response:", senderUser.body)
	console.log("Receiver registration response:", receiverUser.body)

	// Initialize the Socket.IO client for testing
	socket = io("http://localhost:5000", {
		transports: ["websocket"], // You can add fallback to polling if needed
		forceNew: true
	})

	// Attach sender and receiver user information to the global scope for the test
	global.senderId = senderUser.body.userId
	global.receiverId = receiverUser.body.userId
})

// Clean up test data and close connections after each test
afterEach(async () => {
	await Message.deleteMany() // Clear messages between tests
})

afterAll(async () => {
	// Close MongoDB and Socket.IO connections after all tests
	await mongoose.connection.close() // Close the database connection
	socket.close() // Close the socket connection
	httpServer.close() // Close the HTTP server
})

describe("Socket.IO Chat", () => {
	it("should send and receive chat messages using dynamic user IDs", (done) => {
		// Define the dynamic message using real user IDs from the registration
		const testMessage = {
			senderId: global.senderId, // Use sender's ID registered earlier
			receiverId: global.receiverId, // Use receiver's ID registered earlier
			content: "Hello, this is a test message with dynamic users"
		}

		// Ensure that the socket is connected before emitting any messages
		socket.on("connect", () => {
			console.log("Socket connected:", socket.id)

			// Listen for the chatMessage event on the client side
			socket.on("chatMessage", (msg) => {
				console.log("Message received by client:", msg)
				try {
					// Assertions for message content and user IDs
					expect(msg.content).toBe(testMessage.content)
					expect(msg.senderId).toBe(testMessage.senderId)
					expect(msg.receiverId).toBe(testMessage.receiverId)
					done() // Mark the test as completed
				} catch (error) {
					done(error) // Fail the test in case of any errors
				}
			})

			console.log("Message emitted by client:", testMessage)

			// Emit the chatMessage event to the server
			socket.emit("chatMessage", testMessage)
		})

		// Handle socket connection errors (Optional)
		socket.on("connect_error", (err) => {
			console.error("Socket connection error:", err)

			done(err) // Fail the test if there's a connection error
		})
	})
})
