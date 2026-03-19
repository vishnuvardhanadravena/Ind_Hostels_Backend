const mongoose  = require("mongoose"); 

const amenitiesSchema = new mongoose.Schema({
    accommodation_type: {
        type: Array,
        required: true
    },
    ameniti_name: {
        type: String,
        required: true
    },
    isroomamenities: {
        type: Boolean,
        default: false
    }
},{
    timestamps: true
})

amenitiesSchema.index({ accommodation_type: 1 ,isroomamenities: 1})

module.exports = mongoose.model("amenities", amenitiesSchema);