const tickets = require("../models/tickets") 
const messages = require("../models/messages"); 
//const tickets = require("../models/tickets");
const bookings = require("../models/ordersSchema");


exports.CreateTicketandMessage = async (req,res) => {
    try{
        const {category,subject,message,bookingid} = req.body;
        if(!category || !subject || !message || !bookingid){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Bad Request",
                error: "All fields are required",
            })
        } 
        const booking = await bookings.findOne({
            bookingId: bookingid
        })
        if(!booking){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Booking not found",
                error: "Booking not found",
            })
        }
        let attachment;
        if(req.file){
            attachment = req.file.location;
        }

        const ticket = await tickets.create({
            userId: req.user._id,
            category: category,
            subject: subject,
            bookingId: bookingid
        }) 
        const ticketmessage = await messages.create({
            ticketId: ticket._id,
            sender: "user",
            message: message,
            attachment: attachment
        })

        if(!ticket || !ticketmessage){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Bad Request",
                error: "Ticket or message not created",
            })
        }
        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: "Ticket created successfully,will be resolved soon",
        })
    }catch(error){
        return res.status(500).json({
            success: false,
            statuscode: 500,
            message: "Internal Server Error",
            error: error.message,

        })
    }
} 

exports.getTicketsandmessages = async (req,res) => {
    try{
        const userTickets = await tickets.aggregate([
            {
                $match: {
                    userId: req.user._id
                }
            },
            {
                $lookup: {
                    from: "messages",
                    localField: "_id",
                    foreignField: "ticketId",
                    as: "messages"
                }
            },
            {
                $project: {
                    category: 1,
                    subject: 1,
                    status: 1,
                    createdAt: 1,
                    messages: {
                        $map: {
                            input: "$messages",
                            as: "msg",
                            in: {
                                sender: "$$msg.sender",
                                message: "$$msg.message"
                            }
                        }
                    }
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            }
        ])
        // .explain("executionStats")
        // console.log(JSON.stringify(userTickets, null, 2))
        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: "Tickets fetched successfully",
            data: userTickets
        })

    }catch(error){
        return res.status(500).json({
            success: false,
            statuscode: 500,
            message: "Internal Server Error",
            error: error.message,
        })
    }
}  


//admin apis 

exports.getAllTicketsandmessages = async (req,res) => {
    try{
        const alltickets = await tickets.find({})
        .populate({
            path: "userId",
            select: "fullname email"
        })
        .select('category subject status createdAt')
        .sort({createdAt: 1})
        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: "Tickets fetched successfully",
            data: alltickets
        })
    }catch(error){
        return res.status(500).json({
            success: false,
            statuscode: 500,
            message: "Internal Server Error",
            error: error.message,
        })
    }
}

exports.getmessagesofTicket = async (req,res) => {
    try{
        const {ticketId} = req.params; 
        if(!ticketId){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Bad Request",
                error: "Ticket ID is required"
            })
        }
        const allmessages = await messages.find({ticketId: ticketId}) 
        .select("sender message attachment createdAt -_id ticketId")
        .sort({createdAt: 1})
        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: "Messages fetched successfully",
            data: allmessages
        })
    }catch(error){
        return res.status(500).json({
            success: false,
            statuscode: 500,
            message: "Internal Server Error",
            error: error.message,
        })
    }
} 

exports.replymessage = async (req,res) => {
    try{
        const {ticketId} = req.params;
        const {message,status} = req.body;
        if(!ticketId || !message){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Bad Request",
                error: "Ticket ID and message are required"
            })
        }
        const ticket = await tickets.findById(ticketId)
        if(!ticket){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Ticket not found",
                error: "Ticket not found"
            })
        }
        ticket.status = status;
        await ticket.save()
        const ticketmessage = await messages.create({
            ticketId: ticketId,
            sender: "admin",
            message: message,
            attachment: null
        })
        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: "Message sent successfully",
            data: ticketmessage
        })
    }catch(error){
        return res.status(500).json({
            success: false,
            statuscode: 500,
            message: "Internal Server Error",
            error: error.message,
        })
    }
}
