const Message = require("../models/message")

exports.saveMessage = async (senderId, receiverId, content) => {
	try {
		const message = new Message({ sender: senderId, receiver: receiverId, content })
		await message.save()
	} catch (err) {
		console.error("Error saving message:", err)
	}
}
