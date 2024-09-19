const mongoose = require("mongoose")

const connectDB = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI)
		console.log("MongoDB connected successfully")
	} catch (error) {
		console.error("MongoDB connection error:", error)

		// Only exit the process in production environments, not in test mode
		if (process.env.NODE_ENV !== "test") {
			process.exit(1) // This should not be called in test environments
		}
	}
}

module.exports = connectDB
