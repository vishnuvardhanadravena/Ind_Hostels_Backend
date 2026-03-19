const amenities = require("../models/amenities.js");
const types = require("../models/stay.js");
const mongoose = require("mongoose");

exports.createAmenities = async (req, res) => {
    try {
        const { accommodation_type, ameniti_name, isroomamenities } = req.body;
        if (!accommodation_type || !ameniti_name || !isroomamenities) {
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "all fields are required",
                error: "Bad Request"
            })
        }
        if (!Array.isArray(accommodation_type)) {
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "accommodation_type must be an array",
                error: "Bad Request"
            })
        }
        for (const type of accommodation_type) {
            const isvalid_type = await types.findOne({ staytype: type })
            if (!isvalid_type) {
                return res.status(400).json({
                    success: false,
                    statuscode: 400,
                    message: "Type not found",
                    error: "Bad Request"
                })
            }
        }
        const existing = await amenities.aggregate([
            {
                $match: {
                    accommodation_type: { $in: accommodation_type },
                    ameniti_name: ameniti_name
                }
            }
        ])
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Amenities already exists",
                error: "Bad Request"
            })
        }
        const newamenities = await amenities.create({
            accommodation_type: accommodation_type,
            ameniti_name: ameniti_name,
            isroomamenities: isroomamenities
        })
        if (!newamenities) {
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Bad Request",
                error: "Bad Request"
            })
        }
        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: "Amenities created successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            statuscode: 500,
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.updateAmenities = async (req, res) => {
    try {
        const { id } = req.params;
        const { accommodation_type, ameniti_name, isroomamenities } = req.body;
        if (!accommodation_type || !ameniti_name) {
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Bad Request",
                error: "Bad Request"
            })
        }
        if (!Array.isArray(accommodation_type)) {
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Bad Request",
                error: "Bad Request"
            })
        }
        const is_exist = await amenities.findById(id);
        if (!is_exist) {
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Amenities not found",
                error: "Bad Request"
            })
        }
        const updateann = await amenities.findByIdAndUpdate(
            id,
            {
                accommodation_type,
                ameniti_name,
                isroomamenities
            },
            { new: true }
        );

        //   is_exist.accommodation_type = accommodation_type;
        //   is_exist.ameniti_name = ameniti_name;
        //   is_exist.isroomamenities = isroomamenities;
        //   await is_exist.save();
        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: "Amenities updated successfully",
            data: updateann
        })


    } catch (error) {
        return res.status(500).json({
            success: false,
            statuscode: 500,
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.deleteAmenities = async (req, res) => {
    try {
        const { id } = req.params;
        const is_exist = await amenities.findById(id);
        if (!is_exist) {
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Amenities not found",
                error: "Bad Request"
            })
        }
        await amenities.findByIdAndDelete(id);
        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: "Amenities deleted successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            statuscode: 500,
            message: "Internal Server Error",
            error: error.message
        })
    }
} 

exports.getaccommodationamenities = async (req,res) => {
    try{
        const {accommodation_type} = req.query;
        if(!accommodation_type){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Bad Request",
                error: "Bad Request"
            })
        }
        const amenitieslist = await amenities.find({
            accommodation_type: accommodation_type,
            isroomamenities: false
        }).select("ameniti_name")
        // .explain("executionStats")
        // console.log(JSON.stringify(amenitieslist, null, 2))
        if(!amenitieslist){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Amenities not found",
                error: "Bad Request"
            })
        }
        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: "Amenities fetched successfully",
            data: amenitieslist
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
exports.getroomamenities = async (req,res) => {
    try{
        const {accommodation_type} = req.query;
        if(!accommodation_type){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Bad Request",
                error: "Bad Request"
            })
        }
        const amenitieslist = await amenities.find({
            accommodation_type: accommodation_type,
            isroomamenities: true
        }).select("ameniti_name")
        // .explain("executionStats")
        // console.log(JSON.stringify(amenitieslist, null, 2))
        if(!amenitieslist){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Amenities not found",
                error: "Bad Request"
            })
        }
        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: "Amenities fetched successfully",
            data: amenitieslist
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

exports.getallamenities = async (req,res) => {
    try{
        const amenitieslist = await amenities.find().select("ameniti_name")
        if(!amenitieslist){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Amenities not found",
                error: "Bad Request"
            })
        }
        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: "Amenities fetched successfully",
            data: amenitieslist
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