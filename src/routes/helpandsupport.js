const express = require("express");
const router = express.Router(); 
const tickets = require("../controllers/helpandsupport"); 
const {attachments} = require("../middlewares/multer");
const auth = require("../middlewares/authUser"); 
const attach = attachments.single('attachment')

router.post("/create-ticket-and-messages", auth.authenticate, attach, tickets.CreateTicketandMessage);
router.get("/get-tickets-and-messages", auth.authenticate, tickets.getTicketsandmessages);


// router.get("/get-all-tickets-and-messages", auth.adminAuthenticate,auth.isAdmin, tickets.getAllTicketsandmessages);
// router.get("/get-messages/:ticketId", auth.adminAuthenticate,auth.isAdmin, tickets.getmessagesofTicket);
// router.post("/reply-message/:ticketId", auth.adminAuthenticate,auth.isAdmin, tickets.replymessage);




module.exports = router;