const mongoose = require("mongoose"); 

const roomsschema = new mongoose.Schema({
    room_type: {
        type: String,
        required: [true, "Room type is required"]
    },
    beds_available: {
        type: Number,
        required: [true, "Beds available is required"]
    },
    no_of_guests: {
        type: Number,
        required: [true, "No of guests is required"]
    },
    no_of_childrens: {
        type: Number
    },
    room_amenities: {
        type: Array,
        required: [true, "Room amenities is required"]
    },
    room_images_url: {
        type: Array,
        required: [true, "Room images url is required"]
    },
    room_description: {
        type: String,
        required: [true, "Room description is required"]
    },
    rooms_available: {
        type: Number,
        required: [true, "Rooms available is required"]
    },
    accommodation_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'accommodations',
        required: [true, "Accommodation id is required"]
    },
    pricing_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PricingMatrix'
    },
    bookings:[
        {
            check_in_date: {
                type: Date,
            },
            check_out_date: {
                type: Date,
            },
            beds_booked: {
                type: Number,
            }
        }
    ]
},{timestamps: true})

roomsschema.index({ check_in_date: 1, check_out_date: 1 })
roomsschema.index({ accommodation_id: 1 })

module.exports = mongoose.model("rooms", roomsschema);