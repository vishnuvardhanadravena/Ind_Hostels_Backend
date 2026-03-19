const reviews = require("../models/reviewschema.js");
const accommodations = require("../models/accommodations.js");
const orders = require('../models/ordersSchema.js');
const mongoose = require("mongoose");


//rating a product :
exports.createReview = async (req, res) => {
  try {
      const { id } = req.params 
      if(!mongoose.Types.ObjectId.isValid(id)){
         return res.status(400).json({
            success: false,
            statuscode: 400,
            message: 'Invalid product ID',
         })
      }
      const { aboutstay, rating, verifiedstay,stayeddate,roomtype} = req.body;
      //console.log(rating)
      if(!rating || rating < 1 || rating > 5){
         return res.status(400).json({
           success: false,
           statuscode: 400,
           message: 'Invalid Rating',
           error: 'Bad Request'
         })
      }

      // Make review image optional
    //   const reviewimage = req.file ? req.file.location : undefined;

    //  if(!req.user._id){
    //    return res.status(401).json({
    //      success: false,
    //      statuscode: 401,
    //      message: 'Unauthorized',
    //    })
    //  }


     // Check if the property  exists or not
    const property = await accommodations.findById(id);

    if (!property) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: 'Accommodation not found',
        error: 'Not Found'
      });
    }
     const existingreview = await reviews.findOne({productId: id, userId: req.user._id})
     if(existingreview){
        return res.status(400).json({
           success: false,
           statuscode: 400,
           message: 'You have already rated this product'
        })
     }
     const bookingdone = await orders.findOne({userId: req.user._id,accommodationId: id})
     console.log(bookingdone)
     if(!bookingdone){
        return res.status(400).json({
           success: false,
           statuscode: 400,
           message: 'You have not yet booked or checkin  in the accommodation u can\'t add review to this product'
        })
     }
     // Handle facilities whether it comes as array or comma-separated string
    //  const facilitiesArray = Array.isArray(facilities) 
    //    ? facilities 
    //    : typeof facilities === 'string' 
    //      ? facilities.split(',').map(facility => facility.trim())
    //      : [];

     const newreview = await reviews.create({
         propertyid: id,
         userId: req.user._id,
         aboutstay,
         rating: Number(rating), // Ensure rating is a number
         verifiedstay,
         stayeddate,
         roomtype,
     })

     if(!newreview){
        return res.status(400).json({
           success: false,
           statuscode: 400,
           message: 'Failed to add the review',
           error: 'Bad Request'
        })
     }
     return res.status(201).json({
       success: true,
       statuscode: 201,
       message: 'Review posted successfully',
       review: newreview
     }) 
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while posting review",
      error: error.message,
    });
  }
};

//get a sinfle rating of a product :
exports.getReviewsByProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: 'Invalid product Id',
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;


    // const product = await products.findById(id);
    // if (!product) {
    //   return res.status(404).json({
    //     success: false,
    //     statuscode: 404,
    //     message: 'Product not found',
    //   });
    // }

    // Fetch all reviews for this product
    const allreviews = await reviews
      .find({ propertyid: id }) // ensure productType matches
      .sort({ createdAt: -1 })
      .populate({
        path: 'userId',
        select: 'fullname email profileUrl',
      })
      .skip(skip)
      .limit(limit)
      .lean();

    if (!allreviews || allreviews.length === 0) {
      return res.status(200).json({
        success: true,
        statuscode: 200,
        message: 'No reviews found for this product',
      });
    }

    //Calculate average rating
    const aggregation = await reviews.aggregate([
      { $match: { 
          propertyid: new mongoose.Types.ObjectId(id)
      }},
      {
        $group: {
          _id: '$propertyid',
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
          fiveStar: { $sum: { $cond: [{ $eq: [ "$rating", 5 ] }, 1, 0 ] } },
          fourStar: { $sum: { $cond: [ { $eq: [ "$rating", 4 ] }, 1, 0 ] } },
          threeStar: { $sum: { $cond: [ { $eq: [ "$rating", 3 ] }, 1, 0 ] } },
          twoStar: { $sum: { $cond: [ { $eq: [ "$rating", 2 ] }, 1, 0 ] } },
          oneStar: { $sum: { $cond: [ { $eq: [ "$rating", 1 ] }, 1, 0 ] } },
        },
      },
    ]);

    const avgRating = aggregation[0]?.averageRating || 0;
    const totalRatings = aggregation[0]?.totalRatings || 0;
    //console.log(totalRatings)

    // Save updated rating in product document
    // product.rating = Number(avgRating.toFixed(1));
    // await product.save();

    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: 'Reviews fetched successfully',
      data: {
        reviews: allreviews,
        averageRating: Number(avgRating.toFixed(1)),
        count: allreviews.length,
        totalRatings,
        totalpages: Math.ceil(totalRatings / limit),
        page
        // fiveStar: aggregation[0]?.fiveStar || 0,
        // fourStar: aggregation[0]?.fourStar || 0,
        // threeStar: aggregation[0]?.threeStar || 0,
        // twoStar: aggregation[0]?.twoStar || 0,
        // oneStar: aggregation[0]?.oneStar || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error while fetching reviews',
      error: error.message,
    });
  }
};

exports.updatereview = async(req,res) => {
    try{
        const {id} = req.params
        const {helpful, nothelpful} = req.body
        if(!id){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: 'Invalid ID',
            })
        }

        const review_res = await reviews.findById(id)
        if(!review_res){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: 'Review not found',
            })
        }
       const isexisting = review_res.usersids.includes(req.user._id)
       if(isexisting){
        return res.status(400).json({
            success: false,
            statuscode: 400,
            message: 'You have already helped this review',
        })
       }
        if(helpful === 'true'){
            review_res.helpful += 1
        }
        if(nothelpful === 'true'){
            review_res.nothelpful += 1
        }

        review_res.usersids.push(req.user._id)
        await review_res.save()
        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: 'Review updated successfully',
            data: review_res
        })

    }catch(error){
        return res.status(500).json({
            success: false,
            statuscode: 500,
            message: 'Error while updating review',
            error: error.message,
        })
    }
}




exports.getrandomreviews = async(req,res) => {
   try{
    const allreviews = await reviews.aggregate([
      {
            '$match': {
              'rating': 5
            }
      },
      {
        '$lookup': {
          'from': 'users', 
          'localField': 'userId', 
          'foreignField': '_id', 
          'as': 'user'
        }
      }, {
        '$unwind': {
          'path': '$user'
        }
      }, {
        '$sample': {
          'size': 4
        }
      }, {
        '$project': {
          'propertyid': 1, 
          'aboutstay': 1, 
          'rating': 1, 
          'helpful': 1,
          'nothelpful': 1,
          'userId': 1,
          'user.full_name': 1,
          'user.email': 1,
          'user.profileUrl': 1
        }
      }
    ]);
    if(!allreviews){
       return res.status(400).json({
         success: false,
         statuscode: 400,
         message: 'No reviews found',
         error: 'Not Found'
       })
    }
    return res.status(200).json({
       success: true,
       statuscode: 200,
       message: 'Reviews fetched successfully',
       data: allreviews
    })
   }catch(error){
     return res.status(500).json({
       success: false,
       statuscode: 500,
       message: 'Error while fetching reviews',
       error: error.message
     })
   }
}