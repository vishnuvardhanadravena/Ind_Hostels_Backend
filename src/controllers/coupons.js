const coupon = require('../models/couponSchema.js'); 
const accommodations = require('../models/accommodations.js'); 
const mongoose = require("mongoose")

// ✅Coupons ✅ 
exports.addcoupon = async (req,res) => {
   try{
    const {couponCode,discounttype,discountpercentage,discountamount,expireDate,minimumamount,status,targetedAccommodations} = req.body; 
    if(!couponCode){
      return res.status(400).json({
         success: false,
         statuscode: 500,
         message: 'Bad Request',
         error: 'Not Found'
      })
    }
    const ExistingCoupon = await coupon.findOne({couponCode:couponCode})
    if(ExistingCoupon){
       return res.status(400).json({
          success: false,
          statuscode: 400,
          message: 'Coupon Already Exists',
          error: "Bad Request"
       })
    }
    let Id
    if(req.user){
       Id = req.user._id
    }else if(req.vendor){
       Id = req.vendor._id
    }
    let targetedArray = [] 
    if(targetedAccommodations === "send all"){
      const allaccods = await accommodations.find().select("_id")
      targetedArray = allaccods.map((acc) => acc._id)
    }else if(typeof targetedAccommodations === "string"){
      targetedArray = [targetedAccommodations]
    }else if(Array.isArray(targetedAccommodations)){
      targetedArray = targetedAccommodations
    }
    const newCoupon = await coupon.create({
        couponCode:couponCode,
        discounttype:discounttype,
        discountpercentage:discountpercentage,
        discountamount:discountamount,
        expireDate: expireDate ? new Date(expireDate) : undefined,
        minimumamount:minimumamount,
        status:status,
        targetedAccommodations: targetedArray,
        Id: Id
    })
    return res.status(200).json({
       success: true,
       statuscode: 200,
       message: 'Coupon Added Successfully',
       data: newCoupon
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

exports.viewallcoupons = async(req,res) => {
   try{
     const page = parseInt(req.query.page) || 1;
     const limit = parseInt(req.query.limit) || 10;
     const skip = (page - 1) * limit;
      let allcoupons
      let total
    if(req.user){
        allcoupons = await coupon.find().skip(skip).limit(limit)
     if(!allcoupons){
        return res.status(404).json({
           succes: false,
           statuscode: 404,
           message: 'Coupons Not Found',
           error: 'Not Found'
        })
     }
      total = await coupon.find().countDocuments();
    }else if(req.vendor){
       allcoupons = await coupon.find({Id:req.vendor._id}).skip(skip).limit(limit)
       if(!allcoupons){
          return res.status(404).json({
              success: false,
              statuscode: 404,
              message: 'Coupons Not Found',
              error: 'Not Found'
          })
       }
        total = await coupon.find({Id:req.vendor._id}).countDocuments();
    }
     return res.status(200).json({
        success: true,
        statuscode: 200,
        message: 'Coupons Found',
        data: allcoupons,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
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

exports.deletecoupon = async(req,res) => {
   try{
    const{couponid} = req.params;
    console.log(req.params)
    if(!couponid){
        return res.status(400).json({
            success: false,
            statuscode: 400,
            message: 'Couponid is required',
            error: 'Bad Request'
        })
    }
    if(!mongoose.Types.ObjectId.isValid(couponid)){
       return res.status(400).json({
          success: false,
          statuscode: 400,
          message: 'Invalid Coupon ID',
          error: 'Bad Request'
       })
    }
    const deletedcoupon = await coupon.findByIdAndDelete(couponid)
    if(!coupon){
        return res.stauts(404).json({
           success: false,
           statuscode: 404,
           message: 'Coupon Not Found',
           error: 'Not Found'
        })
    }
    return res.status(200).json({
       success: true,
       statuscode: 200,
       message: 'Coupon deleted successfully'
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

exports.updatecoupon = async(req,res) => {
   try{
     const {id} = req.params;
     const {couponCode,discounttype,discountpercentage,discountamount,expireDate,minimumamount,status,targetedAccommodations} = req.body; 

     if(!id){
        return res.status(400).json({
           success: false,
           statuscode: 400,
           message: 'ID is required',
           error: 'Bad Request'
        })
     } 
     if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(400).json({
           success: false,
           statuscode: 400,
           message: 'Invalid ID',
           error: 'Bad Request'
        })
     } 
     const updatedcoupon = await coupon.findByIdAndUpdate(id,{couponCode,discounttype,discountpercentage,discountamount,expireDate,minimumamount,status,targetedAccommodations},{new:true})
     if(!updatedcoupon){
        return res.status(404).json({
           success: false,
           statuscode: 404,
           message: 'Coupon Not Found',
           error: 'Not Found'
        })
     } 
     return res.status(200).json({
        success: true,
        statuscode: 200,
        message: 'Coupon updated successfully',
        data: updatedcoupon
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

