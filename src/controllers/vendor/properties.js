const accommodations = require('../../models/accommodations.js')
const rooms = require('../../models/rooms.js');
const pricings = require('../../models/PricingSchema.js');
const orders = require('../../models/ordersSchema.js');
const userpayments = require('../../models/userpayments.js');
//const accommodations = require("../../models/accommodation")
const types = require("../../models/stay.js")
const categories = require("../../models/categoriesschema.js")
const Amenities = require("../../models/amenities.js")
const vendors = require("../../models/vendors.js")
const tickets = require("../../models/tickets.js")
const messages = require("../../models/messages.js")
//const bookings = require("../../models/bookingSchema.js")

const mongoose = require('mongoose')

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
      locationurl,
      isbestfor,
      nearby
    } = req.body;
    // console.log('Request body:', property_name);
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
      !isverified ||
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
    property_name = property_name 
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[-_]/g, " ") // convert dashes/underscores to space
      .replace(/\s+/g, ""); // remove all spaces
    //check the property type is there or not in db
    const isvalid_type = await types.findOne({ staytype: property_type })
    if (!isvalid_type) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: "Type not found",
        error: "Bad Request",
      });
    }
    //check the category is there or not in db
    const isvalid_category = await categories.findOne({ category_name: category_name })
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
    const imageUrls = req.files.map((file) => file.location)

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

    // if(!Array.isArray(nearby)){
    //   return res.status(400).json({
    //     success: false,
    //     statuscode: 400,
    //     message: "Nearby is not an array",
    //     error: "Bad Request",
    //   });
    // }

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
      isbestfor,
      nearby: nearby.split(",").map((nearby) => nearby.trim())
    })

    if (!newaccommodation) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: "Accommodation not created",
        error: "Bad Request",
      });
    }
   //  //creatinon of  vendor for perticular accomidation 
   //  const existingvendor = await vendors.findOne({
   //    phone: vendorphone
   //  });

   //  if (existingvendor) {
   //    newaccommodation.vendor_id = existingvendor._id;
   //    await newaccommodation.save();
   //    return res.status(200).json({
   //      success: true,
   //      statuscode: 200,
   //      message: "Accommodation created successfully",
   //      data: newaccommodation

   //    });
   //  }
   //  const newvendor = await vendors.create({
   //    full_name: vendorname,
   //    email: vendoremail,
   //    phone: vendorphone,
   //    address: {
   //      city: vendorcity,
   //      state: vendorstate,
   //      address: vendoraddress
   //    },
   //    password: vendorpassword,
   //    status: "active"
   //  })

    // Prepare updates before saving
    newaccommodation.vendor_id = req.vendor._id; 
    await newaccommodation.save()

   //  // Run both tasks in parallel
   //  await Promise.all([
   //    newaccommodation.save(),
   //    sendEmail.sendEmail({
   //      to: vendoremail,
   //      subject: "Account Creation",
   //      text: vendorAccountCreatedTemplate(vendorname, vendorphone, vendorpassword),
   //    })
   //  ]);

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
exports.getvendorsproperties = async (req, res) => {
    try {
        const vendor_id = req.vendor._id;
        const {check_in_date,check_out_date} = req.query
        //console.log(req.query)
        let accos
        if(check_in_date && check_out_date){
            const checkin = new Date(check_in_date);
            const checkout = new Date(check_out_date);
            //console.log(checkin, checkout)
            accos = await accommodations.find({
                vendor_id: vendor_id,
                isverified: true
            })
            .populate({
                path: "room_id",
                populate: {
                    path: "pricing_id"
                },
                select: "-__v -createdAt -updatedAt"
            })
            .populate({ path: "pricing_ids", select: "-__v -createdAt -updatedAt" })
            .select("-__v -createdAt -updatedAt")
            
            //console.log('Before filtering - accommodations:', accos.length)
            //console.log('First accommodation room_id count:', accos[0]?.room_id?.length)
            
            accos = accos.map((acc) => {
                //console.log('Processing accommodation:', acc._id, 'with rooms:', acc.room_id?.length)
                acc.room_id = acc.room_id.filter((room) => {
                    let bookedBeds = 0;
                    
                    room.bookings?.forEach((b) => {
                        const bIn = new Date(b.check_in_date);
                        const bOut = new Date(b.check_out_date);
                        
                        if (checkin < bOut && checkout > bIn) {
                            bookedBeds += b.beds_booked;
                        }
                    });
                    
                    const isAvailable = bookedBeds < room.beds_available;
                    //console.log(`Room ${room._id}: booked=${bookedBeds}, total=${room.beds_available}, available=${isAvailable}`)
                    return isAvailable;
                });
                //console.log('After filtering - available rooms:', acc.room_id?.length)
                return acc;
            });
            // accos = accos.filter(
            //     (acc) => acc.room_id.length > 0
            // )
            
            // Remove room details from final response
            accos = accos.map(acc => {
                const { room_id, ...accommodationWithoutRooms } = acc.toObject();
                return accommodationWithoutRooms;
            });
        }
         else{
            accos = await accommodations.find({ vendor_id: vendor_id })
            .populate({ path: "pricing_ids", select: "-__v -createdAt -updatedAt" })
            .select("-__v -createdAt -updatedAt -property_description -check_in_time -cancellation_policy -host_contact -room_id") 
         }

        if (!accos) {
            return res.status(404).json({
                success: false,
                statuscode: 404,
                message: "No properties found",
            })
        }

        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: "Properties fetched successfully",
            data: accos
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

exports.getvendorbookings = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        let {paid,unpaid} = req.query;
        paid = paid === 'true';
        unpaid = unpaid === 'true';
        const vendor_id = req.vendor._id;
        let bookings = await orders.find({ vendorId: vendor_id })
            .populate({
                path: 'userId',
                select: '-__v -createdAt -updatedAt -wishlist -password -otp -otp_expiry -verify_expiry',
                model: 'users'
            })
            .populate({
                path: 'accommodationId',
                select: '-__v -createdAt -updatedAt -room_id -pricing_ids',
                model: 'accommodations'
            })
            .populate({
                path: 'room_id',
                select: "-__v -createdAt -updatedAt -accommodation_id -pricing_id -rooms_avilable -beds_available -no_of_guests"
            })
            .populate("paymentid")
            .skip(skip)
            .limit(limit)

        if (!bookings) {
            return res.status(404).json({
                success: false,
                statuscode: 404,
                message: "No bookings found",
            })
        }

        if (paid || unpaid) {

            const status = paid ? "paid" : "unpaid";

            const filteredBookings = await orders.find({
                vendorId: vendor_id,
                paymentid: { $exists: true }
            })
            .populate({
                path: 'paymentid',
                match: { payment_status: status },   
            })
            .populate({
                path: 'userId',
                select: '-__v -createdAt -updatedAt -wishlist -password -otp -otp_expiry -verify_expiry',
                model: 'users'
            })
            .populate({
                path: 'accommodationId',
                select: '-__v -createdAt -updatedAt -room_id -pricing_ids',
                model: 'accommodations'
            })
            .populate({
                path: 'room_id',
                select: "-__v -createdAt -updatedAt -accommodation_id -pricing_id -rooms_avilable -beds_available -no_of_guests"
            })
            .skip(skip)
            .limit(limit);

            // Important: Remove orders where populate match failed
            //const finalData = filteredBookings.filter(b => b.paymentid)
           
            // const total = await orders.find({
            //     vendorId: vendor_id,
            //     paymentid: { $exists: true }
            // })
            // .populate({
            //     path: 'paymentid',
            //     match: { payment_status: status },   
            // })
            // .countDocuments()
            return res.status(200).json({
                success: true,
                statuscode: 200,
                message: "Bookings fetched successfully",
                data: filteredBookings,
                total: filteredBookings.length,
                // totalPages: Math.ceil(total / limit)
            });
        }

        const total = await orders.find({ vendorId: vendor_id}).countDocuments()
        //console.log(total)
        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: "Bookings fetched successfully",
            data: bookings,
            total: bookings.length,
            totalPages: Math.ceil(total/ limit)
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

exports.getcancelrequestbookings = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const vendor_id = req.vendor._id;
        const bookings = await orders.find({ vendorId: vendor_id, status: "requested_for_cancel" })
            .populate({
                path: 'userId',
                select: '-__v -createdAt -updatedAt -wishlist -password -otp -otp_expiry -verify_expiry',
                model: 'users'
            })
            .populate({
                path: 'accommodationId',
                select: '-__v -createdAt -updatedAt -room_id -pricing_ids',
                model: 'accommodations'
            })
            .populate({
                path: 'room_id',
                select: "-__v -createdAt -updatedAt -accommodation_id -pricing_id -rooms_avilable -beds_available -no_of_guests"
            })
            .populate("paymentid")
            .skip(skip)
            .limit(limit)

        if (!bookings) {
            return res.status(404).json({
                success: false,
                statuscode: 404,
                message: "No bookings found",
            })
        }

        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: "Bookings fetched successfully",
            data: bookings,
            total: bookings.length,
            totalPages: Math.ceil(bookings.length / limit)
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

exports.getBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        // if(!id){
        //     return res.status(400).json({
        //       success: false,
        //       statuscode: 400,
        //       message: 'Invalid order ID',
        //       error: 'Bad Request'
        //     });
        // }
        const order_response = await orders.findOne({ bookingId: id })
            .populate({
                path: 'userId',
                select: '-__v -createdAt -updatedAt -wishlist -password -otp -otp_expiry -verify_expiry',
                model: 'users'
            })
            .populate({
                path: 'accommodationId',
                select: '-__v -createdAt -updatedAt -room_id -pricing_ids',
                model: 'accommodations'
            })
            .populate({
                path: 'room_id',
                select: "-__v -createdAt -updatedAt -accommodation_id -pricing_id -rooms_avilable -beds_available -no_of_guests"
            })
            .populate('paymentid')
            .lean();
        // const price = await PricingMatrix.findOne({room_id: order_response.room_id._id, 'pricing.price_type': order_response.price_type})
        // const perdayprice = price.pricing.find((pricing) => pricing.price_type === order_response.price_type)
        // order_response.room_price = perdayprice.price;
        // const totalproducts = order_response ? order_response..length : 0;
        if (!order_response) {
            return res.status(404).json({
                success: false,
                statuscode: 404,
                message: 'Booking not found',
                error: 'Not Found'
            });
        }
        return res.status(200).json({
            success: true,
            statuscode: 200,
            data: order_response,
            // totalproducts
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

exports.vendordashbord = async (req, res) => {
    try {
        const vendor_id = req.vendor._id;
        const totalbookings = await orders.countDocuments({ vendorId: vendor_id });
        const totalproperties = await accommodations.countDocuments({ vendor_id: vendor_id });
        const Totalbookings = await orders.find({ vendorId: vendor_id });
        let totalRevenue = 0;
        for (const booking of Totalbookings) {
            const payment = await userpayments.aggregate([
                {
                    $match: {
                        _id: booking.paymentid,
                        payment_status: "paid"
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$bookingamount" }
                    }
                }
            ])
            totalRevenue += payment.length > 0 ? payment[0].totalRevenue : 0;
        }

        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: "Vendor dashboard data fetched successfully",
            data: {
                totalbookings,
                totalproperties,
                totalRevenue
            }
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

exports.salesanalysis = async (req, res) => {
    try {
        const vendor_id = req.vendor._id;
        const { type } = req.query;
        const {accommodationId} = req.query;
        let groupId, format;

        if (type === "daily") {
            const now = new Date();
            startDate = new Date(now.setHours(0, 0, 0, 0));
            groupId = {
                $dateToString: { format: "%H:00", date: "$createdAt", timezone: "Asia/Kolkata" }
            };
            format = "%H:00";
        } else if (type === "weekly") {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 6);
            groupId = {
                $dateToString: { format: "%w", date: "$createdAt", timezone: "Asia/Kolkata" }
            };
            format = "%w";
        } else if (type === "monthly") {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 29);
            groupId = {
                $dateToString: { format: "%d-%b", date: "$createdAt", timezone: "Asia/Kolkata" }
            };
            format = "%d-%b";
        } else if (type === "yearly") {
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 11);
            groupId = {
                $dateToString: { format: "%b", date: "$createdAt", timezone: "Asia/Kolkata" }
            };
            format = "%b";
        }
        else {
            return res.status(400).json({ success: false, message: "Invalid type" });
        }
        let data 
      if(accommodationId){
            // Get specific accommodation bookings for this vendor
            const bookings = await orders.find({        
                vendorId: vendor_id, 
                accommodationId: accommodationId 
            }).select('paymentid');
            
            const paymentIds = bookings.map(b => b.paymentid).filter(id => id);
            
            // Get payment analytics for those specific bookings
            data = await userpayments.aggregate([
                {
                    $match: {
                        _id: { $in: paymentIds },
                        payment_status: "paid",
                        createdAt: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: groupId,
                        totalRevenue: { $sum: "$bookingamount" },
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        label: "$_id",
                        totalRevenue: 1,
                        count: 1
                    }
                },
                { $sort: { label: 1 } }
            ]);
      }else{
            // Get all bookings for this vendor
            const bookings = await orders.find({ vendorId: vendor_id }).select('paymentid');
            const paymentIds = bookings.map(b => b.paymentid).filter(id => id);
            
            // Get overall payment analytics for vendor
            data = await userpayments.aggregate([
                {
                    $match: {
                        _id: { $in: paymentIds },
                        payment_status: "paid",
                        createdAt: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: groupId,
                        totalRevenue: { $sum: "$bookingamount" },
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        label: "$_id",
                        totalRevenue: 1,
                        count: 1
                    }
                },
                { $sort: { label: 1 } }
         ]);
    }
        // const unpaiddata = await userpayments.aggregate([
        //     {
        //         $match: {
        //             _id: { $in: paymentIds },
        //             payment_status: "unpaid",
        //             createdAt: { $gte: startDate },
        //         }
        //     },
        //     {
        //         $group: {
        //             _id: groupId,
        //             totalRevenue: { $sum: "$bookingamount" },
        //             count: { $sum: 1 }
        //         }
        //     },
        //     {
        //         $project: {
        //             label: "$_id",
        //             totalRevenue: 1,
        //             count: 1
        //         }
        //     },
        //     { $sort: { label: 1 } }
        // ]);

        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: 'Sales Analysis Data Fetched Successfully',
            data,
           // unpaidData: unpaiddata
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            statuscode: 500,
            message: 'Internal Server Error',
            error: error.message
        })
    }
}

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
            "locationurl",
            "isbestfor",
            "nearby",
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

exports.gettickets = async (req,res) => {
    try{
        const usertickets = await tickets.aggregate([
            {
                $match: {
                    category: { $in: ["Room Issue", "General Questions"] }
                }
            }
        ])
        //console.log(usertickets)
        const userbookings = await orders.find({
            vendorId: req.vendor._id
        });
        //console.log(userbookings)
        const bookingData = userbookings
        .map(booking => usertickets.find(t => t.bookingId === booking.bookingId))
        .filter(ticket => ticket); // remove undefined
        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: 'Tickets Fetched Successfully',
            bookingData
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
