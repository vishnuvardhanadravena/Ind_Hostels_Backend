const mongoose = require('mongoose')
const { checkout } = require('../routes/Accommodations')

const globla_searches =  new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    searchtext: [
        {
            type: String
        }
    ],
    locationsearch: [
        {
            location: {
                type: String
            },
            checkin: {
                type:  String
            },
            checkout: {
                type: String
            }
        }
    ]
}, { timestamps: true }) 

module.exports = mongoose.model("globalsearches",globla_searches)