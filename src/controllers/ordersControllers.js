const { default: mongoose } = require("mongoose");
const orders = require("../models/ordersSchema.js");
const products = require("../models/accommodations.js");
const ProductMatrix = require("../models/PricingSchema.js");
const users = require("../models/userschema.js");
const crypto = require("crypto");
const PricingMatrix = require("../models/PricingSchema.js");
const coupons = require("../models/couponSchema.js")
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const rawUUID = uuidv4();
const Razorpay = require("razorpay");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});
const payments = require("../models/userpayments.js")
const rooms = require("../models/rooms.js")
const vendors = require("../models/vendors.js");
const { promises } = require("dns");
const accommodations = require("../models/accommodations.js");
const { invoiceTemplate } = require("../utils/emailTemplates.js")
//const pdf = require("html-pdf-node");
const pdfkit = require("pdfkit");
const auth = require("../middlewares/authUser.js");
//const { default: orders } = require("razorpay/dist/types/orders.js");
const reviews = require("../models/reviewschema.js");
const bookings = require("../models/ordersSchema.js");

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderstatus, paymentstatus } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: 'Order ID is required',
        error: 'Bad Request'
      });
    }

    const order_response = await orders.findOne({ bookingId: id }).populate('paymentid');
    if (!order_response) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: 'Order not found',
        error: 'Not Found'
      });
    }

    // Handle order status update
    if (orderstatus && orderstatus !== 'undefined') {
      order_response.status = orderstatus;
      if (orderstatus === "checkin") order_response.checkinAt = true;
      if (orderstatus === "checkout") order_response.checkoutAt = true;
      await order_response.save();
    }

    // Handle payment status update
    if (order_response.paymentid && paymentstatus && paymentstatus !== 'undefined') {
      const payment_res = await payments.findById(order_response.paymentid);
      if (payment_res) {
        payment_res.payment_status = paymentstatus;
        await payment_res.save();
      }
    }

    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: 'Status updated successfully',
      data: {
        orderStatus: order_response.status,
        paymentStatus: order_response.paymentid?.payment_status
      }
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

exports.makeOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const ids = id.includes(",") ? id.split(",").map(i => i.trim()) : [id.trim()];
    const {
      cartquantity,
      paymentmode,
      couponCode,
      productquantity,
      orderamount,
      discountamount,
      addressid,
      shippingcost,
      tax
    } = req.body;

    const user_response = await users.findById(req.user._id);
    if (!user_response) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: "User not found",
        error: "Not Found"
      });
    }
    const address_response = await useraddress.findById(addressid);
    if (!address_response) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: "Address not found",
        error: "Not Found"
      });
    }
    const invoiceNumber = `SKINV-${Date.now().toString().slice(-6)}`;


    if (!mongoose.Types.ObjectId.isValid(ids[0])) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    //First validate all data before creating Razorpay order
    let productDirect;
    let selectedproductprice;
    if (ids.length === 1) {
      productDirect = await products.findById(ids[0]);
      //console.log(productDirect);
      if (productDirect) {
        selectedproductprice = await PricingMatrix.findOne({
          productId: productDirect._id,
          quantity: productquantity || ""
        });
        //console.log(selectedproductprice);
        if (!selectedproductprice) {
          return res.status(400).json({
            success: false,
            statuscode: 400,
            message: "Product price not found",
            error: "Bad Request"
          });
        }
        if (productDirect.stock < cartquantity) {
          return res.status(400).json({
            success: false,
            statuscode: 400,
            message: "Stock not available",
            error: "Bad Request"
          });
        }
      }
      productDirect = { ...productDirect, price: selectedproductprice };
    }

    let razorpayOrder;
    if (paymentmode === "online") {
      razorpayOrder = await razorpay.orders.create({
        amount: orderamount * 100,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        payment_capture: 1
      });

      // Send Razorpay details to frontend before order insertion
      return res.status(200).json({
        success: true,
        statuscode: 200,
        message: "Razorpay order created successfully",
        order: {
          id: razorpayOrder.id,
          currency: razorpayOrder.currency,
          amount: razorpayOrder.amount,
          //key: process.env.RAZORPAY_KEY_ID
        }
      });
    }
    // The rest of the order creation logic will be handled after payment verification
    if (ids.length === 1) {
      let productDirect;

      productDirect = await products.findById(ids[0]);
      //console.log(productDirect);
      if (productDirect) {
        const selectedproductprice = await PricingMatrix.findOne({ productId: ids[0], quantity: productquantity || "" });
        //console.log(selectedproductprice);
        if (!selectedproductprice) {
          return res.status(400).json({
            success: false,
            statuscode: 400,
            message: "Product price not found",
            error: "Bad Request"
          });
        }
        if (productDirect.stock < cartquantity) {
          return res.status(400).json({
            success: false,
            statuscode: 400,
            message: "Stock not available",
            error: "Bad Request"
          });
        }
        productDirect = { ...productDirect, price: selectedproductprice };
      }

      if (productDirect) {
        // Ensure all required fields are present
        const productData = productDirect._doc || productDirect;
        const productImage = productData.imagesUrl && productData.imagesUrl[0] ? productData.imagesUrl[0] : '';

        // Buy Now logic
        let newOrder = await orders.create({
          userId: req.user._id,
          products: [
            {
              productId: ids[0],
              productquantity: productquantity || "",
              cartquantity: cartquantity || 1,
              productprice: productDirect.price?.productprice || 0,
              shippingcost: productData.shippingcost || 0,
              taxpercentage: productData.taxpercentage || 0,
              productimages: productImage,
              productname: productData.productname || 'Unnamed Product'
            }
          ],
          shipping_address: {
            placeType: address_response.placeType,
            contactinfo: {
              fullname: address_response.contactinfo.fullname,
              mobilenumber: address_response.contactinfo.mobilenumber,
              emailAddress: address_response.contactinfo.emailAddress
            },
            shippingAddress: {
              streetAddress: address_response.shippingAddress.streetAddress,
              city: address_response.shippingAddress.city,
              state: address_response.shippingAddress.state,
              housenoandfloor: address_response.shippingAddress.housenoandfloor,
              nearbylandmark: address_response.shippingAddress.nearbylandmark
            }
          },
          orderamount,
          couponCode,
          status: "confirmed",
          discountamount,
        });

        const userpayments = await payments.create({
          userId: req.user._id,
          orderid: newOrder._id,
          OrderId: newOrder.orderId,
          orderamount,
          payment_mode: paymentmode,
          invoice: invoiceNumber,
          shippingcost: productData.shippingcost,
          tax: tax,
          paymentInfo: {
            razorpay_orderId: paymentmode === "online" ? razorpayOrder?.id : null
          }
        })
        newOrder.paymentid = userpayments._id
        await newOrder.save()

        //update product ordercount
        let updateproduct = await products.findById(ids[0])
        updateproduct.ordercount = updateproduct.ordercount + 1
        await updateproduct.save()

        //update product stock
        await products.updateOne(
          { _id: newOrder.products[0].productId },
          { $inc: { stock: -newOrder.products[0].cartquantity } }
        )

        //update coupon
        if (newOrder.couponCode) {
          const coupon_res = await coupons.findOne({ couponCode: newOrder.couponCode });
          if (coupon_res) {
            if (!coupon_res.usedBy) {
              coupon_res.usedBy = []; // Initialize usedBy array if it doesn't exist
            }
            if (!coupon_res.usedBy.includes(req.user._id.toString())) {
              coupon_res.usedBy.push(req.user._id);
              await coupon_res.save();
            }
          }
        }

        return res.status(200).json({
          success: true,
          statuscode: 200,
          message: "Your order placed successfully",
          order_id: newOrder._id,
          razorpay_orderId: paymentmode === "online" ? razorpayOrder?.id : null,
          orderamount,
          couponCode,
          newOrder
        });

      } else {
        // ✅ Single Cart item logic
        const cartItem = await carts.findById(ids[0]);
        //console.log(cartItem);
        if (!cartItem) {
          return res.status(404).json({
            success: false,
            statuscode: 404,
            message: "Cart not found",
            error: "Not Found"
          });
        }

        let product;
        let price;

        product = await products.findById(cartItem.productId);
        if (product.stock < cartItem.cartquantity) {
          return res.status(400).json({
            success: false,
            statuscode: 400,
            message: "Stock not available",
            error: "Bad Request"
          });
        }
        //console.log(product);
        price = await PricingMatrix.findOne({ productId: cartItem.productId, quantity: cartItem.productquantity || "" });
        //console.log(price);
        product = { ...product, price };
        const productdata = product._doc || product;
        const productImage = productdata.imagesUrl && productdata.imagesUrl[0] ? productdata.imagesUrl[0] : '';
        if (!product) {
          return res.status(404).json({
            success: false,
            statuscode: 404,
            message: "Product not found in cart",
            error: "Not Found"
          });
        }
        if (!price) {
          return res.status(400).json({
            success: false,
            statuscode: 400,
            message: "Product price not found for selected size",
            error: "Bad Request"
          });
        }

        let newOrder = await orders.create({
          userId: req.user._id,
          products: [
            {
              productId: cartItem.productId,
              productquantity: cartItem.productquantity || "",
              cartquantity: cartItem.cartquantity,
              productprice: price.productprice,
              shippingcost: productdata.shippingcost,
              taxpercentage: productdata.taxpercentage,
              productimages: productImage,
              productname: productdata.productname
            }
          ],
          shipping_address: {
            placeType: address_response.placeType,
            contactinfo: {
              fullname: address_response.contactinfo.fullname,
              mobilenumber: address_response.contactinfo.mobilenumber,
              emailAddress: address_response.contactinfo.emailAddress
            },
            shippingAddress: {
              streetAddress: address_response.shippingAddress.streetAddress,
              city: address_response.shippingAddress.city,
              state: address_response.shippingAddress.state,
              housenoandfloor: address_response.shippingAddress.housenoandfloor,
              nearbylandmark: address_response.shippingAddress.nearbylandmark
            }
          },
          orderamount,
          couponCode,
          status: "confirmed",
          discountamount
        });

        const userpayments = await payments.create({
          userId: req.user._id,
          orderid: newOrder._id,
          OrderId: newOrder.orderId,
          orderamount,
          payment_mode: paymentmode,
          invoice: invoiceNumber,
          shippingcost: shippingcost,
          tax: tax,
          paymentInfo: {
            razorpay_orderId: paymentmode === "online" ? razorpayOrder?.id : null
          }
        })
        if (newOrder) {
          await carts.findByIdAndDelete(ids[0]);
        }
        newOrder.paymentid = userpayments._id
        await newOrder.save()
        // Get the first product from the order
        const productId = newOrder.products[0]?.productId;
        if (!productId) {
          //console.error('No product ID found in order');
          return res.status(400).json({
            success: false,
            message: 'No product found in order'
          });
        }

        // Update the product's order count using findOneAndUpdate
        const updatedProduct = await products.findOneAndUpdate(
          { _id: productId },
          { $inc: { ordercount: 1 } },
          { new: true, runValidators: true }
        );

        if (!updatedProduct) {
          //console.error(`Product not found with ID: ${productId}`);
          return res.status(404).json({
            success: false,
            message: 'Product not found'
          });
        }
        //  const coupon_res = await coupons.findOne({couponCode:newOrder.couponCode})
        //  coupon_res.usedBy.push(req.user._id);
        //  await coupon_res.save();

        //update product stock
        await products.updateOne(
          { _id: newOrder.products[0].productId },
          { $inc: { stock: -newOrder.products[0].cartquantity } }
        )

        //update coupon
        if (newOrder.couponCode) {
          const coupon_res = await coupons.findOne({ couponCode: newOrder.couponCode });
          if (coupon_res) {
            if (!coupon_res.usedBy) {
              coupon_res.usedBy = []; // Initialize usedBy array if it doesn't exist
            }
            if (!coupon_res.usedBy.includes(req.user._id.toString())) {
              coupon_res.usedBy.push(req.user._id);
              await coupon_res.save();
            }
          }
        }

        return res.status(200).json({
          success: true,
          statuscode: 200,
          newOrder,
          message: "Your order placed successfully",
          order_id: newOrder._id,
          razorpay_orderId: paymentmode === "online" ? razorpayOrder?.id : null,
          orderamount,
          couponCode
        });
      }
    }

    // === MULTIPLE CART ORDER ===
    const productsInOrder = [];
    const failedItems = [];
    const successfullcartids = [];

    for (let cartId of ids) {
      if (!mongoose.Types.ObjectId.isValid(cartId)) continue;

      const cartItem = await carts.findById(cartId)
      // console.log(cartItem);
      if (!cartItem) {
        failedItems.push({ cartId, response: "Cart not found" });
        continue;
      }
      let productincart;
      let price;
      productincart = await products.findById(cartItem.productId);
      if (productincart.stock < cartItem.cartquantity) {
        failedItems.push({ cartId, response: "Stock not available" });
        continue;
      }
      const productdata = productincart._doc || productincart;
      const productImage = productdata.imagesUrl && productdata.imagesUrl[0] ? productdata.imagesUrl[0] : '';
      price = await PricingMatrix.findOne({ productId: cartItem.productId, quantity: cartItem.productquantity || "" });
      productincart = { ...productincart, price };
      if (!productincart) {
        failedItems.push({ cartId, response: "Product not found" });
        continue;
      }
      if (!price) {
        failedItems.push({ cartId, response: "Product price not found for selected size" });
        continue;
      }
      productsInOrder.push({
        productId: cartItem.productId,
        productquantity: cartItem.productquantity || "",
        cartquantity: cartItem.cartquantity,
        productprice: price.productprice,
        shippingcost: productdata.shippingcost,
        taxpercentage: productdata.taxpercentage,
        productimages: productImage,
        productname: productdata.productname,
      });

      successfullcartids.push(cartId);
    }

    if (productsInOrder.length === 0) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: "No valid cart items found",
        failedItems
      });
    }

    // Create ONE ORDER with multiple products
    const newOrder = await orders.create({
      userId: req.user._id,
      products: productsInOrder,
      shipping_address: {
        placeType: address_response.placeType,
        contactinfo: {
          fullname: address_response.contactinfo.fullname,
          mobilenumber: address_response.contactinfo.mobilenumber,
          emailAddress: address_response.contactinfo.emailAddress
        },
        shippingAddress: {
          streetAddress: address_response.shippingAddress.streetAddress,
          city: address_response.shippingAddress.city,
          state: address_response.shippingAddress.state,
          housenoandfloor: address_response.shippingAddress.housenoandfloor,
          nearbylandmark: address_response.shippingAddress.nearbylandmark
        }
      },
      orderamount,
      couponCode,
      status: "confirmed",
      discountamount
    });
    const userpayments = await payments.create({
      userId: req.user._id,
      orderid: newOrder._id,
      OrderId: newOrder.orderId,
      orderamount,
      payment_mode: paymentmode,
      invoice: invoiceNumber,
      shippingcost: shippingcost,
      tax: tax,
      paymentInfo: {
        razorpay_orderId: paymentmode === "online" ? razorpayOrder?.id : null
      }
    })
    newOrder.paymentid = userpayments._id
    await newOrder.save()
    const productId = newOrder.products.map(item => item.productId);
    const updateproduct = await products.findOneAndUpdate(
      { _id: { $in: productId } },
      { $inc: { ordercount: 1 } },
      { new: true, runValidators: true }
    );

    if (!updateproduct) {
      //console.error(`Product not found with ID: ${productId}`);
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    //  const coupon_res = await coupons.findOne({couponCode:newOrder.couponCode})
    //  coupon_res.usedBy.push(req.user._id);
    //  await coupon_res.save();

    //update product stock
    for (let i = 0; i < newOrder.products.length; i++) {
      await products.updateOne(
        { _id: newOrder.products[i].productId },
        { $inc: { stock: -newOrder.products[i].cartquantity } }
      )
    }
    //update coupon
    if (newOrder.couponCode) {
      const coupon_res = await coupons.findOne({ couponCode: newOrder.couponCode });
      if (coupon_res) {
        if (!coupon_res.usedBy) {
          coupon_res.usedBy = []; // Initialize usedBy array if it doesn't exist
        }
        if (!coupon_res.usedBy.includes(req.user._id.toString())) {
          coupon_res.usedBy.push(req.user._id);
          await coupon_res.save();
        }
      }
    }
    await carts.deleteMany({ _id: { $in: successfullcartids } });

    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: "Your order placed successfully",
      order_id: newOrder._id,
      orderamount,
      razorpay_orderId: paymentmode === "online" ? razorpayOrder?.id : null,
      invoice: invoiceNumber,
    });

  } catch (error) {
    //console.error("Error in makeOrder:", error);
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

exports.makebooking = async (req, res) => {
  try {
    const { accoid, roomid } = req.params;
    console.log(req.params)
    if (!accoid || !roomid) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: "Invalid accommodation or room ID",
      })
    }
    const {
      check_in_date,
      check_out_date,
      noofguests,
      guestdetails,
      paymentmode,
      bookingamount,
      couponCode,
      discountamount,
      price_type
    } = req.body

    if (!check_in_date || !check_out_date || !noofguests || !bookingamount || !price_type) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: "Invalid accommodation or room ID",
      })
    }
    if (!guestdetails || typeof guestdetails !== "object") {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: "Guest Details type is not valid",
      })
    }
    let { fullname, mobilenumber, emailAddress, emailaddress, agreed, noofadults, noofchildrens, gender } = guestdetails
    emailAddress = emailAddress || emailaddress;
    //console.log(guestdetails)
    if (!fullname || !mobilenumber || !emailAddress || !agreed || (noofadults === undefined || noofadults === null) || (noofchildrens === undefined || noofchildrens === null) || !gender) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: "Invalid guest details",
      })
    }
    const [accommodation,room] = await Promise.all([
      products.findById(accoid),
      rooms.findById(roomid)
    ])
    //const accommodation = await products.findById(accoid)
    //console.log('Accommodation vendor ID:', accommodation.vendor_id);
    if (!accommodation) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: "Accommodation not found",
      })
    }
    //const room = await rooms.findById(roomid)
    if (!room) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: "Room not found",
      })
    }
    const invoiceNumber = `INDHOSTELS-${Date.now().toString().slice(-6)}`;

    let razorpayOrder;
    if (paymentmode === "online") {
      razorpayOrder = await razorpay.orders.create({
        amount: bookingamount * 100,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        payment_capture: 1
      })
      return res.status(200).json({
        success: true,
        statuscode: 200,
        message: "Razorpay booking created successfully",
        order: {
          id: razorpayOrder.id,
          currency: razorpayOrder.currency,
          ammount: razorpayOrder.amount
        }
      })
    }
    //check price of the room
    const roomprice = await PricingMatrix.findOne({ room_id: roomid, 'pricing.price_type': price_type })
    const perdayprice = roomprice.pricing.find((pricing) => pricing.price_type === price_type)
    if (!roomprice) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: "Room price not found",
      })
    }
    //calculate no.of days 
    const checkInDate = new Date(check_in_date);
    const checkOutDate = new Date(check_out_date);
    const diffTime = Math.abs(checkOutDate - checkInDate);
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      diffDays = `${diffDays} days`;
    } else if (diffDays > 7 && diffDays <= 30) {
      diffDays = `${Math.ceil(diffDays / 7)} weeks`;
    } else if (diffDays > 30) {
      const checkIn = new Date(check_in_date);
      const checkOut = new Date(check_out_date);

      const startYear = checkIn.getFullYear();
      const startMonth = checkIn.getMonth();

      const endYear = checkOut.getFullYear();
      const endMonth = checkOut.getMonth();

      // Calculate pure month difference
      let monthDiff = (endYear - startYear) * 12 + (endMonth - startMonth);

      // Always treat next-month stay as at least 1 month
      if (monthDiff <= 0) monthDiff = 1;

      diffDays = `${monthDiff} months`;
    }

    const create_booking = await orders.create({
      userId: req.user._id,
      accommodationId: accommodation._id,
      room_id: room._id,
      price_type: price_type,
      room_price: perdayprice.price,
      check_in_date: check_in_date,
      check_out_date: check_out_date,
      guests: noofguests,
      roomtype: room.room_type,
      guestdetails: {
        fullname: fullname,
        mobilenumber: mobilenumber,
        emailAddress: emailAddress,
        stayinfo: {
          check_in: check_in_date,
          check_out: check_out_date,
          roomtype: room.room_type,
        },
        agreed: agreed,
        noofadults: noofadults,
        noofchildrens: noofchildrens,
        gender: gender
      },
      bookingamount: bookingamount,
      couponCode: couponCode,
      discountamount: discountamount,
      vendorId: accommodation.vendor_id || null,
      days: diffDays,
      status: "confirmed",
    })
    const create_payment = await payments.create({
      userId: req.user._id,
      bookingid: create_booking._id,
      BookingId: create_booking.bookingId,
      bookingamount: bookingamount,
      payment_mode: paymentmode,
      payment_status: "unpaid",
      paymentInfo: {
        razorpay_orderId: paymentmode === "online" ? razorpayOrder?.id : null
      },
      invoice: invoiceNumber,
      tax: accommodation.tax_amount
    })

    //update payment id in booking
    create_booking.paymentid = create_payment._id;
    //update room bookings
    room.bookings.push({
      check_in_date: create_booking.check_in_date,
      check_out_date: create_booking.check_out_date,
      beds_booked: noofguests
    })

    //update booking count in accommodation
    const updateacco = await accommodation.updateOne({ _id: accommodation._id }, { $inc: { bookingcount: 1 } });
    //console.log(updateacco) 
    Promise.all([
      await create_booking.save(),
      await room.save()
    ])
    //update accomidation 
    if (room.no_of_guests === noofguests) {
      room.rooms_available -= 1;
      room.beds_available -= noofguests;
      await room.save();
    } else if (room.no_of_guests >= 1) {
      room.beds_available -= noofguests;
      await room.save();
    }

    if (create_booking.couponCode) {
      const coupon_res = await coupons.findOne({ couponCode: create_booking.couponCode });
      if (coupon_res) {
        if (!coupon_res.usedBy) {
          coupon_res.usedBy = []; // Initialize usedBy array if it doesn't exist
        }
        if (!coupon_res.usedBy.includes(req.user._id.toString())) {
          coupon_res.usedBy.push(req.user._id);
          await coupon_res.save();
        }
      }
    }
    const Order = create_booking
    auth.sendconformationmail(Order)
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: "Booking created successfully and pay at the time of check-in at the accommodation",
      booking: create_booking,
      payment: create_payment
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

//cancel order :
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(401).json({
        success: false,
        message: "invalid ID",
      });
    }
    const order = await orders.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "order not found",
      });
    }
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "you are not authorized",
        error: "UnAuthorized",
      });
    }

    const ordercancilation = await accommodations.findById(order.accommodationId);
    if (!ordercancilation) {
      return res.status(404).json({
        success: false,
        message: "accommodation not found",
      });
    }
   const now = new Date();
const checkInDate = new Date(order.check_in_date);

// Calculate hours difference until check-in
const hoursBeforeCheckIn = (checkInDate - now) / (1000 * 60 * 60);

// Cancellation Policy Logic
if (ordercancilation.cancellation_policy === "before24hrs") {
    if (hoursBeforeCheckIn >= 24) {
        order.status = "requested_for_cancel";
        await order.save();
        return res.status(200).json({
            success: true,
            message: "Your order cancellation request has been submitted successfully.",
        });
    }else{
        return res.status(401).json({
            success: false,
            message: "You can't cancel this booking,The cancellation policy is before 24 hours.",
        });
    }
}

if (ordercancilation.cancellation_policy === "before48hrs") {
    if (hoursBeforeCheckIn >= 48) {
        order.status = "requested_for_cancel";
        await order.save();
        return res.status(200).json({
            success: true,
            message: "Your order cancellation request has been submitted successfully.",
        });
    }else{
        return res.status(401).json({
            success: false,
            message: "You can't cancel this booking,The cancellation policy is before 48 hours.",
        });
    }
}

    if (order.status === "requested_for_cancel" || order.status === "cancelled") {
      return res.status(401).json({
        success: false,
        message: "Already requested for order cancellation",
      });
    }
    return res.status(200).json({
      success: true,
      message:
        "Your cant cancel this booking,There is no cancellation policy for this accommodation.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

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

      //console.log(order_response.paymentid)
    // const price = await PricingMatrix.findOne({room_id: order_response.room_id._id, 'pricing.price_type': order_response.price_type})
    // const perdayprice = price.pricing.find((pricing) => pricing.price_type === order_response.price_type)
    // order_response.room_price = perdayprice.price;
    // const totalproducts = order_response ? order_response..length : 0;
      let paymenthistory 
    if(order_response.paymentid.paymentInfo){
      paymenthistory = await razorpay.payments.fetch(order_response.paymentid.paymentInfo.razorpay_payment_id)
    }
    if (!order_response) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: 'Booking not found',
        error: 'Not Found'
      });
    }
    // Authorization: allow owner OR admin roles to view
    const isOwner = req.user && order_response.userId._id.toString() === req.user._id.toString();
    const role = req.user && (req.user.accountType || req.user.role);
    const isAdmin = role && ['admin', 'superadmin', 'owner'].includes(String(role).toLowerCase());
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        statuscode: 403,
        message: 'You are not authorized to view this order',
        error: 'Forbidden'
      });
    }

    return res.status(200).json({
      success: true,
      statuscode: 200,
      data: order_response,
      // totalproducts
      paymenthistory: paymenthistory || []
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

// exports.genrateInvoice = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const order = await orders.findOne({ bookingId: id })
//       .populate({
//         path: 'userId',
//         select: '-wishlist -password -otp -otp_expiry -verify_expiry',
//       })
//       .populate({
//         path: 'accommodationId',
//         select: '-room_id -pricing_ids',
//       })
//       .populate({
//         path: 'room_id',
//         select: '-accommodation_id -pricing_id -rooms_avilable -beds_available -no_of_guests',
//       })
//       .populate('paymentid')
//       .lean();

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         statuscode: 404,
//         message: 'Order not found',
//       });
//     }

//     // Razorpay fetch
//     const paymenthistory = await razorpay.payments.fetch(
//       order.paymentid.paymentInfo.razorpay_payment_id
//     );

//     // HTML template
//     const invoiceHTML = invoiceTemplate(order, paymenthistory);

//     const file = { content: invoiceHTML };

//     const options = {
//       format: "A4",
//       args: [
//         "--no-sandbox",
//         "--disable-setuid-sandbox",
//         "--disable-dev-shm-usage",
//         "--disable-gpu"
//       ]
//     };

//     // Generate PDF
//     const pdfbufferdata = await pdf.generatePdf(file, options);

//     // Send response
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
//     res.setHeader("Content-Length", pdfbufferdata.length);

//     return res.status(200).send(pdfbufferdata);

//   } catch (error) {
//     console.error("Invoice Error:", error);
//     return res.status(500).json({
//       success: false,
//       statuscode: 500,
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };

// Get all orders with complete details
// exports.viewAllOrders = async (req, res) => {
//   try {
//     // First get all orders with basic product and pot info
//     const allorders = await orders
//       .find({ userId: req.user._id })
//       .populate([
//         {
//           path: 'products.productId',
//           select: '-__v -createdAt -updatedAt',
//           model: 'products',
//           populate: {
//             path: 'attributesid',
//             select: '-__v -createdAt -updatedAt'
//           }
//         },
//         {
//           path: 'products.potid',
//           select: '-__v -createdAt -updatedAt',
//           model: 'pots',
//           populate: {
//             path: 'potsattributesid',
//             select: '-__v -createdAt -updatedAt'
//           }
//         }
//       ])
//       .sort({ createdAt: -1 })
//       .lean()
//       .exec();

//     if (!allorders || allorders.length === 0) {
//       return res.status(404).json({
//         success: false,
//         statuscode: 404,
//         message: "No orders found",
//       });
//     }

//     // Process orders to include all relevant details
//     const processedOrders = allorders.map(order => {
//       const processedProducts = order.products.map(product => {
//         const productData = {
//           ...product,
//           // Include product details
//           productDetails: product.productId ? {
//             ...product.productId,
//             attributes: product.productId.attributesid || {},
//             attributesid: undefined // Remove the original reference
//           } : null,
//           // Include pot details if exists
//           potDetails: product.potid ? {
//             ...product.potid,
//             attributes: product.potid.potsattributesid || {},
//             potsattributesid: undefined // Remove the original reference
//           } : null,
//           // Clean up the response
//           productId: product.productId?._id || product.productId,
//           potid: product.potid?._id || product.potid
//         };

//         // Remove populated fields to avoid duplication
//         delete product.productId;
//         delete product.potid;

//         return productData;
//       });

//       return {
//         ...order,
//         products: processedProducts
//       };
//     });

//     return res.status(200).json({
//       success: true,
//       statuscode: 200,
//       data: processedOrders,
//     });
//   } catch (error) {
//     console.error('Error in viewAllOrders:', error);
//     return res.status(500).json({
//       success: false,
//       statuscode: 500,
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };



// exports.viewAllOrders = async (req, res) => {
//   try {
//     const allorders = await orders
//       .find({ userId: req.user._id })
//       .sort({ createdAt: -1 })
//       .lean();

//     if (!allorders || allorders.length === 0) {
//       return res.status(404).json({
//         success: false,
//         statuscode: 404,
//         message: "No orders found",
//       });
//     }

//     const processedOrders = await Promise.all(allorders.map(async (order) => {
//       const processedProducts = await Promise.all(order.products.map(async (product) => {
//         let productDetails = null;
//         let potDetails = null;

//         if (product.productType === 'products') {
//           const prod = await products.findById(product.productId)
//             .select('-__v -createdAt -updatedAt')
//             .populate({
//               path: 'attributesid',
//               select: '-__v -createdAt -updatedAt'
//             })
//             .populate({
//               path: 'potid',
//               strictPopulate: false,
//               select: '-__v -createdAt -updatedAt'
//             })
//             .lean();
//           productDetails = prod
//             ? { ...prod, attributes: prod.attributesid || {}, attributesid: undefined }
//             : null;
//         } else if (product.productType === 'pots') {
//           const pot = await pots.findById(product.productId)
//             .select('-__v -createdAt -updatedAt')
//             .populate({
//               path: 'potsattributesid',
//               select: '-__v -createdAt -updatedAt'
//             })
//             .lean();
//           potDetails = pot
//             ? { ...pot, attributes: pot.potsattributesid || {}, potsattributesid: undefined }
//             : null;
//         }

//         return {
//           ...product,
//           productDetails,
//           potDetails
//         };
//       }));

//       return {
//         ...order,
//         products: processedProducts
//       };
//     }));

//     return res.status(200).json({
//       success: true,
//       statuscode: 200,
//       data: processedOrders,
//     });
//   } catch (error) {
//     console.error('Error in viewAllOrders:', error);
//     return res.status(500).json({
//       success: false,
//       statuscode: 500,
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };
exports.genrateInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await orders.findOne({ bookingId: id })
      .populate({
        path: "userId",
        select: "-wishlist -password -otp -otp_expiry -verify_expiry",
      })
      .populate({
        path: "accommodationId",
        select: "-room_id -pricing_ids",
      })
      .populate({
        path: "room_id",
        select: "-accommodation_id -pricing_id -rooms_avilable -beds_available -no_of_guests",
      })
      .populate("paymentid")
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Create PDF
    const doc = new pdfkit({ size: "A4", margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order.bookingId}.pdf`
    );

    doc.pipe(res);

    /* ================= HEADER ================= */
    doc
      .fontSize(20)
      .text("IND HOSTELS", { align: "center" })
      .moveDown(0.5);

    doc
      .fontSize(12)
      .text("Invoice", { align: "center" })
      .moveDown(1);

    doc
      .fontSize(10)
      .text(`Invoice No: ${order.paymentid?.invoice || "NA"}`)
      .text(`Booking ID: ${order.bookingId}`)
      .text(`Date: ${new Date(order.createdAt).toDateString()}`)
      .moveDown(1);

    /* ================= CUSTOMER ================= */
    doc
      .fontSize(12)
      .text("Billed To:", { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .text(order.userId.fullname)
      .text(order.userId.email)
      .text(order.userId.phone)
      .moveDown(1);

    /* ================= ACCOMMODATION ================= */
    doc
      .fontSize(12)
      .text("Accommodation Details:", { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .text(`Property: ${order.accommodationId.property_name}`)
      .text(`City: ${order.accommodationId.location.city}`)
      .text(`Area: ${order.accommodationId.location.area}`)
      .text(`Room Type: ${order.roomtype}`)
      .moveDown(1);

    /* ================= BOOKING ================= */
    doc
      .fontSize(12)
      .text("Booking Details:", { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .text(`Check-in: ${new Date(order.check_in_date).toDateString()}`)
      .text(`Check-out: ${new Date(order.check_out_date).toDateString()}`)
      .text(`Guests: ${order.guests}`)
      .moveDown(1);

    /* ================= PAYMENT ================= */
    doc
      .fontSize(12)
      .text("Payment Summary:", { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .text(`Room Price: ${order.room_price}`)
      .text(`Tax: ${order.paymentid?.tax || 0}`)
      .text(`Discount: ${order.discountamount || 0}`)
      .moveDown(0.5);

    doc
      .fontSize(12)
      .text(`Total Amount: ${order.bookingamount}`, { bold: true })
      .moveDown(1);

    /* ================= FOOTER ================= */
    doc
      .fontSize(10)
      .text("Payment Status: " + order.paymentid.payment_status.toUpperCase())
      .moveDown(1);

    doc
      .fontSize(9)
      .text(
        "This is a system-generated invoice. No signature required.",
        { align: "center" }
      );

    doc.end();

  } catch (error) {
    console.error("Invoice Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
exports.viewAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const allorders = await orders.find({ userId: req.user._id })
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
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    if (!allorders || allorders.length === 0) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: "No orders found",
      });
    }

    const totalOrders = await orders.countDocuments({ userId: req.user._id });
    //const totalProducts = allorders.reduce((sum, order) => sum + (order.products ? order.products.length : 0), 0);
    return res.status(200).json({
      success: true,
      statuscode: 200,
      data: allorders,
      totalpages: Math.ceil(totalOrders / limit),
      totalOrders
    });
  } catch (error) {
    //console.error('Error in viewAllOrders:', error);
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.ApplyCoupon = async (req, res) => {
  try {
    const { coupon } = req.body;
    if (!coupon) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: 'coupon is required',
        error: 'Bad Request'
      })
    }
    const coupon_response = await coupons.findOne({ couponCode: coupon })
    // .explain("executionStats") 
    // console.log(JSON.stringify(coupon_response, null, 2))
    if (!coupon_response) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: 'coupon not found',
        error: 'Bad Request'
      })
    }
    if (coupon_response.expireDate && new Date(coupon_response.expireDate) < new Date()) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: 'Coupon is expired',
        error: 'Bad Request'
      })
    }
    const userorderconfirmed = await orders.findOne({ userId: req.user._id, status: 'confirmed', couponCode: coupon })
    const isCouponUsed = coupon_response.usedBy.includes(req.user._id);
    if (userorderconfirmed || isCouponUsed) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: 'Coupon is already used',
        error: 'Bad Request'
      })
    }
    // coupon_response.usedBy.push(req.user._id);
    // await coupon_response.save();
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: 'Coupon applied successfully',
      data: coupon_response
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

exports.GetAllCoupons = async (req, res) => {
  try {
    const all_coupons = await coupons.find();
    if (!all_coupons) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: 'No coupons found',
        error: 'Not Found'
      })
    }
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: 'Coupons fetched successfully',
      data: all_coupons,
      totalcoupons: all_coupons.length
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

exports.searchcoupon = async (req, res) => {
  try {
    const { searchquery } = req.query;
    if (!searchquery || searchquery.trim() === '') {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: 'Search query is required',
        error: 'Bad Request'
      })
    }
    const searchRegex = new RegExp(searchquery, 'i');

    const searchcoupons = await coupons.find({ couponCode: searchRegex })
    // .explain("executionStats") 
    // console.log(JSON.stringify(searchcoupons, null, 2))
    if (!searchcoupons || searchcoupons.length === 0) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: 'No coupons found',
        error: 'Not Found'
      })
    }
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: 'Coupons fetched successfully',
      data: searchcoupons
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

exports.trackorder = async (req, res) => {
  try {
    const { orderid } = req.query;
    if (!orderid) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: 'Order id is required',
        error: 'Bad Request'
      })
    }
    const order = await orders.findById(orderid)
    if (!order) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: 'Order not found',
        error: 'Not Found'
      })
    }
    const orderdetails = {
      orderPlaced: order.orderedAt,
      inProgress: order.packingInProgressAt,
      onTheWay: order.outForDeliveryAt,
      delivered: order.deliveredAt,
      orderamount: order.orderamount

    }
    const products = order.products.map((item) => ({
      name: item.productname,
      productquantity: item.productquantity,
      productprice: item.productprice,
      image: item.productimages,
      cartquantity: item.cartquantity
    }))
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: 'Order details fetched successfully',
      data: { orderdetails, products }
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

//////////////**********************   Payment Gateways      *************************************/

// exports.verifyPayment = async (req, res) => {
//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       orderData 
//     } = req.body;

//     console.log(razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       orderData);  


//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderData) {
//       return res.status(400).json({
//         success: false,
//         statuscode: 400,
//         message: "Missing required payment or order details",
//         error: "Bad Request"
//       });
//     }

//     // Verify Razorpay signature
//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_SECRET)
//       .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//       .digest("hex");

//     if (expectedSignature !== razorpay_signature) {
//       return res.status(400).json({
//         success: false,
//         statuscode: 400,
//         message: "Payment signature verification failed",
//         error: "Invalid Signature"
//       });
//     }

//     // Prevent duplicate orders
//     const existingOrder = await orders.findOne({
//       "paymentInfo.razorpay_payment_id": razorpay_payment_id
//     });

//     if (existingOrder) {
//       return res.status(400).json({
//         success: false,
//         statuscode: 400,
//         message: "Order with this payment already exists",
//         error: "Duplicate Order"
//       });
//     }

//     // Extract orderData from frontend
//     const {
//       ids,
//       cartquantity,
//       addressid,
//       payment_mode,
//       couponCode,
//       discountamount,
//       shippingcost,
//       productquantity,
//       orderamount
//     } = orderData;


//     const invoiceNumber = `PATINV-${Date.now().toString().slice(-6)}`;

//     const user = await users.findById(req.user._id);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         statuscode: 404,
//         message: "User not found",
//         error: "Not Found"
//       });
//     }
//     const address_response = await useraddress.findById(addressid);
//     if (!address_response) {
//       return res.status(404).json({
//         success: false,
//         statuscode: 404,
//         message: "Address not found",
//         error: "Not Found"
//       });
//     }
//     // Prepare products for order
//     let productsInOrder = [];
//     let successfullCartIds = [];

//     const idArray = ids.includes(",") ? ids.split(",").map(i => i.trim()) : [ids.trim()];

//     for (let singleId of idArray) {
//       if (!mongoose.Types.ObjectId.isValid(singleId)) continue;

//       if (idArray.length === 1) {
//         // Buy Now
//         let productDoc;
//           productDoc = await products.findById(singleId);

//               if (!productDoc) {
//           return res.status(404).json({
//             success: false,
//             statuscode: 404,
//             message: "Product not found",
//             error: "Not Found"
//           });
//         }

//         if (productDoc.stock < cartquantity) {
//           return res.status(400).json({
//             success: false,
//             statuscode: 400,
//             message: "Stock not available",
//             error: "Bad Request"
//           });
//         }

//         // Resolve price using PricingMatrix based on size
//         let priceDoc = null;
//           priceDoc = await PricingMatrix.findOne({ productId: productDoc._id, quantity: productquantity || "" });
//           console.log(priceDoc)
//         if (!priceDoc) {
//           return res.status(400).json({
//             success: false,
//             statuscode: 400,
//             message: "Product price not found for selected quantity",
//             error: "Bad Request"
//           });
//         }

//         // Reduce stock and persist
//         productDoc.stock -= cartquantity;
//         await productDoc.save();

//         productsInOrder.push({
//           productId: productDoc._id,
//           productquantity: productquantity || "",
//           cartquantity: cartquantity || 1, 
//           productprice: priceDoc.price || 0,
//           shippingcost: productDoc.shippingcost || 0,
//           taxpercentage: productDoc.taxpercentage || 0,
//           productimages: Array.isArray(productDoc.imagesUrl) ? productDoc.imagesUrl[0] : productDoc.imagesUrl, 
//           productname: productDoc.productname || ""
//         });
//       } else {
//         // Cart flow
//         const cartItem = await carts.findById(singleId);
//         if (!cartItem) continue;

//         let productDoc;
//           productDoc = await products.findById(cartItem.productId);

//         if (!productDoc) continue;

//         if (productDoc.stock < cartItem.cartquantity) {
//           return res.status(400).json({
//             success: false,
//             statuscode: 400,
//             message: "Stock not available",
//             error: "Bad Request"
//           });
//         }

//         // Resolve price from PricingMatrix for cart item
//         let cartPriceDoc = null;
//           cartPriceDoc = await PricingMatrix.findOne({ productId: cartItem.productId, quantity: cartItem.productquantity || "" });
//         if (!cartPriceDoc) {
//           return res.status(400).json({
//             success: false,
//             statuscode: 400,
//             message: "Product price not found for selected size in cart",
//             error: "Bad Request"
//           });
//         }

//         productDoc.stock -= cartItem.cartquantity;
//         await productDoc.save();

//         productsInOrder.push({
//           productId: cartItem.productId,
//           productquantity: cartItem.productquantity || "",
//           cartquantity: cartItem.quantity || 1, 
//           productprice: cartPriceDoc?.price || 0,
//           shippingcost: productDoc.shippingcost || 0,
//           taxpercentage: productDoc.taxpercentage || 0,
//           productimages: Array.isArray(productDoc.imagesUrl) ? productDoc.imagesUrl[0] : (productDoc.imagesUrl || ""), 
//           productname: productDoc.productname || ""
//         });

//         successfullCartIds.push(singleId);
//       }
//     }

//     if (productsInOrder.length === 0) {
//       return res.status(400).json({
//         success: false,
//         statuscode: 400,
//         message: "No valid products found for order"
//       });
//     }

//     // Create final order
//     const newOrder = new orders({
//       userId: req.user._id,
//       products: productsInOrder,
//       shipping_address:{
//         placeType: address_response.placeType,
//         contactinfo: {
//           fullname: address_response.contactinfo.fullname,
//           mobilenumber: address_response.contactinfo.mobilenumber,
//           emailAddress: address_response.contactinfo.emailAddress
//         },
//         shippingAddress: {
//           streetAddress: address_response.shippingAddress.streetAddress,
//           city: address_response.shippingAddress.city,
//           state: address_response.shippingAddress.state,
//           housenoandfloor: address_response.shippingAddress.housenoandfloor,
//           nearbylandmark: address_response.shippingAddress.nearbylandmark
//         }
//       },
//       orderamount,
//       status: "confirmed",
//       couponCode,
//       discountamount
//     });

//     // Save the order first to generate the orderId
//     const savedOrder = await newOrder.save();

//     // Create payment record with the saved order's IDs
//     await payments.create({
//       userId: req.user._id,
//       orderid: savedOrder._id,
//       OrderId: savedOrder.orderId, 
//       orderamount,
//       payment_mode: payment_mode,
//       payment_status: "paid",
//       paymentInfo: {
//         razorpay_order_id,
//         razorpay_payment_id,
//         razorpay_signature
//       },
//       invoice: invoiceNumber,
//       shippingcost: shippingcost,
//     });

//     if (successfullCartIds.length > 0) {
//       await carts.deleteMany({ _id: { $in: successfullCartIds } });
//     }

//     return res.status(200).json({
//       success: true,
//       statuscode: 200,
//       message: "Order placed successfully",
//       order: newOrder[0]
//     });

//   } catch (error) {
//     console.error("Error in verifyPayment:", error);
//     return res.status(500).json({
//       success: false,
//       statuscode: 500,
//       message: "Failed to process order",
//       error: error.message
//     });
//   }
// };  


exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData
    } = req.body;

    // console.log(
    //   razorpay_order_id,
    //   razorpay_payment_id,
    //   razorpay_signature,
    //   orderData
    // );

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderData) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: "Missing required payment or order details",
        error: "Bad Request"
      });
    }

    // Verify Razorpay signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: "Payment signature verification failed",
        error: "Invalid Signature"
      });
    }

    // Prevent duplicate orders
    const existingOrder = await orders.findOne({
      "paymentInfo.razorpay_payment_id": razorpay_payment_id
    });

    if (existingOrder) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: "Order with this payment already exists",
        error: "Duplicate Order"
      });
    }

    // Extract order data
    const {
      accoid,
      roomid,
      check_in_date,
      check_out_date,
      noofguests,
      guestdetails,
      paymentmode,
      couponCode,
      discountamount,
      price_type,
      bookingamount
    } = orderData;

    const invoiceNumber = `INDHOSTELS-${Date.now().toString().slice(-6)}`;

    // Verify user and address
    const user = await users.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: "User not found",
        error: "Not Found"
      });
    }

    if (!guestdetails || typeof guestdetails !== "object") {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        messsage: "Invalid guest details"
      })
    }

    const { fullname, mobilenumber, emailAddress, agreed, noofadults, noofchildrens, gender } = guestdetails
    if (!fullname || !mobilenumber || !emailAddress || !agreed || (noofadults === undefined || noofadults === null) || (noofchildrens === undefined || noofchildrens === null) || !gender) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: "Invalid guest details",
      })
    }

    const accomidation = await products.findById(accoid)
    if (!accomidation) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: "accomidation not found or something went wrong"
      })
    }

    const room = await rooms.findById(roomid)
    if (!room) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: "Room not found"
      })
    }
    //check price of the room
    const roomprice = await PricingMatrix.findOne({ room_id: roomid, 'pricing.price_type': price_type })
    const perdayprice = roomprice.pricing.find((pricing) => pricing.price_type === price_type)
    if (!roomprice) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: "Room price not found",
      })
    }

    //calculate no.of days 
    const checkInDate = new Date(check_in_date);
    const checkOutDate = new Date(check_out_date);
    const diffTime = Math.abs(checkOutDate - checkInDate);
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      diffDays = `${diffDays} days`;
    } else if (diffDays > 7 && diffDays <= 30) {
      diffDays = `${Math.ceil(diffDays / 7)} weeks`;
    } else if (diffDays > 30) {
      const checkIn = new Date(check_in_date);
      const checkOut = new Date(check_out_date);

      const startYear = checkIn.getFullYear();
      const startMonth = checkIn.getMonth();

      const endYear = checkOut.getFullYear();
      const endMonth = checkOut.getMonth();

      // Calculate pure month difference
      let monthDiff = (endYear - startYear) * 12 + (endMonth - startMonth);

      // Always treat next-month stay as at least 1 month
      if (monthDiff <= 0) monthDiff = 1;

      diffDays = `${monthDiff} months`;
    }
    // Create final order
    const create_booking = new orders({
      userId: req.user._id,
      accommodationId: accomidation._id,
      room_id: room._id,
      price_type: price_type,
      room_id: room._id,
      price_type: price_type,
      room_price: perdayprice.price,
      check_in_date: check_in_date,
      check_out_date: check_out_date,
      guests: noofguests,
      roomtype: room.room_type,
      guestdetails: {
        fullname: fullname,
        mobilenumber: mobilenumber,
        emailAddress: emailAddress,
        stayinfo: {
          check_in: check_in_date,
          check_out: check_out_date,
          roomtype: room.room_type,
        },
        agreed: agreed,
        noofadults: noofadults,
        noofchildrens: noofchildrens,
        gender: gender
      },
      bookingamount: bookingamount,
      couponCode: couponCode,
      discountamount: discountamount,
      vendorId: accomidation.vendor_id || null,
      days: diffDays,
      status: "confirmed"
    });
    const savedOrder = await create_booking.save();
    const create_payment = await payments.create({
      userId: req.user._id,
      bookingid: savedOrder._id,
      BookingId: savedOrder.bookingId,
      bookingamount: bookingamount,
      payment_mode: paymentmode,
      payment_status: "paid",
      paymentInfo: {
        razorpay_order_id: razorpay_order_id,
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature
      },
      invoice: invoiceNumber,
      tax: accomidation.tax_amount
    })

    let savedBooking = await savedOrder.save();

    savedBooking.paymentid = create_payment._id
    await savedBooking.save()

    //update room bookings
    room.bookings.push({
      check_in_date: create_booking.check_in_date,
      check_out_date: create_booking.check_out_date,
      beds_booked: noofguests
    })

    await room.save();
    //update accomidation 
    if (room.no_of_guests === noofguests) {
      room.rooms_available -= 1;
      room.beds_available -= noofguests;
      await room.save();
    } else if (room.no_of_guests >= 1) {
      room.beds_available -= noofguests;
      await room.save();
    }


    if (savedBooking.couponCode) {
      const coupon_res = await coupons.findOne({ couponCode: savedBooking.couponCode });
      if (coupon_res) {
        if (!coupon_res.usedBy) {
          coupon_res.usedBy = []; // Initialize usedBy array if it doesn't exist
        }
        if (!coupon_res.usedBy.includes(req.user._id.toString())) {
          coupon_res.usedBy.push(req.user._id);
          await coupon_res.save();
        }
      }
    }

    // send email to user of conformation booking 
    const Order = savedBooking
    auth.sendconformationmail(Order)

    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: "Booking done successfully",
      order: savedBooking
    });

  } catch (error) {
    //console.error("Error in verifyPayment:", error);
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Failed to process order",
      error: error.message
    });
  }
};

exports.getallids = async (req,res) => {
  try{
    const userids = await users.find({}).select('_id')
    const accomidationsids = await products.find({}).select('_id')
    const ordersids = await bookings.find({}).select('_id bookingId') 
    const reviewsids = await reviews.find({}).select('_id')
    const roomids = await rooms.find({}).select('_id')

    
    return res.status(200).json({
       success: true,
       statuscode: 200,
       data: [
         userids,
         accomidationsids,
         ordersids,
         reviewsids,
         roomids
       ]
    })

  }catch(error){
     return res.status(500).json({
       success: false,
       stautscode: 500,
       message:'internal Server Error',
       error: error.message
     })
  }
};



























