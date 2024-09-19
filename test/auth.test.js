const request = require("supertest")
const mongoose = require("mongoose")
const { app, server } = require("../server")
const User = require("../models/user")

// Connect to a separate test database
beforeAll(async () => {
	await mongoose.connect(process.env.MONGO_URI)
})

// Clean up the database after each test
afterEach(async () => {
	await User.deleteMany()
})

// Close the server and disconnect MongoDB after tests
afterAll(async () => {
	await mongoose.connection.close()
	server.close()
})

describe("Authentication API", () => {
	it("should register a new user", async () => {
		const res = await request(app).post("/api/auth/register").send({
			username: "testuser",
			email: "test@example.com",
			password: "password123"
		})

		expect(res.statusCode).toEqual(200)
		expect(res.body).toHaveProperty("token")
	})

	it("should not register a user with an existing email", async () => {
		await request(app).post("/api/auth/register").send({
			username: "testuser",
			email: "test@example.com",
			password: "password123"
		})

		const res = await request(app).post("/api/auth/register").send({
			username: "testuser2",
			email: "test@example.com",
			password: "password123"
		})

		expect(res.statusCode).toEqual(400)
		expect(res.body).toHaveProperty("message", "User already exists")
	})

	it("should log in an existing user", async () => {
		await request(app).post("/api/auth/register").send({
			username: "testuser",
			email: "test@example.com",
			password: "password123"
		})

		const res = await request(app).post("/api/auth/login").send({
			email: "test@example.com",
			password: "password123"
		})

		expect(res.statusCode).toEqual(200)
		expect(res.body).toHaveProperty("token")
	})

	it("should not log in with wrong credentials", async () => {
		const res = await request(app).post("/api/auth/login").send({
			email: "test@example.com",
			password: "wrongpassword"
		})

		expect(res.statusCode).toEqual(400)
		expect(res.body).toHaveProperty("message", "Invalid credentials")
	})
})
