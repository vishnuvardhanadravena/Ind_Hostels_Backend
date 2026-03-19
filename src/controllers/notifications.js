const notifi = require("../models/notificationsSchema.js") 

exports.createNotification = async(req,res) => {
   try {
        const {
            notificationtitle,
            notificationmessage,
            notificationtype,
            notificationstatus,
            scheduletime,
            targetedusers
        } = req.body;

        if (!notificationtitle || !notificationmessage || !notificationtype || !notificationstatus) {
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: 'All fields are required',
                error: 'Bad Request'
            });
        }

        // Convert single user ID to array if it's a string
        let usersArray = [];
        if(targetedusers === 'Send to All Users'){
            const allusers = await users.find().select('_id');
            usersArray = allusers.map(user => user._id);
        }else if (typeof targetedusers === 'string') {
            usersArray = [targetedusers];
        } else if (Array.isArray(targetedusers)) {
            usersArray = targetedusers;
        } else {
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: 'Targeted users must be a string or an array',
                error: 'Bad Request'
            });
        }

        if (usersArray.length === 0) {
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: 'At least one target user is required',
                error: 'Bad Request'
            });
        }

        const notification = await notifi.create({
            notificationtitle,
            notificationmessage,
            notificationtype,
            notificationstatus: notificationstatus || 'Active',
            scheduletime: scheduletime || Date.now(),
            targetedusers: usersArray,
            createdby: req.user._id
        });

        if (new Date(scheduletime) > new Date()) {
            notification.sendnow = false;
            await notification.save();
        }else{
            notification.sendnow = true;
            await notification.save();
        }

        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: 'Notification created successfully',
            data: notification
        });

   }catch(error){
      return res.status(500).json({
         success: false,
         statuscode: 500,
         message: 'Internal Server Error',
         error: error.message
      })
   }
}

exports.updateNotification = async(req,res) => {
   try{
      const { notid } = req.params; 
      if(!notid){
          return res.status(400).json({
             success: false,
             statuscode: 400,
             message: 'Notification ID is required',
             error: 'Bad Request'
          })
      }
      const notification = await notifi.findById(notid);
      if(!notification){
          return res.status(404).json({
             success: false,
             statuscode: 404,
             message: 'Notification is not there',
             error: 'Not Found'
          })
      }
      const {notificationtitle,notificationmessage,notificationtype,notificationstatus,scheduletime,targetedusers} = req.body;
      if(notificationtitle) notification.notificationtitle = notificationtitle;
      if(notificationmessage) notification.notificationmessage = notificationmessage;
      if(notificationtype) notification.notificationtype = notificationtype;
      if(notificationstatus) notification.notificationstatus = notificationstatus;
      if(scheduletime) notification.scheduletime = scheduletime;
      if(targetedusers) notification.targetedusers = targetedusers;
      
      if(notification.sendnow === true){
         return res.status(400).json({
            success: false,
            statuscode: 400,
            message: 'The Notification has been sent, cannot update',
            error: 'Bad Request'
         })
      }
      const updateNotification = await notifi.findByIdAndUpdate(notid,notification,{new: true});
      return res.status(200).json({
         success: true,
         statuscode: 200,
         message: 'Notification updated successfully',
         data: updateNotification
      })
   }
   catch(error){
      return res.status(500).json({
         success: false,
         statuscode: 500,
         message: 'Internal Server Error',
         error: error.message
      })
   }
}

exports.deletenotification = async(req,res) => {
   try{
      const {notid} = req.params;
      if(!notid){
         return res.status(400).json({
            success: false,
            statuscode: 400,
            message: 'Notification ID is required',
            error: 'Bad Request'
         })
      }
      const notification = await notifi.findById(notid);
      if(!notification){
         return res.status(404).json({
            success: false,
            statuscode: 404,
            message: 'Notification not found',
            error: 'Not Found'
         })
      }
      if(notification.sendnow === true){
         return res.status(400).json({
            success: false,
            statuscode: 400,
            message: 'Notification has been sent, cannot delete',
            error: 'Bad Request'
         })
      }
      await notification.deleteOne();
      return res.status(200).json({
         success: true,
         statuscode: 200,
         message: 'Notification deleted successfully'
      })
   }catch(error){
      return res.status(500).json({
         success: false,
         statuscode: 500,
         message: 'Internal Server Error',
         error: error.message
      })
   }
}

exports.getallnotifications = async(req,res)=>{
   try{
    const page = parseInt(req.query.page) || 1 ;
    const limit = parseInt(req.query.limit) || 10 ;
    const skip = (page - 1) * limit
     const allnotifications = await notifi
     .find()
     .sort({createdAt: -1})
     .skip(skip)
     .limit(limit)
     .lean()
     if(!allnotifications || allnotifications.length === 0){
        return res.status(400).json({
           success: false,
           statuscode: 400,
           message: 'No notifications found',
           error: 'Bad Request'
        })
     }
     const total = await notifi.countDocuments();
     return res.status(200).json({
        success: true,
        statuscode: 200,
        message: 'Notifications fetched successfully',
        totalpages: Math.ceil(total / limit),
        total,
        data: allnotifications,
     })

   }catch(error){
      return res.status(500).json({
         success: false,
         statuscode: 500,
         message: 'Internal Server Error',
         error: error.message
      })
   }
}