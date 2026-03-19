const mongoose = require("mongoose"); 

const notificationSchema = new mongoose.Schema({
    notificationtitle: {
         type: String,
         required: true
    },
    notificationmessage: {
         type: String,
         required: true
    },
    notificationtype: {
        type: String,
        required: true,  // e.g., 'order', 'system', 'user', 'partner'
    },
    // notificationread: {
    //     type: Boolean,
    //     default: false
    // },
    notificationstatus: {
        type: String,
        default: "Active"  // e.g., 'Active', 'Inactive'
    },
    sendnow: {
        type: Boolean,
        default: true
    },
    scheduletime: {
        type: Date,
        default: Date.now
    },
    createdby: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
         required: true
    },
    targetedusers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    notification_deliverd_to: [
        {
          userid: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
          },
          read: {
            type: Boolean,
            default: false
          }
        }
    ],
    delivery_status: {
        type: String,  // e.g., 'sent', 'delivered', 'failed'
        default: "sent"
    }
},{timestamps: true});

module.exports = mongoose.model("notifications", notificationSchema);
