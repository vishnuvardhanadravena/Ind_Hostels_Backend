const mongoose = require("mongoose");
const PricingMatrix = require("../models/PricingSchema.js");
const accommodations = require("../models/accommodations.js");
const rooms = require("../models/rooms.js");


//create a product matrix :

// exports.createPricingMatrix = async(req,res) => {
//     try{
//         const {accommodationid,roomid} = req.params;
//         //check the accommodationid and roomid is intialize or not 
//         if(!accommodationid || !roomid){
//             return res.status(400).json({
//                 success: false,
//                 message: "Invaid ID",
//                 error: "Bad Request",
//               });
//         }
//         //check the accommodationid is valid or not 
//         const isvalid_accommodation = await accommodations.findById(accommodationid);
//         //response if accommodation is not found 
//         if(!isvalid_accommodation){
//             return res.status(400).json({
//                 success: false,
//                 message: "Accommodation not found",
//                 error: "Bad Request",
//               });
//         }
//         //check the roomid is valid or not
//         const isvalid_room = await rooms.findById(roomid);
//         //response if room is not found 
//         if(!isvalid_room){
//             return res.status(400).json({
//                 success: false,
//                 message: "Room not found",
//                 error: "Bad Request",
//               });
//         }
//         //consider the pricings as array 
//         const pricings = req.body;
//         //check the pricings is array or not 
//         if(!Array.isArray(pricings)){
//             return res.status(400).json({
//                 success: false,
//                 message: "Pricings should be an array",
//                 error: "Bad Request",
//               });
//         }
//         //check the pricings is empty or not 
//         if(pricings.length === 0){
//             return res.status(400).json({
//                 success: false,
//                 message: "Pricings should not be empty",
//                 error: "Bad Request",
//               });
//         }
//          for(const pricing of pricings){
//             const {price,price_type} = pricing;
//             if(!price || !price_type){
//                 return res.status(400).json({
//                     success: false,
//                     message: "Price and price type are required",
//                     error: "Bad Request",
//                   });
//             }
//             const isvalid_pricing = await PricingMatrix.findOne({
//                 accommodation_id: accommodationid,
//                 room_id: roomid,
//                 pricing: {$elemMatch: {price: price, price_type: price_type}}
//             });
//             if(isvalid_pricing){
//                 return res.status(400).json({
//                     success: false,
//                     message: "Pricing already exists",
//                     error: "Bad Request",
//                   });
//             }
//             const newpricing = await PricingMatrix.create({
//                 accommodation_id: accommodationid,
//                 room_id: roomid,
//                 pricing: pricing
//             });
//             isvalid_room.pricing_id.push(newpricing._id);
//             await isvalid_room.save();
//         }
       
//         return res.status(200).json({
//             success: true,
//             message: "Product matrix created successfully",
//           });
//     }catch(error){
//         return res.status(500).json({
//             success: false,
//             message: "Internal Server Error",
//             error: error.message,
//           });
//     }
// }

exports.createPricingMatrix = async (req, res) => {
  try {
    const { accommodationid, roomid } = req.params;

    if (!accommodationid || !roomid) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID",
      });
    }

    const isvalid_accommodation = await accommodations.findById(accommodationid);
    if (!isvalid_accommodation) {
      return res.status(400).json({
        success: false,
        message: "Accommodation not found",
      });
    }

    let isvalid_room = await rooms.findById(roomid);
    if (!isvalid_room) {
      return res.status(400).json({
        success: false,
        message: "Room not found",
      });
    }

    const pricings = req.body;

    if (!Array.isArray(pricings) || pricings.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Pricings should be a non-empty array",
      });
    }

    // Find existing pricing matrix for the room
    let pricingMatrix = await PricingMatrix.findOne({
      accommodation_id: accommodationid,
      room_id: roomid
    });

    // If no document exists → create one
    if (!pricingMatrix) {
      pricingMatrix = await PricingMatrix.create({
        accommodation_id: accommodationid,
        room_id: roomid,
        pricing: [] 
      });

      // Save pricing ID directly (not array) and in room
      isvalid_room.pricing_id = pricingMatrix._id;
      await isvalid_room.save();
      
      // Save pricing ID in accommodation
      isvalid_accommodation.pricing_ids.push(pricingMatrix._id);
      await isvalid_accommodation.save();
    }

    // Add each pricing only if not duplicate
    for (const { price, price_type } of pricings) {

      const exists = pricingMatrix.pricing.some(
        (p) => p.price === price && p.price_type === price_type
      );

      if (!exists) {
        pricingMatrix.pricing.push({ price, price_type });
      }else{
        return res.status(400).json({
          success: false,
          message: "Pricing already exists",
        });
      }
    }

    // Save updated pricing list in the same document
    await pricingMatrix.save();

    return res.status(200).json({
      success: true,
      message: "Pricing added successfully",
      data: pricingMatrix
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.updatePricingMatrix = async(req,res) => {
   try{
     const {id} = req.params; 
     if(!id){
      return res.status(400).json({
        success: false,
        message: "Invaid ID",
        error: "Bad Request",
      });
     } 
     if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(400).json({
        success: false,
        message: "Invaid ID",
        error: "Bad Request",
      });
     }

     const product = await PricingMatrix .findById(id);
     if(!product){
      return res.status(404).json({
        success: false,
        message: "Product matrix not found",
        error: "Not Found",
      });
     }
     const allowedvalues = {pricing:"pricing"};
     const update = req.body 
     if(!update){
      return res.status(400).json({
        success: false,
        message: "No update provided",
        error: "Bad Request",
      });
     }
     let updatedata = {};
     for(const key in update){
      if(allowedvalues[key]){
        updatedata[allowedvalues[key]] = update[key];
      }
     }
     updatedata = await  PricingMatrix.findByIdAndUpdate(id,updatedata,{new:true});
     if(!updatedata){
      return res.status(404).json({
        success: false,
        message: "Product matrix not found",
        error: "Not Found",
      });
     }
     return res.status(200).json({
      success: true,
      message: "Product matrix updated successfully",
     });

   }catch(error){
     return res.status(500).json({
        success: false,
        statuscode: 500,
        message: "Internal Server Error",
        error: error.message,
     });
   }
};

//read product_matrix :
exports.getPricingMatrixById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invaid ID",
        error: "Bad Request",
      });
    }

    // let product = await accommodations.findById(id);

    // if (!product) {
    //   product = await pots.findById(id);

    //   if (!product) {
    //     return res.status(404).json({
    //       success: false,
    //       message: "Product not found",
    //       error: "Not Found",
    //     });
    //   }
    // }
    const matrix = await PricingMatrix.find({ room_id: id }).select('-__v')
    if (!matrix || matrix.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pricing matrix not found",
        error: "Not Found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Pricing matrix retrieved successfully",
      matrix,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//delete pproduct_matrix :
exports.deletePricingMatrix = async (req, res) => {
  try {
    const { id,priceid } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(priceid)) {
      return res.status(401).json({
        success: true,
        message: "Invalid ID",
        error: "Not Found",
      });
    }

      const matrix_response = await PricingMatrix.findById(id);
      if (!matrix_response) {
        return res.status(404).json({
          success: true,
          message: "product matrix not found",
          error: "Bad Request",
        });
      }
   // First, update the pricing matrix to remove the specific pricing entry
      const updatedMatrix = await PricingMatrix.findByIdAndUpdate(
          id,
          { $pull: { pricing: { _id: priceid } } },
          { new: true }
      );

      if (!updatedMatrix) {
          return res.status(404).json({
              success: false,
              message: "Pricing matrix not found"
          });
      }

      // Check if there are no more pricing entries left
      if (updatedMatrix.pricing.length === 0) {
          await rooms.findByIdAndUpdate(
              updatedMatrix.room_id,
              { $pull: { pricingid: id } }
          )
          await accommodations.findByIdAndUpdate(
              updatedMatrix.accommodation_id,
              { $pull: { pricing_ids: id } }
          )
          await PricingMatrix.findByIdAndDelete(id);
      }


    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: "product matrix deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
