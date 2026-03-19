const Rooms = require("../models/rooms")
const accommodations = require("../models/accommodations")
const mongoose = require("mongoose")
const { deleteOldImages } = require("../middlewares/S3_bucket.js");
const PricingMatrix = require("../models/PricingSchema.js")
const amenities = require("../models/amenities")

exports.createRoom = async(req,res) => {
    try{
        const {id} = req.params;
        //instalize the req body
        const {
            room_type,
            beds_available,
            no_of_guests,
            no_of_childrens,
            room_amenities,
            room_description,
            rooms_available
        } = req.body;
        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Invalid ID",
                error: "Bad Request"
            })
        }
        //check all the fields are enter or not 
        if(!room_type || !beds_available || !no_of_guests || !room_amenities || !room_description || !rooms_available){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Bad Request",
                error: "Bad Request"
            })
        }
        //check the accommodation is there or not
        const isvalid_accommodation = await accommodations.findById(id) 
        if(!isvalid_accommodation){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: 'Accommodation not found',
                error: 'Bad Request'
            })
        }
        //check the images are there or not
        if(!req.files || !req.files.length === 0){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "images is required",
                error: "Bad Request"
            })
        }
        // Get the S3 URLs from the uploaded files
        const roomImages = req.files.map(file => file.location);
        for(let i = 0 ; i < room_amenities.length; i++){
          const isvalid_amenity = await amenities.find({amenity_name: room_amenities[i]})
          if(!isvalid_amenity){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: 'Amenity not found',
                error: 'Bad Request'
            })
          }
        }
        // if(room_amenities === String){
        //   room_amenities = room_amenities.split(",").map((amenity) => amenity.trim())
        // }
        const newroom = await Rooms.create({
            accommodation_id: id,
            room_type,
            beds_available: beds_available,
            no_of_guests,
            no_of_childrens,
            room_amenities:room_amenities.split(",").map((amenity) => amenity.trim()),
            room_images_url: roomImages, // Using the S3 URLs
            room_description,
            rooms_available
        })

        if(!newroom){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Bad Request",
                error: "Bad Request"
            })
        }

        //update accommodation
        isvalid_accommodation.room_id.push(newroom._id)
        await isvalid_accommodation.save()

        // Parse pricings from form data
        let pricings = [];
        try {
            pricings = typeof req.body.pricings === 'string' ? JSON.parse(req.body.pricings) : req.body.pricings;
            // Ensure pricings is an array
            pricings = Array.isArray(pricings) ? pricings : [pricings];
        } catch (error) {
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Invalid pricings format. Should be a valid JSON array",
                error: error.message
            });
        }

        if(!pricings || pricings.length === 0){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Pricings should be an array",
                error: "Bad Request"
            })
        }
        let existingpricing = await PricingMatrix.findOne({
            accommodation_id: id,
            room_id: newroom._id
        })
        if(!existingpricing){
            existingpricing = await PricingMatrix.create({
                accommodation_id: id,
                room_id: newroom._id,
                pricing: []
            })
            newroom.pricing_id = existingpricing._id
            await newroom.save()
            isvalid_accommodation.pricing_ids.push(existingpricing._id)
            await isvalid_accommodation.save()
        }

        for(const {price, price_type} of pricings){
            const exists = existingpricing.pricing.some(
                (p) => p.price === price && p.price_type === price_type
            )
            if(!exists){
                existingpricing.pricing.push({price, price_type})
            }
        }
        await existingpricing.save()
        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: "Room and Pricing created successfully",
            newroom
        })

    }catch(error){
        return res.status(500).json({
            success: false,
            statuscode: 500,
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.updateRoom = async(req,res) => {
    try{
        const {id} = req.params;
        //instalize the req body with updated fields
        const {room_type,
            beds_available,
            no_of_guests,
            no_of_childrens,
            room_amenities,
            room_description,
            rooms_available} = req.body;

        //check the room is there or not
       const is_room_there = await Rooms.findById(id)
       if(!is_room_there){
        return res.status(400).json({
            success: false,
            statuscode: 400,
            message: "Room not found",
            error: "Bad Request"
        })
       }

       //update room query
       const updatedRoom = await Rooms.findByIdAndUpdate(id, {
        room_type,
        beds_available,
        no_of_guests,
        no_of_childrens,
        room_amenities,
        room_description,
        rooms_available
       }, {new: true})

       if(!updatedRoom){
        return res.status(400).json({
            success: false,
            statuscode: 400,
            message: "Room not found",
            error: "Bad Request"
        })
       }
       //response if the room is updated
       return res.status(200).json({
        success: true,
        statuscode: 200,
        message: "Room updated successfully"
       })
    }catch(error){
        return res.status(500).json({
            success: false,
            statuscode: 500,
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.deleteRoom = async(req,res) => {
    try{
        const {id} = req.params;
        //check the room is there or not
        const is_room_there = await Rooms.findById(id)
        if(!is_room_there){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Room not found",
                error: "Bad Request"
            })
        }
        const imagestodelete = is_room_there.room_images_url.map((url) => {
            return decodeURIComponent(new URL(url).pathname).substring(1); 
          });
        //delete room query
        await Rooms.findByIdAndDelete(id)
        
        //update accommodation
        await accommodations.findByIdAndUpdate(is_room_there.accommodation_id, {
            $pull: { room_id: id }
        })
        
        //response if the room is deleted
        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: "Room deleted successfully"
        })

    }catch(error){
        return res.status(500).json({
            success: false,
            statuscode: 500,
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.getallrooms = async(req,res) => {
    try{
        //instalize the req params
        const id = req.params.id;
        //check the accommodation is there or not
        const isvalid_accommodation = await accommodations.findById(id) 
        if(!isvalid_accommodation){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: 'Accommodation not found',
                error: 'Bad Request'
            })
        }
        //get all rooms query using accommodation id
        const rooms = await Rooms.find({accommodation_id: id}).select("-__v -createdAt -updatedAt")
        if(!rooms){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: 'Rooms not found',
                error: 'Bad Request'
            })
        }
        //response if the rooms are found
        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: 'Rooms found',
            rooms
        })
    }catch(error){
        return res.status(500).json({
            success: false,
            statuscode: 500,
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.addimagetoroom = async(req,res) => {
    try{
        const {id} = req.params;
        //check the given id is mongoose id or not
        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Invalid ID",
                error: "Bad Request"
            })
        }
        //chek the id is intialize or not
        if(!id){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Room ID is required",
                error: "Bad Request"
            })
        }
        //check the images are there or not
        if(!req.files || req.files.length === 0){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "images is required",
                error: "Bad Request"
            })
        }
        //get the images url from the uploaded files
        const imageUrls = req.files.map(file => file.location);
        //check the room is there or not
        const room = await Rooms.findById(id);
        //response if the room is not there
        if(!room){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Room not found",
                error: "Bad Request"
            })
        }
        //add the images to the room
        room.room_images_url.push(...imageUrls);
        //save the room
        await room.save();
        //response if the image is added successfully
        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: "Image added successfully",
            room
        })

    }catch(error){
        return res.status(500).json({
            success: false,
            statuscode: 500,
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.deletesingleimage = async(req,res) => {
    try{
        const {id} = req.params;
        const {index} = req.body;
        const imageindex = parseInt(index) 
        if(!id){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Room ID is required",
                error: "Bad Request"
            })
        }
        if (imageindex === undefined || imageindex === null || isNaN(imageindex)) {
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Image index is required",
                error: "Bad Request"
            });
        }
        //check the room is there or not
        const room = await Rooms.findById(id);
        if(!room){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Room not found",
                error: "Bad Request"
            })
        }
        //delete the image
        const imageToDelete = room.room_images_url[imageindex];
        //delete the image from s3
        await deleteOldImages(imageToDelete);
        //delete the image from the room
        room.room_images_url.splice(imageindex, 1);
        //save the room
        await room.save();
        //response if the image is deleted successfully
        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: "Image deleted successfully",
            room
        })
    }catch(error){
        return res.status(500).json({
            success: false,
            statuscode: 500,
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.replacesingleimage = async (req, res) => {
    try {
        const { id } = req.params;
        const { index } = req.body;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Room ID is required",
                error: "Bad Request"
            });
        }

        if (index === undefined || index === null || index === '') {
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Image index is required",
                error: "Bad Request"
            });
        }

        const imageIndex = parseInt(index);
        
        if (isNaN(imageIndex) || imageIndex < 0) {
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Invalid image index",
                error: "Bad Request"
            });
        }

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Image file is required",
                error: "Bad Request"
            });
        }

        // Check if the room exists
        const room = await Rooms.findById(id);
        if (!room) {
            return res.status(404).json({
                success: false,
                statuscode: 404,
                message: "Room not found",
                error: "Not Found"
            });
        }

        // Check if the index is valid
        if (imageIndex >= room.room_images_url.length) {
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: `Invalid image index. Room only has ${room.room_images_url.length} images.`,
                error: "Bad Request"
            });
        }

        // Delete the old image from S3
        if (room.room_images_url[imageIndex]) {
            await deleteOldImages(room.room_images_url[imageIndex]);
        }

        // Replace the image URL in the array
        room.room_images_url[imageIndex] = req.file.location; // Use the S3 URL
        
        // Save the updated room
        await room.save();

        // Return success response
        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: "Image replaced successfully",
            room
        });

    }catch(error){
        return res.status(500).json({
            success: false,
            statuscode: 500,
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.getroomById = async(req,res) => {
    try{
        const {id} = req.params;

        if(!id){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Room ID is required",
                error: "Bad Request"
            })
        }
        const roomdetails = await Rooms.findById(id)
        .populate({
            path: 'pricing_id',
            select: ' -__v -createdAt -updatedAt'
        })
        .populate({
            path: 'accommodation_id',
            select: '-__v -createdAt -updatedAt -room_id -pricing_ids'
        })
        .select('-__v -createdAt -updatedAt -bookings')
        if(!roomdetails){
            return res.status(404).json({
                success: false,
                statuscode: 404,
                message: "Room not found",
                error: "Not Found"
            })
        } 
        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: "Room details fetched successfully",
            roomdetails
        })

    }catch(error){
        return res.status(500).json({
            success: false,
            statuscode: 500,
            message: "Internal Server Error",
            error: error.message
        })
    }
}  

