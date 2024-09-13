const mongoose = require('mongoose');

const socketMsgSchema = new mongoose.Schema({
    senderId: {
        type: String
    },
    message: {
        type: String
    }
},{
    timestamps: true,
})

const socketMsgModel = mongoose.model("Message", socketMsgSchema);
module.exports = socketMsgModel;