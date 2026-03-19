const rooms = require("../models/rooms.js");
const PricingMatrix = require("../models/PricingSchema.js");
const { default: mongoose } = require("mongoose");
const accommodations = require("../models/accommodations.js");
const orders = require('../models/ordersSchema.js');
const categories = require("../models/categoriesschema.js");
const subcategories = require('../models/subcategoryschema.js');
const { deleteOldImages } = require("../middlewares/S3_bucket.js");
const types = require("../models/stay.js");
const vendors = require("../models/vendors.js")
const { vendorAccountCreatedTemplate } = require("../utils/emailTemplates.js")
const sendEmail = require("../utils/sendEmail.js");
const reviews = require("../models/reviewschema.js")
const Amenities = require("../models/amenities.js")
const helper = require("../middlewares/helper.js")
const { normalizeDate } = require("../middlewares/authUser.js");
const recent = require("../models/recentlyviews.js")
const global = require('../models/globalsearch.js')
//const accommodations = require("../models/accommodations.js");

// Accommodations
//crud operations of the accommodations
exports.createAccommodation = async (req, res) => {
  try {
    let {
      property_name,
      property_description,
      property_type,
      category_name,
      city,
      area,
      address,
      lat,
      lont,
      amenities,
      room_types,
      check_in_time,
      check_out_time,
      cacellation_policy,
      host_contact,
      host_name,
      tax,
      tax_amount,
      isverified,
      vendorname,
      vendoremail,
      vendorphone,
      vendorcity,
      vendorstate,
      vendoraddress,
      vendorpassword,
      locationurl,
      isbestfor,
      nearby,
    } = req.body;
     
    //check all the fields are enter or not 
    if (!property_name ||
      !property_description ||
      !property_type ||
      !category_name ||
      !city ||
      !area ||
      !address ||
      !amenities ||
      !room_types ||
      !cacellation_policy ||
      !host_contact ||
      !host_name ||
      !tax ||
      !tax_amount ||
      !isverified ||
      !vendorname ||
      !vendoremail ||
      !vendorphone ||
      !vendorcity ||
      !vendorstate ||
      !vendoraddress ||
      !vendorpassword ||
      !isbestfor ||
      !nearby
    ) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: "All fields are required",
        error: "Bad Request",
      });
    }
    city = city
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[-_]/g, " ") // convert dashes/underscores to space
      .replace(/\s+/g, ""); // remove all spaces
    area = area 
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[-_]/g, " ") // convert dashes/underscores to space
      .replace(/\s+/g, ""); // remove all spaces

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!])[A-Za-z\d@#$%^&+=!]{8,}$/;
    if (!passwordRegex.test(vendorpassword)) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: "Password must contain at least 8 characters, including one uppercase letter, one number, and one special character.",
        error: "Bad Request",
      });
    }
    //check the property type is there or not in db

    const [isvalid_type,isvalid_category] = await Promise.all([
       types.findOne({ staytype: property_type}),
       categories.findOne({ category_name: category_name})
    ])
    //const isvalid_type = await types.findOne({ staytype: property_type })
    if (!isvalid_type) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: "Type not found",
        error: "Bad Request",
      });
    }
    //check the category is there or not in db
    //const isvalid_category = await categories.findOne({ category_name: category_name })
    if (!isvalid_category) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: "Category not found",
        error: "Bad Request",
      });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: "No files uploaded",
        error: "Bad Request",
      });
    }
    //console.log('files received:',req.files)
    const [imageUrls,Documents] = await Promise.all([
       req.files['images'].map((file) => file.location),
       req.files['docs'].map((file) => file.location)
    ])
    //const imageUrls = req.files['images'].map((file) => file.location)
    //const Documents = req.files['docs'].map((file) => file.location)


    for (let i = 0; i < amenities.length; i++) {
      const isvalid_amenity = await Amenities.find({ ameniti_name: amenities[i] })
      if (!isvalid_amenity) {
        return res.status(400).json({
          success: false,
          statuscode: 400,
          message: "Amenity not found",
          error: "Bad Request",
        });
      }
    }

    // let bestForArr = Array.isArray(isbestfor)
    //   ? isbestfor
    //   : String(isbestfor).split(",").map(x => x.trim());

    let nearbyArr = Array.isArray(nearby)
      ? nearby
      : String(nearby).split(",").map(x => x.trim());

    if ( !Array.isArray(nearbyArr)) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: "Nearby or isbestfor is not an array",
        error: "Bad Request",
      });
    }

    //create a new accommodation
    const newaccommodation = await accommodations.create({
      property_name,
      property_description,
      property_type,
      category_name,
      location: {
        city,
        area,
        address,
        locationurl,
        lat,
        lont
      },
      amenities: amenities.split(",").map((amenity) => amenity.trim()),
      room_types: room_types.split(",").map((room_type) => room_type.toString().trim().toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, "")),
      check_in_time,
      check_out_time,
      cancellation_policy: cacellation_policy,
      host_details: {
        host_contact,
        host_name
      },
      images_url: imageUrls,
      tax,
      tax_amount,
      isverified,
      isbestfor: isbestfor,
      nearby: nearbyArr,
    })

    if (!newaccommodation) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: "Accommodation not created",
        error: "Bad Request",
      });
    }
    //creatinon of  vendor for perticular accomidation 
    const existingvendor = await vendors.findOne({
      phone: vendorphone
    });

    if (existingvendor) {
      newaccommodation.vendor_id = existingvendor._id;
      await newaccommodation.save();
      return res.status(200).json({
        success: true,
        statuscode: 200,
        message: "Accommodation created successfully",
        data: newaccommodation

      });
    }
    const newvendor = await vendors.create({
      full_name: vendorname,
      email: vendoremail,
      phone: vendorphone,
      address: {
        city: vendorcity,
        state: vendorstate,
        address: vendoraddress
      },
      password: vendorpassword,
      status: "active",
      documents: Documents
    })

    // Prepare updates before saving
    newaccommodation.vendor_id = newvendor._id;

    // Run both tasks in parallel
    await Promise.all([
      newaccommodation.save(),
      sendEmail.sendEmail({
        to: vendoremail,
        subject: "Account Creation",
        text: vendorAccountCreatedTemplate(vendorname, vendorphone, vendorpassword),
      })
    ]);

    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: "Accommodation created successfully",
      data: newaccommodation
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.addaccommodationimages = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: 'Invalid ID'
      })
    }
    const isvalid_product = await accommodations.findById(id)
    if (!isvalid_product) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: 'Product not found',
        error: 'Bad Request'
      })
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: 'files should not be empty',
        error: 'Bad Request'
      })
    }
    const imageUrls = req.files.map((file) => file.location)
    isvalid_product.images_url.push(...imageUrls)

    //save the product 
    await isvalid_product.save()
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: 'Images added successfully'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: 'Internal Server Error',
      error: error.message
    })
  }
};

exports.deletesingleimage = async (req, res) => {
  try {
    const { id } = req.params
    const { index } = req.body
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: 'Invalid ID'
      })
    }

    const imgIndex = parseInt(index)

    if (imgIndex === undefined || isNaN(imgIndex)) {
      return res.status(400).json({
        success: false,
        message: "Valid image index is required",
        statuscode: 400,
        error: "Bad Request",
      });
    }

    // Fetch the product first
    const product = await accommodations.findById(id);
    if (!product) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: 'Product not found',
        error: 'Bad Request'
      })
    }
    if (!Array.isArray(product.images_url) || product.images_url.length === 0) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: 'No images found for this product',
        error: 'Bad Request'
      })
    }
    if (imgIndex < 0 || imgIndex >= product.images_url.length) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: 'Invalid index',
        error: 'Bad Request'
      })
    }

    const imageToDelete = product.images_url[imgIndex];
    const imagekey = decodeURIComponent(new URL(imageToDelete).pathname).substring(1);

    // Delete from S3
    try {
      await deleteOldImages([imagekey]);
    } catch (s3Error) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete image from S3",
        error: s3Error.message,
        statuscode: 500,
      });
    }

    // Remove the image from the array
    product.images_url.splice(imgIndex, 1);

    // Save updated product
    await product.save();

    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: 'Image deleted successfully',
      images_url: product.images_url
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: 'Internal Server Error',
      error: error.message
    })
  }
};

exports.replaceaccommodationimages = async (req, res) => {
  try {
    const { id } = req.params;

    // console.log('=== REQUEST DEBUG ===');
    // console.log('Params:', req.params);
    // console.log('Headers:', JSON.stringify(req.headers, null, 2));
    // console.log('Raw body:', req.body);
    // console.log('Files:', req.files);
    // console.log('Content-Type:', req.get('Content-Type'));
    // console.log('=== END DEBUG ===');

    // If we don't have indexes in the expected format, try to get them from the request
    if ((!req.body.indexes || !Array.isArray(req.body.indexes)) && req.body.indexesString) {
      try {
        req.body.indexes = JSON.parse(req.body.indexesString);
      } catch (e) {
        // If parsing fails, continue with the original indexes
      }
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        statuscode: 1,
        message: "Invalid ID",
        error: "Bad Request",
      });
    }

    let { indexes } = req.body;

    // Parse indexes string into an array
    if (typeof indexes === "string") {
      try {
        indexes = JSON.parse(indexes); // "[0,1]" → [0,1]
      } catch {
        indexes = [parseInt(indexes, 10)]; // "0" → [0]
      }
    }

    // Ensure it's always an array
    if (!Array.isArray(indexes)) {
      return res.status(400).json({
        success: false,
        statuscode: 2,
        message: "Indexes array is required in body",
        error: "Bad Request"
      });
    }


    if (!req.files || req.files.length !== indexes.length) {
      return res.status(400).json({
        success: false,
        statuscode: 3,
        message: `Number of images (${req.files?.length || 0}) must match number of indexes (${indexes.length})`,
        error: "Bad Request",
      });
    }

    const product_response = await accommodations.findById(id);
    if (!product_response) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
        error: "Not Found",
      });
    }

    const oldImageKeys = [];

    // Step 1: Collect keys of old images to delete
    for (let i = 0; i < indexes.length; i++) {
      const index = parseInt(indexes[i]);

      if (index >= product_response.images_url.length) continue;

      const oldUrl = product_response.images_url[index];
      if (oldUrl) {
        const key = decodeURIComponent(new URL(oldUrl).pathname).substring(1);
        oldImageKeys.push(key);
      }
    }

    // Step 2: Delete old images from S3
    await deleteOldImages(oldImageKeys);

    // Step 3: Replace with new images directly in product_response.images_url
    for (let i = 0; i < indexes.length; i++) {
      const index = parseInt(indexes[i]);
      if (index >= product_response.images_url.length) continue;

      product_response.images_url[index] = req.files[i].location; // assuming Multer-S3
    }

    await product_response.save();

    return res.status(200).json({
      success: true,
      message: "Images replaced successfully",
      updatedImages: product_response.images_url,
    });
  } catch (error) {
    //console.error("Error replacing images:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.updateAccommodation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: 'Invalid ID'
      })
    }

    // Fetch the current product to get existing prices
    const currentProduct = await accommodations.findById(id);
    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: 'Product not found',
        error: 'Not Found'
      });
    }

    Object.keys(req.body).forEach((key) => {
      if (req.body[key] === '') {
        delete req.body[key];
      }
    });
    // fields allowed for update
    const allowedNormalFields = [
      "property_name",
      "property_description",
      "property_type",
      "category_name",
      "amenities",
      "room_types",
      "check_in_time",
      "check_out_time",
      "cancellation_policy",
      "host_contact",
      "host_name",
      "tax",
      "tax_amount",
      "isverified",
      "locationurl",
      "isbestfor",
      "nearby",
      "reasonfornotverified",
      "deal_of_the_day",
      "deal_offer_percent"
    ];


    // start building update object
    const updateData = {};

    // Handle location fields
    if (req.body.city || req.body.area || req.body.address || req.body.host_name || req.body.host_contact) {
      updateData.location = currentProduct.location || {};
      updateData.host_details = currentProduct.host_details || {};
      if (req.body.city) updateData.location.city = req.body.city;
      if (req.body.area) updateData.location.area = req.body.area;
      if (req.body.address) updateData.location.address = req.body.address;
      if (req.body.host_name) updateData.host_details.host_name = req.body.host_name;
      if (req.body.host_contact) updateData.host_details.host_contact = req.body.host_contact;
    }

    // const allowedArrayFields = [
    //   "keybenifits",
    //   "howtouse",
    //   "ingredients",
    //   "skintypesusitability",
    // ];


    // const addToSetData = {};

    // handle normal fields (overwrite)
    allowedNormalFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // handle array fields (merge without duplicates)
    // allowedArrayFields.forEach((field) => {
    //   if (req.body[field] && Array.isArray(req.body[field])) {
    //     addToSetData[field] = { $each: req.body[field] };
    //   }
    // });

    // build final update query
    const finalUpdate = {};
    if (Object.keys(updateData).length > 0) {
      finalUpdate.$set = updateData;
    }

    // if (Object.keys(addToSetData).length > 0) {
    //   finalUpdate.$addToSet = addToSetData;
    // }

    // update product
    const updatedAccommodation = await accommodations.findByIdAndUpdate(id, finalUpdate, {
      new: true,
      runValidators: true,
    });
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: 'Product updated successfully',
      updatedAccommodation: updatedAccommodation
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//updating the product Images :
exports.updateImages = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(401).json({
        success: false,
        statuscode: 1,
        message: "invalid ID",
        error: "Bad Request",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(401).json({
        success: false,
        statuscode: 2,
        message: "files should not be empty",
        error: "Bad Request",
      });
    }
    const product_response = await products.findById(id);
    if (!product_response) {
      return res.status(404).json({
        success: false,
        statuscode: 3,
        message: "product not found",
        error: "Not Found",
      });
    }
    const oldImageKeys = product_response.imagesUrl.map((url) => {
      return decodeURIComponent(new URL(url).pathname).substring(1); // remove leading '/'
    });

    // const oldImageKeys = product.imagesUrl.map((url) => {
    //   const urlParts = url.split("/");
    //   return urlParts.slice(3).join("/");
    // });
    await deleteOldImages(oldImageKeys);
    // const newImageUrls = await uploadNewImages(req.files);
    const newImageUrls = req.files.map((file) => file.location);
    product_response.imagesUrl = newImageUrls;
    await product_response.save();
    return res.status(200).json({
      success: true,
      statuscode: 4,
      message: "product images updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server",
      error: error.message,
    });
  }
};

//delete a Product :
exports.deleteAccommodation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: 'Invalid ID',
        error: 'Bad Request'
      })
    }
    const product = await accommodations.findById(id)
    if (!product) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: 'Accommodation not found',
        error: 'Not Found'
      })
    }
    const imagestodelete = product.images_url.map((url) => {
      return decodeURIComponent(new URL(url).pathname).substring(1); 
    });
    await deleteOldImages(imagestodelete);
    await accommodations.findByIdAndDelete(id);
    const rooms_to_delete = await rooms.find({ accommodation_id: id })
    if (rooms_to_delete) {
      await rooms.deleteMany({ accommodation_id: id })
    }
    const pricing_to_delete = await PricingMatrix.find({ accommodation_id: id })
    if (pricing_to_delete) {
      await PricingMatrix.deleteMany({ accommodation_id: id })
    }

    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: 'Accommodation deleted succesfully'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//get and filter operations of accommodations

exports.getAccommodationById = async (req, res) => {
  try {
    const { id } = req.params;
    const { check_in_date, check_out_date } = req.query;
    let arounddata 
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    if (check_in_date && check_out_date) {
      // Convert dates
      const checkIn = new Date(check_in_date);
      const checkOut = new Date(check_out_date);
      const searchCheckIn = normalizeDate(checkIn);
      const searchCheckOut = normalizeDate(checkOut);

      // Fetch accommodation with rooms
      let accommodation = await accommodations
        .findById(id)
        .populate({
          path: "room_id",
          populate: {
            path: "pricing_id",
          },
          select: "-__v -createdAt -updatedAt",
        })
        .select("-__v -createdAt -updatedAt -pricing_ids")
        .lean()
     
      if (!accommodation || accommodation.isverified === false) {
        return res.status(404).json({
          success: false,
          message: "Accommodation not found or not verified",
          statuscode: 404,
          error: "Not Found",
        });
      }

      // FILTER AVAILABLE ROOMS
      accommodation.room_id = accommodation.room_id.filter((room) => {
        let bookedBeds = 0;

        room.bookings?.forEach((b) => {
          const bIn = normalizeDate(b.checkin);
          const bOut = normalizeDate(b.checkout);

          // Overlap condition
          if (searchCheckIn < bOut && searchCheckOut > bIn) {
            bookedBeds += b.bedCount;
          }
        });

        const availableBeds = room.beds_available - bookedBeds;
        return availableBeds > 0 && room.rooms_available > 0; // keep room if available
      });

      // GET REVIEW STATS
      const reviewStats = await reviews.aggregate([
        { $match: { propertyid: new mongoose.Types.ObjectId(id) } },
        {
          $group: {
            _id: "$propertyid",
            avgRating: { $avg: "$rating" },
            totalRatings: { $sum: 1 }
          }
        }
      ]);
      //console.log(reviewStats)
      const avgRating = reviewStats.length > 0 ? reviewStats[0].avgRating : 0;
      const totalRatings = reviewStats.length > 0 ? reviewStats[0].totalRatings : 0;

      accommodation.avgRating = avgRating;
      accommodation.totalRatings = totalRatings;

      // FIND RELATED ACCOMMODATIONS 
      let relatedAccommodations = await accommodations.find({
        category_name: accommodation.category_name,
        isverified: true,
        'location.city': { $regex: new RegExp(`^${accommodation.location.city}$`, "i") },
        _id: { $ne: id },
      })
        .populate({
          path: "room_id",
          populate: { path: "pricing_id" },
        })
        .select("-__v -createdAt -updatedAt -property_description -check_in_time -cancellation_policy -host_contact")
        .lean();
      // console.log(accommodation.category_name)
      // console.log(accommodation.location.city)
      // console.log(relatedAccommodations)
      //Filter rooms for each related accommodation
      relatedAccommodations = relatedAccommodations.map((acc) => {
        acc.room_id = acc.room_id.filter((room) => {
          let bookedBeds = 0;

          room.bookings?.forEach((b) => {
            const bIn = normalizeDate(b.checkin);
            const bOut = normalizeDate(b.checkout);

            if (searchCheckIn < bOut && searchCheckOut > bIn) {
              bookedBeds += b.bedCount;
            }
          });

          const availableBeds = room.totalBeds - bookedBeds;
          return availableBeds > 0;
        });

        return acc;
      });

      // Remove accommodations having 0 available rooms
      relatedAccommodations = relatedAccommodations.filter(
        (acc) => acc.room_id.length <= 0
      );
      for (let acc of relatedAccommodations) {
        const stats = await reviews.aggregate([
          { $match: { propertyid: acc._id } },
          {
            $group: {
              _id: "$propertyid",
              avgRating: { $avg: "$rating" },
              totalRatings: { $sum: 1 }
            }
          }
        ]);

        acc.avgRating = stats[0]?.avgRating || 0;
        acc.totalRatings = stats[0]?.totalRatings || 0; 
      }
      
      if(req.user && req.user._id){
          //console.log(arounddata)
        const recentdata = await recent.findOne({ user_id: req.user._id })
        if(!recentdata){
          const recentdata = new recent({
            user_id: req.user._id,
            accommodation_ids: [id],
          })
          await recentdata.save()
        }else{
          recentdata.accommodation_ids.push(id)
          await recentdata.save()
        }
      }
      
      return res.status(200).json({
        success: true,
        statuscode: 200,
        message: "Accommodation retrieved successfully",
        data: {
          ...accommodation,
          avgRating,
          totalRatings,
        },
        relatedAccommodations,
      });
    } else if (id) {

      // Fetch accommodation with rooms
      let accommodation = await accommodations
        .findById(id)
        .select("-__v -createdAt -updatedAt -pricing_ids")
        .populate({
          path: "room_id",
          populate: {
            path: "pricing_id",
            select: "-__v -createdAt -updatedAt",
          },
          select: "-__v -createdAt -updatedAt",
        })
        .lean();
      if (!accommodation || accommodation.isverified === false) {
        return res.status(404).json({
          success: false,
          message: "Accommodation not found or not verified",
          statuscode: 404,
          error: "Not Found",
        });
      }
      const stats = await reviews.aggregate([
        { $match: { propertyid: accommodation._id } },
        {
          $group: {
            _id: "$propertyid",
            avgRating: { $avg: "$rating" },
            totalRatings: { $sum: 1 }
          }
        }
      ]);
      const avgRating = stats.length > 0 ? stats[0].avgRating : 0;
      const totalRatings = stats.length > 0 ? stats[0].totalRatings : 0;

      accommodation.avgRating = avgRating;
      accommodation.totalRatings = totalRatings;
      // // FILTER AVAILABLE ROOMS
      // accommodation.room_id = accommodation.room_id.filter((room) => {
      //   let bookedBeds = 0;

      //   room.bookings?.forEach((b) => {
      //     const bIn = new Date(b.checkin);
      //     const bOut = new Date(b.checkout);

      //     // Overlap condition
      //     if (checkIn < bOut && checkOut > bIn) {
      //       bookedBeds += b.bedCount;
      //     }
      //   });

      //   const availableBeds = room.beds_available - bookedBeds;
      //  return availableBeds > 0 && room.rooms_available > 0; // keep room if available
      // });

      // FIND RELATED ACCOMMODATIONS 
      let relatedAccommodations = await accommodations.find({
        category_name: accommodation.category_name,
        isverified: true,
        'location.city': { $regex: new RegExp(`^${accommodation.location.city}$`, "i") },
        _id: { $ne: id },
      })
        .populate({
          path: "pricing_ids",
          select: ('-__v -createdAt -updatedAt')
        })
        .select("-__v -createdAt -updatedAt -property_description -check_in_time -cancellation_policy -host_contact")
        .lean();
        
      //console.log(accommodation.category_name)
      //console.log(accommodation.location.city)
      //console.log(relatedAccommodations)
      //Filter rooms for each related accommodation
      // relatedAccommodations = relatedAccommodations.map((acc) => {
      //   acc.room_id = acc.room_id.filter((room) => {
      //     let bookedBeds = 0;

      //     room.bookings?.forEach((b) => {
      //       const bIn = new Date(b.checkin);
      //       const bOut = new Date(b.checkout);

      //       if (checkIn < bOut && checkOut > bIn) {
      //         bookedBeds += b.bedCount;
      //       }
      //     });

      //     const availableBeds = room.totalBeds - bookedBeds;
      //     return availableBeds > 0;
      //   });

      //   return acc;
      // });

      // // Remove accommodations having 0 available rooms
      // relatedAccommodations = relatedAccommodations.filter(
      //   (acc) => acc.room_id.length <= 0
      // );
      // relatedAccommodations = relatedAccommodations.filter(
      //   (acc) => acc.room_id.length <= 0
      // );
      for (let acc of relatedAccommodations) {
        const stats = await reviews.aggregate([
          { $match: { propertyid: acc._id } },
          {
            $group: {
              _id: "$propertyid",
              avgRating: { $avg: "$rating" },
              totalRatings: { $sum: 1 }
            }
          }
        ]);

        acc.avgRating = stats[0]?.avgRating || 0;
        acc.totalRatings = stats[0]?.totalRatings || 0;
      }

      if(accommodation.location.lat && accommodation.location.lont){
         arounddata = await helper.getarounddata(accommodation.location.lat,accommodation.location.lont)
      }
      
      if(req.user && req.user._id){
          //console.log(arounddata)
        const recentdata = await recent.findOne({ user_id: req.user._id })
        if(!recentdata){
          const recentdata = new recent({
            user_id: req.user._id,
            accommodation_ids: [id],
          })
          await recentdata.save()
        }else{
          recentdata.accommodation_ids.push(id)
          await recentdata.save()
        }
      }
      
      return res.status(200).json({
        success: true,
        statuscode: 200,
        message: "Accommodation retrieved successfully",
        data: {
          ...accommodation,
          arounddata,
          avgRating,
          totalRatings
        },
        relatedAccommodations,
      });
    }

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      statuscode: 500,
      error: error.message,
    });
  }
};

//get all products :
exports.getAllAccommodations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    //const city = req.query.city || null;
    const area = req.query.area || null;
    const category_name = req.query.category_name || null;
    const type = req.query.type || null;

    //console.log({ area, category_name, type });

    // All types
    // All types
    if (type === "all") {
      // First, get the average rating and count for each property
      const reviewsAggregate = await mongoose.model('reviews').aggregate([
        {
          $group: {
            _id: "$propertyid",
            totalRatings: { $sum: 1 },
            averageRating: { $avg: "$rating" }
          }
        }
      ]);

      // Convert to a map for easy lookup
      const reviewsMap = {};
      reviewsAggregate.forEach(review => {
        reviewsMap[review._id.toString()] = {
          totalRatings: review.totalRatings,
          averageRating: review.averageRating
        };
      });

      let allaccommodations = await accommodations.find({ isverified: true })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'pricing_ids',
          select: "-__v -createdAt -updatedAt -_id -accommodation_id -room_id"
        })
        .select("-__v -createdAt -updatedAt -check_in_time -cancellation_policy -host_contact -room_id")
        .lean();

      const total = await accommodations.countDocuments({ isverified: true });

      // Add ratings info to each accommodation
      allaccommodations = allaccommodations.map(acc => {
        // Filter pricing if needed
        // if (acc.pricing_ids) {
        //   acc.pricing_ids = acc.pricing_ids.map((pm) => {
        //     if (pm && pm.pricing) {
        //       pm.pricing = pm.pricing.filter(p => p.price <= 1000);
        //     }
        //     return pm;
        //   });
        // }

        // Add ratings information
        const reviewInfo = reviewsMap[acc._id.toString()] || {
          totalRatings: 0,
          averageRating: 0
        };

        return {
          ...acc,
          totalRatings: reviewInfo.totalRatings,
          averageRating: reviewInfo.averageRating
        };
      });

      return res.status(200).json({
        success: true,
        statuscode: 200,
        page,
        data: allaccommodations,
        totalPages: Math.ceil(total / limit),
      });
    }
    
    // Filter by category_name
    else if (category_name) {
      // First, get the average rating and count for each property in this category
      const reviewsAggregate = await mongoose.model('reviews').aggregate([
        {
          $lookup: {
            from: 'accommodations',
            localField: 'propertyid',
            foreignField: '_id',
            as: 'accommodation'
          }
        },
        {
          $unwind: '$accommodation'
        },
        {
          $match: {
            'accommodation.category_name': category_name,
            'accommodation.isverified': true
          }
        },
        {
          $group: {
            _id: "$propertyid",
            totalRatings: { $sum: 1 },
            averageRating: { $avg: "$rating" }
          }
        }
      ]);

      // Convert to a map for easy lookup
      const reviewsMap = {};
      reviewsAggregate.forEach(review => {
        reviewsMap[review._id.toString()] = {
          totalRatings: review.totalRatings,
          averageRating: review.averageRating
        };
      });

      // Get accommodations with pagination
      let allaccommodations = await accommodations.find({
        category_name: category_name,
        isverified: true
      })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "pricing_ids",
          select: "-__v -createdAt -updatedAt"
        })
        .select("-__v -createdAt -updatedAt -check_in_time -cancellation_policy -host_contact -room_id")
        .lean();

      const total = await accommodations.countDocuments({
        category_name: category_name,
        isverified: true
      });

      // Add ratings info to each accommodation
      allaccommodations = allaccommodations.map(acc => ({
        ...acc,
        totalRatings: reviewsMap[acc._id.toString()]?.totalRatings || 0,
        averageRating: reviewsMap[acc._id.toString()]?.averageRating || 0
      }));

      return res.status(200).json({
        success: true,
        statuscode: 200,
        page: page,
        data: allaccommodations,
        totalPages: Math.ceil(total / limit),
      });
    }
    
    else if (type === "budget") {
      //console.log("budget")
      const pricings = await PricingMatrix.find({
        'pricing.price': { $lte: 1000 }
      })
      //.explain("executionStats")
      //console.log(JSON.stringify(pricings, null, 2))
      //console.log(pricings)

      // Get unique accommodation IDs
      const accoids = [...new Set(pricings.map(p => p.accommodation_id))];
      //console.log("Unique accommodation IDs:", accoids.length);
    
      const budgetAccommodations = await accommodations.aggregate([
        {
          $addFields: {
            pricing_ids: {
              $map: {
                input: '$pricing_ids',
                as: 'pid',
                in: { $toObjectId: '$$pid' }
              }
            }
          }
        },
        {
          $lookup: {
            from: 'pricingmatrixes',
            localField: 'pricing_ids',
            foreignField: '_id',
            as: 'pricingData'
          }
        },
        {
          $addFields: {
            pricingData: {
              $map: {
                input: '$pricingData',
                as: 'p',
                in: {
                  _id: '$$p._id',
                  accommodation_id:
                    '$$p.accommodation_id',
                  room_id: '$$p.room_id',
                  pricing: {
                    $filter: {
                      input: '$$p.pricing',
                      as: 'pr',
                      cond: {
                        $lte: ['$$pr.price', 1000]
                      }
                    }
                  }
                }
              }
            }
          }
        },
        {
          $addFields: {
            pricingData: {
              $filter: {
                input: '$pricingData',
                as: 'p',
                cond: {
                  $gt: [{ $size: '$$p.pricing' }, 0]
                }
              }
            }
          }
        },
        {
          $match: {
            'pricingData.0': { $exists: true }
          }
        },
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'propertyid',
            as: 'reviewsData'
          }
        },
        {
          $addFields: {
            totalRatings: {
              $round: [{ $sum: '$reviewsData.rating' }, 0]
            },
            averageRating: {
              $avg: '$reviewsData.rating'
            }
          }
        },
        {
          $match: {
            isverified: true
          }
        },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
            check_in_time: 0,
            cancellation_policy: 0,
            host_contact: 0,
            room_id: 0,
            pricing_ids: 0,
            reviewsData: 0,
          }
        }
      ]);


      const total = await accommodations.countDocuments({
        _id: { $in: accoids }
      });

      return res.status(200).json({
        success: true,
        statuscode: 200,
        page,
        data: budgetAccommodations,
        totalPages: Math.ceil(total / limit),
      });
    }

    else if (type === "premium") {
      const premimupricings = await PricingMatrix.find({
        'pricing.price': { $lte: 7000 }
      });
      const accoids = premimupricings.map(p => p.accommodation_id);
      const premiumAccommodations = await accommodations.aggregate([
        {
          $addFields: {
            pricing_ids: {
              $map: {
                input: '$pricing_ids',
                as: 'pid',
                in: { $toObjectId: '$$pid' }
              }
            }
          }
        },
        {
          $lookup: {
            from: 'pricingmatrixes',
            localField: 'pricing_ids',
            foreignField: '_id',
            as: 'pricingData'
          }
        },
        {
          $addFields: {
            pricingData: {
              $map: {
                input: '$pricingData',
                as: 'p',
                in: {
                  _id: '$$p._id',
                  accommodation_id:
                    '$$p.accommodation_id',
                  room_id: '$$p.room_id',
                  pricing: {
                    $filter: {
                      input: '$$p.pricing',
                      as: 'pr',
                      cond: {
                        $lte: ['$$pr.price', 7000]
                      }
                    }
                  }
                }
              }
            }
          }
        },
        {
          $addFields: {
            pricingData: {
              $filter: {
                input: '$pricingData',
                as: 'p',
                cond: {
                  $gt: [{ $size: '$$p.pricing' }, 0]
                }
              }
            }
          }
        },
        {
          $match: {
            'pricingData.0': { $exists: true }
          }
        },
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'propertyid',
            as: 'reviewsData'
          }
        },
        {
          $addFields: {
            totalRatings: {
              $round: [{ $sum: '$reviewsData.rating' }, 0]
            },
            averageRating: {
              $avg: '$reviewsData.rating'
            }
          }
        },
        {
          $match: {
            'isverified': true
          }
        },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
            check_in_time: 0,
            cancellation_policy: 0,
            host_contact: 0,
            room_id: 0,
            pricing_ids: 0,
            reviewsData: 0,
          }
        }
      ]);

      //  const total = await accommodations.countDocuments({
      //    _id: { $in: accoids }
      //  });

      return res.status(200).json({
        success: true,
        statuscode: 200,
        //page,
        data: premiumAccommodations,
        //totalPages: Math.ceil(total / limit),
      });
    }

    else if (type === "luxury") {
      const luxurypricings = await PricingMatrix.find({
        'pricing.price': { $gte: 10000 }
      })
      const accoids = luxurypricings.map(p => p.accommodation_id);
      //const pricingids = luxurypricings.map(p => p._id);
      const luxuryAccommodations = await accommodations.aggregate([
        {
          $addFields: {
            pricing_ids: {
              $map: {
                input: '$pricing_ids',
                as: 'pid',
                in: { $toObjectId: '$$pid' }
              }
            }
          }
        },
        {
          $lookup: {
            from: 'pricingmatrixes',
            localField: 'pricing_ids',
            foreignField: '_id',
            as: 'pricingData'
          }
        },
        {
          $addFields: {
            pricingData: {
              $map: {
                input: '$pricingData',
                as: 'p',
                in: {
                  _id: '$$p._id',
                  accommodation_id:
                    '$$p.accommodation_id',
                  room_id: '$$p.room_id',
                  pricing: {
                    $filter: {
                      input: '$$p.pricing',
                      as: 'pr',
                      cond: {
                        $lte: ['$$pr.price', 10000]
                      }
                    }
                  }
                }
              }
            }
          }
        },
        {
          $addFields: {
            pricingData: {
              $filter: {
                input: '$pricingData',
                as: 'p',
                cond: {
                  $gt: [{ $size: '$$p.pricing' }, 0]
                }
              }
            }
          }
        },
        {
          $match: {
            'pricingData.0': { $exists: true }
          }
        },
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'propertyid',
            as: 'reviewsData'
          }
        },
        {
          $addFields: {
            totalRatings: {
              $round: [{ $sum: '$reviewsData.rating' }, 0]
            },
            averageRating: {
              $avg: '$reviewsData.rating'
            }
          }
        },
        {
          $match: {
            'isverified': true
          }
        },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
            check_in_time: 0,
            cancellation_policy: 0,
            host_contact: 0,
            room_id: 0,
            pricing_ids: 0,
            reviewsData: 0,
          }
        }
      ]);


      // const total = await accommodations.countDocuments({
      //   _id: { $in: accoids }
      // });

      return res.status(200).json({
        success: true,
        statuscode: 200,
        //page,
        data: luxuryAccommodations,
        //totalPages: Math.ceil(total / limit),
      });
    }
    else {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: "Invalid type or category_name or something went wrong",

      })
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.getFeaturedAccommodationsbycity = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const city = req.query.city || null;
    const type = req.query.type || null;

    //console.log({ area, category_name, type });

    // All types
    // All types
    if (type === "all") {
      // First, get the average rating and count for each property
      const reviewsAggregate = await mongoose.model('reviews').aggregate([
        {
          $group: {
            _id: "$propertyid",
            totalRatings: { $sum: 1 },
            averageRating: { $avg: "$rating" }
          }
        }
      ]);

      // Convert to a map for easy lookup
      const reviewsMap = {};
      reviewsAggregate.forEach(review => {
        reviewsMap[review._id.toString()] = {
          totalRatings: review.totalRatings,
          averageRating: review.averageRating
        };
      });

      let allaccommodations = await accommodations.find({ isverified: true, 'location.city': city })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'pricing_ids',
          select: "-__v -createdAt -updatedAt -_id -accommodation_id -room_id"
        })
        .select("-__v -createdAt -updatedAt -check_in_time -cancellation_policy -host_contact -room_id")
        .lean();

      const total = await accommodations.countDocuments({ isverified: true, 'location.city': city });

      // Add ratings info to each accommodation
      allaccommodations = allaccommodations.map(acc => {
        // Filter pricing if needed
        // if (acc.pricing_ids) {
        //   acc.pricing_ids = acc.pricing_ids.map((pm) => {
        //     if (pm && pm.pricing) {
        //       pm.pricing = pm.pricing.filter(p => p.price <= 1000);
        //     }
        //     return pm;
        //   });
        // }

        // Add ratings information
        const reviewInfo = reviewsMap[acc._id.toString()] || {
          totalRatings: 0,
          averageRating: 0
        };

        return {
          ...acc,
          totalRatings: reviewInfo.totalRatings,
          averageRating: reviewInfo.averageRating
        };
      });

      return res.status(200).json({
        success: true,
        statuscode: 200,
        page,
        data: allaccommodations,
        totalPages: Math.ceil(total / limit),
      });
    }
    else if (type === "budget") {
      //console.log("budget")
      const pricings = await PricingMatrix.find({
        'pricing.price': { $lte: 1000 }
      })
      // .explain("executionStats")
      // console.log(JSON.stringify(pricings, null, 2))
      //console.log(pricings)

      // Get unique accommodation IDs
      const accoids = [...new Set(pricings.map(p => p.accommodation_id))];
      //console.log("Unique accommodation IDs:", accoids.length);

      const budgetAccommodations = await accommodations.aggregate([
        {
          $match: {
            'location.city': city,
            isverified: true
          }
        },
        {
          $addFields: {
            pricing_ids: {
              $map: {
                input: '$pricing_ids',
                as: 'pid',
                in: { $toObjectId: '$$pid' }
              }
            }
          }
        },
        {
          $lookup: {
            from: 'pricingmatrixes',
            localField: 'pricing_ids',
            foreignField: '_id',
            as: 'pricingData'
          }
        },
        {
          $addFields: {
            pricingData: {
              $map: {
                input: '$pricingData',
                as: 'p',
                in: {
                  _id: '$$p._id',
                  accommodation_id:
                    '$$p.accommodation_id',
                  room_id: '$$p.room_id',
                  pricing: {
                    $filter: {
                      input: '$$p.pricing',
                      as: 'pr',
                      cond: {
                        $lte: ['$$pr.price', 1000]
                      }
                    }
                  }
                }
              }
            }
          }
        },
        {
          $addFields: {
            pricingData: {
              $filter: {
                input: '$pricingData',
                as: 'p',
                cond: {
                  $gt: [{ $size: '$$p.pricing' }, 0]
                }
              }
            }
          }
        },
        {
          $match: {
            'pricingData.0': { $exists: true }
          }
        },
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'propertyid',
            as: 'reviewsData'
          }
        },
        {
          $addFields: {
            totalRatings: {
              $round: [{ $sum: '$reviewsData.rating' }, 0]
            },
            averageRating: {
              $avg: '$reviewsData.rating'
            }
          }
        },
        {
          $match: {
            isverified: true
          }
        },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
            check_in_time: 0,
            cancellation_policy: 0,
            host_contact: 0,
            room_id: 0,
            pricing_ids: 0,
            reviewsData: 0,
          }
        }
      ]);


      const total = await budgetAccommodations.length;

      return res.status(200).json({
        success: true,
        statuscode: 200,
        page,
        data: budgetAccommodations,
        totalPages: Math.ceil(total / limit),
      });
    }

    else if (type === "premium") {
      const premimupricings = await PricingMatrix.find({
        'pricing.price': { $lte: 7000 }
      });
      const accoids = premimupricings.map(p => p.accommodation_id);
      const premiumAccommodations = await accommodations.aggregate([
        {
          $match: {
            'location.city': city,
            isverified: true
          }
        },
        {
          $addFields: {
            pricing_ids: {
              $map: {
                input: '$pricing_ids',
                as: 'pid',
                in: { $toObjectId: '$$pid' }
              }
            }
          }
        },
        {
          $lookup: {
            from: 'pricingmatrixes',
            localField: 'pricing_ids',
            foreignField: '_id',
            as: 'pricingData'
          }
        },
        {
          $addFields: {
            pricingData: {
              $map: {
                input: '$pricingData',
                as: 'p',
                in: {
                  _id: '$$p._id',
                  accommodation_id:
                    '$$p.accommodation_id',
                  room_id: '$$p.room_id',
                  pricing: {
                    $filter: {
                      input: '$$p.pricing',
                      as: 'pr',
                      cond: {
                        $lte: ['$$pr.price', 7000]
                      }
                    }
                  }
                }
              }
            }
          }
        },
        {
          $addFields: {
            pricingData: {
              $filter: {
                input: '$pricingData',
                as: 'p',
                cond: {
                  $gt: [{ $size: '$$p.pricing' }, 0]
                }
              }
            }
          }
        },
        {
          $match: {
            'pricingData.0': { $exists: true }
          }
        },
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'propertyid',
            as: 'reviewsData'
          }
        },
        {
          $addFields: {
            totalRatings: {
              $round: [{ $sum: '$reviewsData.rating' }, 0]
            },
            averageRating: {
              $avg: '$reviewsData.rating'
            }
          }
        },
        {
          $match: {
            'isverified': true
          }
        },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
            check_in_time: 0,
            cancellation_policy: 0,
            host_contact: 0,
            room_id: 0,
            pricing_ids: 0,
            reviewsData: 0,
          }
        }
      ]);

      const total = await premiumAccommodations.length;

      return res.status(200).json({
        success: true,
        statuscode: 200,
        page,
        data: premiumAccommodations,
        totalPages: Math.ceil(total / limit),
      });
    }

    else if (type === "luxury") {
      const luxurypricings = await PricingMatrix.find({
        'pricing.price': { $gte: 10000 }
      })
      const accoids = luxurypricings.map(p => p.accommodation_id);
      //const pricingids = luxurypricings.map(p => p._id);
      const luxuryAccommodations = await accommodations.aggregate([
        {
          $match: {
            'location.city': city,
            isverified: true
          }
        },
        {
          $addFields: {
            pricing_ids: {
              $map: {
                input: '$pricing_ids',
                as: 'pid',
                in: { $toObjectId: '$$pid' }
              }
            }
          }
        },
        {
          $lookup: {
            from: 'pricingmatrixes',
            localField: 'pricing_ids',
            foreignField: '_id',
            as: 'pricingData'
          }
        },
        {
          $addFields: {
            pricingData: {
              $map: {
                input: '$pricingData',
                as: 'p',
                in: {
                  _id: '$$p._id',
                  accommodation_id:
                    '$$p.accommodation_id',
                  room_id: '$$p.room_id',
                  pricing: {
                    $filter: {
                      input: '$$p.pricing',
                      as: 'pr',
                      cond: {
                        $lte: ['$$pr.price', 10000]
                      }
                    }
                  }
                }
              }
            }
          }
        },
        {
          $addFields: {
            pricingData: {
              $filter: {
                input: '$pricingData',
                as: 'p',
                cond: {
                  $gt: [{ $size: '$$p.pricing' }, 0]
                }
              }
            }
          }
        },
        {
          $match: {
            'pricingData.0': { $exists: true }
          }
        },
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'propertyid',
            as: 'reviewsData'
          }
        },
        {
          $addFields: {
            totalRatings: {
              $round: [{ $sum: '$reviewsData.rating' }, 0]
            },
            averageRating: {
              $avg: '$reviewsData.rating'
            }
          }
        },
        {
          $match: {
            'isverified': true
          }
        },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
            check_in_time: 0,
            cancellation_policy: 0,
            host_contact: 0,
            room_id: 0,
            pricing_ids: 0,
            reviewsData: 0,
          }
        }
      ]);


     const total = await luxuryAccommodations.length;

      return res.status(200).json({
        success: true,
        statuscode: 200,
        page,
        data: luxuryAccommodations,
        totalPages: Math.ceil(total / limit),
      });
    }
    else {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: "Invalid type or category_name or something went wrong",

      })
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.getAccommodationsbycity = async (req, res) => {
  try {
    // const page = parseInt(req.query.page) || 1;
    // const limit = parseInt(req.query.limit) || 10;
    // const skip = (page - 1) * limit;
    let { check_in_date, check_out_date, city, type } = req.query;
    if (!city) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: "all fields are required"
      })
    } 

    city = city.toString().trim().toLowerCase(); 
    if (check_in_date && check_out_date && city && type) {
      //convert dates 
      const checkin = new Date(check_in_date);
      const checkout = new Date(check_out_date);

      //fetch accomodations with rooms 
      let Accommodations = await accommodations
        .find({ 'location.city': city, property_type: type, isverified: true })
        .populate({
          path: "room_id",
          populate: {
            path: "pricing_id"
          },
          select: "-_v -createdAt -updatedAt"
        })
        .populate({
          path: "pricing_ids",
          select: "-_v -createdAt -updatedAt"
        })
        .select("-__v -createdAt -updatedAt -property_description -check_in_time -cancellation_policy -host_contact")

      Accommodations = Accommodations.map((acc) => {
        acc.room_id = acc.room_id.filter((room) => {
          let bookedBeds = 0;

          room.bookings?.forEach((b) => {
            const bIn = new Date(b.checkin);
            const bOut = new Date(b.checkout);

            if (checkin < bOut && checkout > bIn) {
              bookedBeds += b.bedCount;
            }
          });

          const availableBeds = room.totalBeds - bookedBeds;
          return availableBeds > 0 && room.rooms_available > 0;
        });
        return acc;
      });

      // Remove accommodations having 0 available rooms
      Accommodations = Accommodations.filter(
        (acc) => acc.room_id.length <= 0
      );

      // relatedAccommodations = relatedAccommodations.filter(
      //   (acc) => acc.room_id.length <= 0
      // );
      // for (let acc of relatedAccommodations) {
      //   const stats = await reviews.aggregate([
      //     { $match: { propertyid: acc._id } },
      //     {
      //       $group: {
      //         _id: "$propertyid",
      //         avgRating: { $avg: "$rating" },
      //         totalRatings: { $sum: 1 }
      //       }
      //     }
      //   ]);

      //   acc.avgRating = stats[0]?.avgRating || 0;
      //   acc.totalRatings = stats[0]?.totalRatings || 0;
      // }


      //area wise accommodations
      const areawise = await accommodations.aggregate([
        {
          $match: {
            _id: { $in: Accommodations.map(acc => acc._id) }
          }
        },
        {
          $lookup: {
            from: "pricingmatrixes",
            localField: "pricing_ids",
            foreignField: "_id",
            as: "pricingData"
          }
        },
        // {
        //   $unwind: "$pricingData"
        // },
        // // { $unwind: "$pricingData.pricing" },
        // {
        //   $sort: {
        //     "pricingData.pricing.price": 1
        //   }
        // },
        {
          $lookup: {
            from: "reviews",
            localField: "_id",
            foreignField: "propertyid",
            as: "reviewsData"
          }
        },
        {
          $addFields: {
            totalRatings: { $size: "$reviewsData" },
            averageRating: { $avg: "$reviewsData.rating" }
          }
        },
        {
          $project: {
            reviewsData: 0,
            room_types: 0,
            room_id: 0,
            property_description: 0,
            check_in_time: 0,
            check_out_time: 0,
            cancellation_policy: 0,
            host_details: 0,
            tax: 0,
            tax_amount: 0,
            createdAt: 0,
            updatedAt: 0,
            __v: 0,
            isverified: 0,
            bookingcount: 0,

          }
        },
        {
          $group: {
            _id: "$location.area",
            accommodations: { $push: "$$ROOT" },
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: "reviews",
            localField: "accommodations._id",
            foreignField: "propertyid",
            as: "reviewsData"
          }
        },
        {
          $addFields: {
            totalRatings: { $size: "$reviewsData" },
            averageRating: { $avg: "$reviewsData.rating" }
          }
        },
        {
          $project: {
            reviewsData: 0,
          }
        },
        {
          $lookup: {
            from: "pricingmatrixes",
            localField: "accommodations.pricing_ids",
            foreignField: "_id",
            as: "pricingData"
          }
        },
        {
          $addFields: {
            allPrices: {
              $reduce: {
                input: "$pricingData.pricing",
                initialValue: [],
                in: {
                  $concatArrays: [
                    "$$value",
                    ["$$this.price"]
                  ]
                }
              }
            }
          }
        },
        {
          $addFields: {
            minPrice: { $min: "$allPrices" },
            maxPrice: { $max: "$allPrices" }
          }
        },
        {
          $project: {
            allPrices: 0,
            pricingData: 0
          }
        },
        {
          $addFields: {
            populareaccomidation: {
              $map: {
                input: {
                  $filter: {
                    input: "$accommodations",
                    as: "acc",
                    cond: { $gt: [{ $ifNull: ["$$acc.bookingcount", 0] }, 10] }
                  }
                },
                as: "popularAcc",
                in: "$$popularAcc.category_name"
              }
            }
          }
        }
      ]);


      return res.status(200).json({
        success: true,
        statuscode: 200,
        message: "successfully retrive the accommodations",
        data: areawise
      })
    } else if (city && type) {
      let Accommodations = await accommodations
        .find({ 'location.city': city, property_type: type, isverified: true })
        .populate({
          path: "pricing_ids",
          select: "-createdAt -updatedAt"
        })
        .select("-__v -createdAt -updatedAt -property_description -check_in_time -check_out_time -cancellation_policy -host_contact")
      // const explain = await accommodations.find({ 'location.city': city, property_type: type, isverified: true })
      // .explain("executionStats")
      // console.log(JSON.stringify(explain, null, 2));

      const areawise = await accommodations.aggregate([
        {
          $match: {
            '_id': { $in: Accommodations.map(acc => acc._id) }
          }
        },
        {
          $lookup: {
            from: "pricingmatrixes",
            localField: "pricing_ids",
            foreignField: "_id",
            as: "pricingData"
          }
        },
        {
          $sort: {
            "pricingData.pricing.price": 1
          }
        },
        {
          $lookup: {
            from: "reviews",
            localField: "_id",
            foreignField: "propertyid",
            as: "reviewsData"
          }
        },
        {
          $addFields: {
            totalRatings: { $size: "$reviewsData" },
            averageRating: { $avg: "$reviewsData.rating" }
          }
        },
        {
          $project: {
            reviewsData: 0,
            room_types: 0,
            room_id: 0,
            property_description: 0,
            check_in_time: 0,
            check_out_time: 0,
            cancellation_policy: 0,
            host_details: 0,
            tax: 0,
            tax_amount: 0,
            createdAt: 0,
            updatedAt: 0,
            __v: 0,
            isverified: 0,
            bookingcount: 0,

          }
        },
        {
          $group: {
            _id: '$location.area',
            accommodations: {
              $push: "$$ROOT"
            },
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: "reviews",
            localField: "accommodations._id",
            foreignField: "propertyid",
            as: "reviewsData"
          }
        },
        {
          $addFields: {
            totalRatings: { $size: "$reviewsData" },
            averageRating: { $avg: "$reviewsData.rating" }
          }
        },
        {
          $project: {
            reviewsData: 0,
          }
        },
        {
          $lookup: {
            from: "pricingmatrixes",
            localField: "accommodations.pricing_ids",
            foreignField: "_id",
            as: "pricingData"
          }
        },
        {
          $addFields: {
            allPrices: {
              $reduce: {
                input: "$pricingData.pricing",
                initialValue: [],
                in: {
                  $concatArrays: [
                    "$$value",
                    ["$$this.price"]
                  ]
                }
              }
            }
          }
        },
        {
          $addFields: {
            minPrice: { $min: "$allPrices" },
            maxPrice: { $max: "$allPrices" }
          }
        },
        {
          $project: {
            allPrices: 0,
            pricingData: 0,
          }
        },
        // {
        //   $addFields: {
        //     populareaccomidation: {
        //       $map: {
        //         input: {
        //           $filter: {
        //             input: "$accommodations",
        //             as: "acc",
        //             cond: { $gt: [{ $ifNull: ["$$acc.bookingcount", 0] }, 10] }
        //           }
        //         },
        //         as: "popularAcc",
        //         in: "$$popularAcc.category_name"
        //       }
        //     }
        //   }
        // }
      ])
      return res.status(200).json({
        success: 200,
        statuscode: 200,
        message: "all accommodations are retrived successfully",
        data: areawise
      })
    }

  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message

    })
  }
};

exports.gettopaccommodations = async (req, res) => {
  try {
    const { city } = req.query
    // if (!city) {
    //   return res.status(400).json({
    //     success: false,
    //     statuscode: 400,
    //     message: "city is required"
    //   })
    // }
     let topaccos
    if(city){
        topaccos = await accommodations.aggregate([
      {
        $match: {
          'location.city': city,
          property_type: 'hostels',
          isverified: true
        }
      },
      {
        $lookup: {
          from: 'pricingmatrixes',
          localField: 'pricing_ids',
          foreignField: '_id',
          as: 'pricingData'
        }
      },
      {
        $sort: {
          bookingcount: -1
        }
      },
      {
        $limit: 3
      },
      {
        $project: {
          __v: 0,
          createdAt: 0,
          updatedAt: 0,
          check_in_time: 0,
          cancellation_policy: 0,
          host_contact: 0,
          room_id: 0,
          pricing_ids: 0,
        }
      }
    ])
    }else{
       topaccos = await accommodations.aggregate([
      {
        $match: {
          property_type: 'hostels',
          isverified: true
        }
      },
      {
        $lookup: {
          from: 'pricingmatrixes',
          localField: 'pricing_ids',
          foreignField: '_id',
          as: 'pricingData'
        }
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'propertyid',
          as: 'reviewsData'
        }
      },
      {
        $addFields: {
          averageRating: { $avg: '$reviewsData.rating' },
          totalRating: { $size: '$reviewsData' }
        }
      },
      {
        $sort: {
          bookingcount: 1
        }
      },
      {
        $limit: 6
      },
      {
        $project: {
          property_name: 1,
          location: 1,
          amenities: 1,
          _id: 1,
          pricingData: 1,
          bookingcount: 1,
          images_url: 1,
          averageRating: 1,
          totalRating: 1
        }
      }
    ])
    }
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: "top accommodations are retrived successfully",
      data: topaccos
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message
    })
  }
};

exports.getallfilternames = async (req, res) => {
  try {
    const locations = await accommodations.aggregate([
      {
        $group: {
          _id: '$location.city',
          area: { $push: '$location.area' }
        }
      }
    ])
    const staytypes = await types.find({})
    const roomtypes = await accommodations.distinct('room_types')
    const amenities = await accommodations.distinct('amenities')
    const maxprice = await PricingMatrix.aggregate([
      {
        $unwind: "$pricing"
      },
      {
        $group: {
          _id: null,
          maxPrice: { $max: "$pricing.price" },
          minPrice: { $min: "$pricing.price" }
        }
      },
    ])
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: "all locations are retrived successfully",
      data: {
        locations,
        staytypes,
        roomtypes,
        amenities,
        maxprice
      }
    })
  }
  catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: 'Internal Server Error',
      error: error.message
    })
  }
};

exports.getfilteraccomidations = async (req, res) => {
  try {
    let {
      check_in_date,
      check_out_date,
      category,
      location,
      staytype,
      roomtype,
      amenities,
      minprice,
      maxprice,
      rating,
      page,
      limit
    } = req.query;
    
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    // Parse JSON array fields
    const parseArray = (value) => {
      if (!value) return null;
      if (Array.isArray(value)) return value;
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    };

    staytype = parseArray(staytype);
    roomtype = parseArray(roomtype);
    amenities = parseArray(amenities);

    // Build Mongo Filter
    let filter = { isverified: true };
    if (category) filter.category_name = category;
    if (location) filter["location.city"] = location;
    if (staytype) filter.property_type = { $in: staytype };
    if (roomtype) filter.room_types = { $in: roomtype };
    if (amenities) filter.amenities = { $in: amenities };

    // PRICE FILTER: Get pricing IDs first
    if (minprice || maxprice) {
      const min = Number(minprice) || 0;
      const max = maxprice ? Number(maxprice) : Infinity;

      const priceDocs = await PricingMatrix.find({
        "pricing.price": { $gte: min, $lte: max }
      }).select("_id");

      const priceIds = priceDocs.map(p => p._id);

      filter.pricing_ids = { $in: priceIds.length ? priceIds : ["NO_DATA"] };
    }

    // RATING FILTER
    if (rating) {
      const ratingDocs = await reviews.aggregate([
        { $match: { rating: { $gte: Number(rating) } } },
        { $project: { propertyid: 1 } }
      ]);

      const ratedIds = ratingDocs.map(r => r.propertyid);

      filter._id = { $in: ratedIds.length ? ratedIds : ["NO_DATA"] };
    }

    // MAIN QUERY
    let matcheddata = await accommodations.find(filter)
        .populate({
            path: "room_id",
            populate: {
                path: "pricing_id"
            },
            select: "-__v -createdAt -updatedAt"
        })
        .populate({
            path: "pricing_ids",
            select: "-__v -createdAt -updatedAt"
        })
        .select("-__v -createdAt -updatedAt")
        .skip(skip)
        .limit(limit)
        .lean();
  //console.log(matcheddata )

    // Apply availability filtering if dates are provided
    if(check_in_date && check_out_date){
      console.log(check_in_date, check_out_date)
        const checkin = new Date(check_in_date);
        const checkout = new Date(check_out_date);
        
        // Filter accommodations based on room availability
        matcheddata = matcheddata.map((acc) => {
            acc.room_id = acc.room_id.filter((room) => {
                let bookedBeds = 0;

                room.bookings?.forEach((b) => {
                    const bIn = new Date(b.check_in_date);
                    const bOut = new Date(b.check_out_date);

                    if (checkin < bOut && checkout > bIn) {
                        bookedBeds += b.beds_booked;
                    }
                });

                const availableBeds = room.beds_available - bookedBeds;
                return availableBeds > 0 && room.rooms_available > 0;
            });
            return acc;
        });

        // Remove accommodations having 0 available rooms
        matcheddata = matcheddata.filter(
            (acc) => acc.room_id.length > 0
        );
    }
    //console.log(matcheddata)
    // If no accommodations
    if (matcheddata.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No accommodations found",
        data: [],
        filters: {
          room_types: [],
          amenities: [],
          category: [],
          min_price: 0,
          max_price: 0,
          location: []
        }
      });
    }

    // CALCULATE AVERAGE RATING FOR EACH ACCOMMODATION
    const propertyIds = matcheddata.map(acc => acc._id);
    
    // Fetch reviews for all properties
    const reviewsData = await reviews.aggregate([
      { $match: { propertyid: { $in: propertyIds } } },
      { $group: {
        _id: '$propertyid',
        averageRating: { $avg: '$rating' },
        totalRating: { $sum: 1 }
      }}
    ]);

    // Create a map of property ID to rating data
    const ratingMap = {};
    reviewsData.forEach(review => {
      ratingMap[review._id.toString()] = {
        averageRating: review.averageRating.toFixed(2),
        totalRating: review.totalRating
      };
    });

    // Add rating data to each accommodation
    matcheddata.forEach(acc => {
      const ratingData = ratingMap[acc._id.toString()];
      acc.averageRating = ratingData ? parseFloat(ratingData.averageRating) : 0;
      acc.totalRating = ratingData ? ratingData.totalRating : 0;
    });

    // GENERATE DYNAMIC FILTERS FROM MATCHED DATA
    let availableRoomTypes = new Set();
    let availableAmenities = new Set();
    let availablelocations = new Set();
    let availablecategories = new Set();
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    matcheddata.forEach(acc => {
      // Collect room types
      acc.room_types?.forEach(rt => availableRoomTypes.add(rt));

      // Collect amenities
      acc.amenities?.forEach(am => availableAmenities.add(am));
      availablecategories.add(acc.category_name);
      
      // Collect locations
      if (acc.location?.city) {
          availablelocations.add(acc.location.city);
      }
   
      // Collect prices
      acc.pricing_ids?.forEach(pr => {
        pr.pricing?.forEach(item => {
          minPrice = Math.min(minPrice, item.price);
          maxPrice = Math.max(maxPrice, item.price);
        });
      });
    });

    if (!isFinite(minPrice)) minPrice = 0;
    if (!isFinite(maxPrice)) maxPrice = 0;

    const dynamicFilters = {
      room_types: [...availableRoomTypes],
      amenities: [...availableAmenities],
      location: [...availablelocations],
      category: [...availablecategories],
      min_price: minPrice,
      max_price: maxPrice
    };
    
   if(req.user?._id){
       await helper.store_user_sesarch({
        userid: req.user._id,
        type: "Location",
        location: location,
        checkin: check_in_date,
        checkout: check_out_date
   });
   }
    // FINAL RESPONSE
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: "Filtered accommodations retrieved successfully",
      data: matcheddata,
      filters: dynamicFilters,
      totalaccommodations: matcheddata.length,
      pagination: {
        page,
        limit
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

exports.getfilteraccomidationsbyarea = async (req, res) => {
  try {
    let {
      check_in_date,
      check_out_date,
      category,
      location,
      area,
      staytype,
      roomtype,
      amenities,
      minprice,
      maxprice,
      rating,
      page,
      limit
    } = req.query;
    
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    // Parse JSON array fields
    const parseArray = (value) => {
      if (!value) return null;
      if (Array.isArray(value)) return value;
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    };

    staytype = parseArray(staytype);
    roomtype = parseArray(roomtype);
    amenities = parseArray(amenities);

    // Build Mongo Filter
    let filter = { isverified: true };
    if (category) filter.category_name = category;
    if (location) filter["location.city"] = location;
    if (area) filter["location.area"] = area;
    if (staytype) filter.property_type = { $in: staytype };
    if (roomtype) filter.room_types = { $in: roomtype };
    if (amenities) filter.amenities = { $in: amenities };

    // PRICE FILTER: Get pricing IDs first
    if (minprice || maxprice) {
      const min = Number(minprice) || 0;
      const max = maxprice ? Number(maxprice) : Infinity;

      const priceDocs = await PricingMatrix.find({
        "pricing.price": { $gte: min, $lte: max }
      }).select("_id");

      const priceIds = priceDocs.map(p => p._id);

      filter.pricing_ids = { $in: priceIds.length ? priceIds : ["NO_DATA"] };
    }

    // RATING FILTER
    if (rating) {
      const ratingDocs = await reviews.aggregate([
        { $match: { rating: { $gte: Number(rating) } } },
        { $project: { propertyid: 1 } }
      ]);

      const ratedIds = ratingDocs.map(r => r.propertyid);

      filter._id = { $in: ratedIds.length ? ratedIds : ["NO_DATA"] };
    }

    // MAIN QUERY 
    let matcheddata = await accommodations.find(filter)
        .populate({
            path: "room_id",
            populate: {
                path: "pricing_id"
            },
            select: "-__v -createdAt -updatedAt"
        })
        .populate({
            path: "pricing_ids",
            select: "-__v -createdAt -updatedAt"
        })
        .select("-__v -createdAt -updatedAt -room_id")
        .skip(skip)
        .limit(limit)
        .lean();

    // Apply availability filtering if dates are provided
    if(check_in_date && check_out_date){
        const checkin = new Date(check_in_date);
        const checkout = new Date(check_out_date);
        
        // Filter accommodations based on room availability
        matcheddata = matcheddata.map((acc) => {
            acc.room_id = acc.room_id.filter((room) => {
                let bookedBeds = 0;

                room.bookings?.forEach((b) => {
                    const bIn = new Date(b.check_in_date);
                    const bOut = new Date(b.check_out_date);

                    if (checkin < bOut && checkout > bIn) {
                        bookedBeds += b.beds_booked;
                    }
                });

                const availableBeds = room.beds_available - bookedBeds;
                return availableBeds > 0 && room.rooms_available > 0;
            });
            return acc;
        });

        // Remove accommodations having 0 available rooms
        matcheddata = matcheddata.filter(
            (acc) => acc.room_id.length > 0
        );
    }

    // If no accommodations
    if (matcheddata.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No accommodations found",
        data: [],
        filters: {
          room_types: [],
          amenities: [],
          category: [],
          min_price: 0,
          max_price: 0,
          location: []
        }
      });
    }

    // GROUP DATA BY AREA WITH RATINGS
    const groupedByArea = {};
    matcheddata.forEach(acc => {
      const area = acc.location?.area || 'Unknown Area';
      if (!groupedByArea[area]) {
        groupedByArea[area] = {
          accommodations: [],
          totalRating: 0,
          averageRating: 0,
          accommodationCount: 0
        };
      }
      groupedByArea[area].accommodations.push(acc);
      groupedByArea[area].accommodationCount++;
    });

    // CALCULATE RATINGS FOR EACH AREA GROUP
    for (const area in groupedByArea) {
      const areaData = groupedByArea[area];
      let totalRating = 0;
      let ratingCount = 0;

      // Get all property IDs for this area
      const propertyIds = areaData.accommodations.map(acc => acc._id);

      // Fetch reviews for all properties in this area
      const areaReviews = await reviews.aggregate([
        { $match: { propertyid: { $in: propertyIds } } },
        { $group: {
          _id: null,
          totalRating: { $sum: '$rating' },
          ratingCount: { $sum: 1 }
        }}
      ]);

      if (areaReviews.length > 0) {
        totalRating = areaReviews[0].totalRating;
        ratingCount = areaReviews[0].ratingCount;
        areaData.totalRating = ratingCount; // Count of ratings, not sum
        areaData.averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(2) : 0;
      } else {
        areaData.totalRating = 0;
        areaData.averageRating = 0;
      }
    }

    // GENERATE DYNAMIC FILTERS FROM MATCHED DATA
    let availableRoomTypes = new Set();
    let availableAmenities = new Set();
    let availablelocations = new Set();
    let availablecategories = new Set();
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    matcheddata.forEach(acc => {
      // Collect room types
      acc.room_types?.forEach(rt => availableRoomTypes.add(rt));

      // Collect amenities
      acc.amenities?.forEach(am => availableAmenities.add(am));
      availablecategories.add(acc.category_name);
      // Collect locations
      if (acc.location?.city) {
          availablelocations.add(acc.location.city);
      }
   
      // Collect prices
      acc.pricing_ids?.forEach(pr => {
        pr.pricing?.forEach(item => {
          minPrice = Math.min(minPrice, item.price);
          maxPrice = Math.max(maxPrice, item.price);
        });
      });
    });

    if (!isFinite(minPrice)) minPrice = 0;
    if (!isFinite(maxPrice)) maxPrice = 0;

    const dynamicFilters = {
      room_types: [...availableRoomTypes],
      amenities: [...availableAmenities],
      location: [...availablelocations],
      category: [...availablecategories],
      min_price: minPrice,
      max_price: maxPrice
    };

    // FINAL RESPONSE
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: "Filtered accommodations retrieved successfully",
      data: groupedByArea,
      filters: dynamicFilters,
      totalaccommodations: matcheddata.length,
      pagination: {
        page,
        limit
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

exports.sortaccomodations = async (req, res) => {
  try {
    const { category } = req.query
    let { hightolow, lowtohigh, price, location,check_in_date,check_out_date,} = req.query

    // Convert string booleans to actual booleans
    hightolow = hightolow === 'true';
    lowtohigh = lowtohigh === 'true';

    if (hightolow || lowtohigh) {
      const sortOrder = hightolow ? -1 : 1;
      const sortFieldOperator = hightolow ? "$max" : "$min";

      let  data = await accommodations.aggregate([
        {
          $match: {
            isverified: true,
            category_name: category
          }
        },
        {
          $lookup: {
            from: "pricingmatrixes",
            localField: "pricing_ids",
            foreignField: "_id",
            as: "pricingData"
          }
        },
        {
          $addFields: {
            // Extract all prices into a single flat array with price and type
            allPrices: {
              $reduce: {
                input: "$pricingData",
                initialValue: [],
                in: {
                  $concatArrays: [
                    "$$value",
                    "$$this.pricing"
                  ]
                }
              }
            }
          }
        },
        {
          $addFields: {
            // Calculate the representative price for sorting
            maxPrice: { [sortFieldOperator]: "$allPrices" }
          }
        },
        {
          $sort: {
            maxPrice: sortOrder
          }
        },
        {
          $project: {
            pricingData: 0,
            allPrices: 0
          }
        }
      ]);

      return res.status(200).json({
        success: true,
        statuscode: 200,
        message: "Filtered accommodations retrieved successfully",
        data: data
      });
    }
    else if (price === 'hightolow' || price === 'lowtohigh') {
      const sortOrder = price === 'hightolow' ? -1 : 1
      const sortFieldOperator = price === 'hightolow' ? "$max" : "$min";
      
      let data = await accommodations.aggregate([
        {
          $match: {
            isverified: true,
            ...(location && { "location.city": location })
          }
        },
        {
          $lookup: {
            from: "pricingmatrixes",
            localField: "pricing_ids",
            foreignField: "_id",
            as: "pricingData"
          }
        },
        // {
        //   $lookup: {
        //     from: "rooms",
        //     localField: "room_id",
        //     foreignField: "_id",
        //     as: "room_id"
        //   }
        // },
        {
          $addFields: {
            // Extract all prices into a single flat array with price and type
            allPrices: {
              $reduce: {
                input: "$pricingData",
                initialValue: [],
                in: {
                  $concatArrays: [
                    "$$value",
                    "$$this.pricing"
                  ]
                }
              }
            }
          }
        },
        { $addFields: { maxPrice: { [sortFieldOperator]: "$allPrices" } } },
        {
          $sort: {
            maxPrice: sortOrder
          }
        },
        {
          $project: {
            pricingData: 0,
          }
        },
        {
          $group: {
            _id: "$location.area",
            accommodations: { $push: "$$ROOT" },
            count: { $sum: 1 }
          }
        }

      ]);

      //console.log("Aggregation result:", JSON.stringify(data, null, 2));

      // // Apply availability filtering if dates are provided
        const checkin = new Date(check_in_date);
        const checkout = new Date(check_out_date);
        
        // Filter accommodations based on room availability
        data = await Promise.all(data.map(async (area) => {
          // Get all accommodations for this area
          const filteredAccommodations = [];
          
          for (const accommodation of area.accommodations) {
            // Check if room_id exists and is an array
            if (!accommodation.room_id || !Array.isArray(accommodation.room_id)) {
              continue;
            }
            
            // Filter rooms based on availability
            const availableRooms = [];
            
            for (const room of accommodation.room_id) {
              let bookedBeds = 0;
              
              // Get full room data with bookings
              const fullRoomData = await rooms.findById(room._id).populate('bookings');
              
              if (!fullRoomData) {
                continue;
              }
              
              fullRoomData.bookings?.forEach((b) => {
                const bIn = new Date(b.check_in_date);
                const bOut = new Date(b.check_out_date);

                if (checkin < bOut && checkout > bIn) {
                  bookedBeds += b.beds_booked || 1;
                }
              });

              const availableBeds = (fullRoomData.beds_available || 0) - bookedBeds;
              if (availableBeds > 0 && (fullRoomData.rooms_available || 0) > 0) {
                availableRooms.push(room);
              }
            }
            
            // Update accommodation with filtered rooms
            accommodation.room_id = availableRooms;
            
            // Only keep accommodation if it has available rooms
            if (availableRooms.length > 0) {
              filteredAccommodations.push(accommodation);
            }
          }
          
          area.accommodations = filteredAccommodations;
          return area;
        }));

        // Remove areas with no available accommodations
       // data = data.filter((area) => area.accommodations.length > 0);

      return res.status(200).json({
        success: true,
        statuscode: 200,
        message: "filtered accommodations are retrived successfully",
        data: data
      });
    } else {
      return res.status(500).json({
        success: false,
        statuscode: 500,
        message: "Cant able to sort the accommodations"
      })
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message
    })
  }
};

exports.getRandomProducts = async (req, res) => {
  try {
    // const productrandomProducts = await products.aggregate([
    //    {$sample: {size: 4}}
    // ])
    // const productprices = await products.find(productrandomProducts,{populate: "pricingid"})
    // const potrandomProducts = await pots.aggregate([
    //   {$sample: {size: 3}}
    // ]) 

    const productrandomProducts = await accommodations.find()
      .populate({
        path: "pricingid",
        select: "productprice quantity"
      })
      .limit(4)
    const randomProducts = [...productrandomProducts]
    if (!randomProducts) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: 'No Products Found',
        error: "Not Found"
      })
    }
    return res.status(200).json({
      success: true,
      message: "Random products fetched successfully",
      data: randomProducts
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message
    })
  }
};


exports.searchProducts = async (req, res) => {
  try {
    const {city,area} = req.query;
    //const query = req.query.query;
    // if(area){
    //    return res.status(200).json({
    //     success: true,
    //     message: "please send city to get area related data",
    //     statuscode: 200,
    //     data: []


    //    })
    // }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let productResults = [];

    if (city && city.trim() !== "" && !area) {
      const searchRegex = new RegExp(city, "i");

      productResults = await accommodations.aggregate([
        {
          $match: {
            "location.city": { $regex: searchRegex }
          }
        },
        {
          $sample: { size: 3 }
        },
        {
          $lookup: {
            from: "pricingmatrixes",
            localField: "pricing_ids",
            foreignField: "_id",
            as: "pricingdata"
          }
        },
        {
          $lookup: {
            from: "reviews",
            localField: "_id",
            foreignField: "propertyid",
            as: "reviews"
          }
        },
        {
          $addFields: {
            rating: { $avg: "$reviews.rating" },
            reviewCount: { $size: "$reviews" }
          }
        },
        {
          $project: {
            property_name: 1,
            location: 1,
            images_url: 1,
            pricingdata: 1,
            pricing_ids: 1,
            rating: 1,
            reviewCount: 1
          }
        },
        { $skip: skip },
        { $limit: limit }
      ]);

      if (productResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No products matched your search"
        });
      }
    }

    else if((area && city) && (area.trim() !== "" && city.trim() !== "")) {
      const searchRegex = new RegExp(area, "i");

      productResults = await accommodations.aggregate([
        {
          $match: {
            "location.area": { $regex: searchRegex }
          }
        },
        // {
        //   $sample: { size: 3 }
        // },
        {
          $lookup: {
            from: "pricingmatrixes",
            localField: "pricing_ids",
            foreignField: "_id",
            as: "pricingdata"
          }
        },
        {
          $lookup: {
            from: "reviews",
            localField: "_id",
            foreignField: "propertyid",
            as: "reviews"
          }
        },
        {
          $addFields: {
            rating: { $avg: "$reviews.rating" },
            reviewCount: { $size: "$reviews" }
          }
        },
        {
          $project: {
            property_name: 1,
            location: 1,
            images_url: 1,
            pricingdata: 1,
            pricing_ids: 1,
            rating: 1,
            reviewCount: 1,
          }
        },
        { $skip: skip },
        { $limit: limit }
      ]);
    }
    return res.status(200).json({
      success: true,
      message: "Search products received successfully",
      data: productResults,
      count: productResults.length,
      totalPages: Math.ceil(productResults.length / limit),
      page,
      limit
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

exports.getNeighborhoodAccommodations = async (req, res) => {
  try {
    const { city } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const RelatedData = await accommodations.aggregate([
      {
        $match: {
          'location.city': city
        }
      },
      {
        $group: {
          _id: "$isbestfor",
          data: { $push: "$$ROOT" }
        }
      },
      {
        $project: {
          _id: 1,
          //category: "$_id",
          data: {
            $map: {
              input: "$data",
              as: "item",
              in: {
                _id: "$$item._id",
                property_name: "$$item.property_name",
                location: "$$item.location",
                images_url: "$$item.images_url",
                pricing_ids: "$$item.pricing_ids",
                amenities: "$$item.amenities"
              }
            }
          }
        }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      }
    ])

    if (RelatedData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No related data found"
      })
    }

    return res.status(200).json({
      success: true,
      message: "Related data received successfully",
      RelatedData,
      count: RelatedData.length,
      totalPages: Math.ceil(RelatedData.length / limit),
      page,
      limit
    })



  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message
    })
  }
};

exports.getdealsincity = async (req, res) => {
   try{
     const {city} = req.query;
     const page = parseInt(req.query.page) || 1;
     const limit = parseInt(req.query.limit) || 10;
     const skip = (page - 1) * limit;

     const deals = await accommodations.find({
      'location.city': city,
      deal_of_the_day: true
     }).populate({
         path: "pricing_ids",
         select: "_id pricing"
     })
     .select("-__v -createdAt -updatedAt -check_in_time -cancellation_policy -host_contact -room_id -amenities -reasonfornotverified -room_id -room_types -tax -tax_amount -bookingcount -isbestfor -nearby -vendor_id")
     .skip(skip).limit(limit)

     if(deals.length === 0){
      return res.status(404).json({
        success: false,
        message: "No deals found"
      })
     }

     return res.status(200).json({
      success: true,
      message: "Deals received successfully",
      deals,
      count: deals.length,
      totalPages: Math.ceil(deals.length / limit),
      page,
      limit
     })

   }catch(error){
      return res.status(500).json({
         success: false,
         statuscode: 500,
         message: "Internal Server Error",
         error: error.message
      })
   }
};

exports.getrecentlyviews = async( req, res) => {
   try{
     const user_views = await recent.findOne({user_id: req.user._id})
     if(!user_views){
        return res.status(404).json({
           success: false,
           message: "No recently views found",
           statuscode: 404
        })
     }
     //const accos = user_views.accommodation_ids
     let accommodationdata = [];
     for(let i = 0; i < user_views.accommodation_ids.length; i++){
        const accommodation = await accommodations.findById(user_views.accommodation_ids[i])
        .populate({
            path: "pricing_ids",
            select: "_id pricing"
        })
        .select("-__v -createdAt -updatedAt -check_in_time -cancellation_policy -host_contact -room_id -amenities -reasonfornotverified -room_id -room_types -tax -tax_amount -bookingcount -isbestfor -nearby -vendor_id")
        accommodationdata.push(accommodation)
     }
     
     return res.status(200).json({
        success: true,
        statuscode: 200,
        message: 'recently views received successfully',
        accommodationdata
     })

   }catch(error){
      return res.status(500).json({
         success: false,
         statuscode: 500,
         message: "Internal Server Error",
         error: error.message
      })
   }
};

exports.get_user_may_like_accomidations = async (req,res) => {
   try{
       const { city,propertytype } = req.query
    // if (!city) {
    //   return res.status(400).json({
    //     success: false,
    //     statuscode: 400,
    //     message: "city is required"
    //   })
    // }
    let topaccos 
    if(city){
       topaccos = await accommodations.aggregate([
      {
        $match: {
          'location.city': city,
          isverified: true
        }
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'propertyid',
          as: 'reviewsData'
        }
      },
      {
        $addFields: {
          averageRating: { $avg: '$reviewsData.rating' },
          totalReviews: { $size: '$reviewsData' }
        }
      },
      {
        $sort: {
          totalReviews: -1,
          averageRating: -1
        }
      },
      {
        $lookup: {
          from: 'pricingmatrixes',
          localField: 'pricing_ids',
          foreignField: '_id',
          as: 'pricingData'
        }
      },
      {
        $limit: 3
      },
      {
        $project: {
          __v: 0,
          createdAt: 0,
          updatedAt: 0,
          check_in_time: 0,
          cancellation_policy: 0,
          host_contact: 0,
          room_id: 0,
          pricing_ids: 0,
          reviewsData: 0,
          amenities: 0,
          reasonfornotverified: 0,
          room_types: 0,
          tax: 0,
          tax_amount: 0,
          bookingcount: 0,
          isbestfor: 0,
          nearby: 0,
          vendor_id: 0
        }
      }
     ])
    }else{
        topaccos = await accommodations.aggregate([
      {
        $match: {
          property_type: propertytype,
          deal_of_the_day: true,
          isverified: true
        }
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'propertyid',
          as: 'reviewsData'
        }
      },
      {
        $addFields: {
          averageRating: { $avg: '$reviewsData.rating' },
          totalReviews: { $size: '$reviewsData' }
        }
      },
      {
        $sort: {
          totalReviews: -1,
          averageRating: -1
        }
      },
      {
        $lookup: {
          from: 'pricingmatrixes',
          localField: 'pricing_ids',
          foreignField: '_id',
          as: 'pricingData'
        }
      },
      {
        $limit: 3
      },
      {
        $project: {
          __v: 0,
          createdAt: 0,
          updatedAt: 0,
          check_in_time: 0,
          cancellation_policy: 0,
          host_contact: 0,
          room_id: 0,
          pricing_ids: 0,
          reviewsData: 0,
          amenities: 0,
          reasonfornotverified: 0,
          room_types: 0,
          tax: 0,
          tax_amount: 0,
          bookingcount: 0,
          isbestfor: 0,
          nearby: 0,
          vendor_id: 0
        }
      }
    ])
    }
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: "top accommodations are retrived successfully",
      data: topaccos
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

exports.advancedSearch = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    
    if (!search) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: "Search parameter is required"
      });
    }
    
    // Build search criteria to search across multiple fields
    const searchRegex = { $regex: search, $options: 'i' };
    const matchCriteria = { 
      isverified: true,
      $or: [
        { 'location.city': searchRegex },
        { 'location.area': searchRegex },
        { 'property_name': searchRegex },
        { 'property_type': searchRegex },
        { 'category_name': searchRegex },
        { 'room_types': searchRegex }
      ]
    };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const searchResults = await accommodations.aggregate([
      {
        $match: matchCriteria
      },
      {
        $lookup: {
          from: 'pricingmatrixes',
          localField: 'pricing_ids',
          foreignField: '_id',
          as: 'pricingData'
        }
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'propertyid',
          as: 'reviewsData'
        }
      },
      {
        $addFields: {
          averageRating: { $avg: '$reviewsData.rating' },
          totalReviews: { $size: '$reviewsData' }
        }
      },
      {
        $sort: {
          totalReviews: -1,
          averageRating: -1
        }
      },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: parseInt(limit) },
            {
              $project: {
                __v: 0,
                createdAt: 0,
                updatedAt: 0,
                check_in_time: 0,
                cancellation_policy: 0,
                host_contact: 0,
                room_id: 0,
                pricing_ids: 0,
                reviewsData: 0,
                amenities: 0,
                reasonfornotverified: 0,
                room_types: 0,
                tax: 0,
                tax_amount: 0,
                bookingcount: 0,
                isbestfor: 0,
                nearby: 0,
                vendor_id: 0
              }
            }
          ],
          totalCount: [
            { $count: "count" }
          ]
        }
      }
    ]);
    
    const results = searchResults[0];
    const totalCount = results.totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    if(req.user._id){
        await helper.store_user_sesarch({
          userid: req.user._id,
          type: "text",
          searchtext: search
     });
    }
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: "Search completed successfully",
      data: results.data,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        limit: parseInt(limit),
        // hasNextPage: parseInt(page) < totalPages,
        // hasPrevPage: parseInt(page) > 1
      }
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

exports.RecentSerachesOfGlobal = async (req,res) => {
   try{
    // if(req.user_id){
    //    return res.status(400).json({
    //      success: false,
    //      statuscode: 400,
    //      message: "please login to get recent searches"
    //    })
    // }
    const allsearches = await global.findOne({user_id:req.user._id}).select("searchtext locationsearch")
    if(!allsearches){
       return res.status(404).json({
         success: false,
         statuscode: 404,
         message: "no searches is not found"
       })
    }

    return res.status(200).json({
       success: true,
       statuscode: 200,
       message: "searches are retrived successfully",
       data: allsearches
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

exports.clearallsearches = async(req,res) => {
   try{
        const update_searches =   await global.updateOne(
            { user_id: req.user._id },
            { $set: { searchtext: [] } }
          );

          if(!update_searches){
             return res.status(400).json({
                 success: false,
                 statuscode: 400,
                 message: "something went worng"
             })
          }

        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: "All searches cleared successfully"
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
