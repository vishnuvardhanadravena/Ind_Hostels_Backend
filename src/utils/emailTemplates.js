const sitename = process.env.SITE_NAME;
console.log(sitename);


exports.conformSignup = (username, securityKey) => {
  return `<!DOCTYPE html>
  <html>
  <head>
      <title>Welcome to ${sitename}</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
          }
          .email-container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              text-align: center;
          }
          .header {
              font-size: 24px;
              font-weight: bold;
              color: #333;
              margin-bottom: 20px;
          }
          .content {
              font-size: 16px;
              color: #555;
              line-height: 1.6;
              margin-bottom: 20px;
          }
          .verify-button {
              display: inline-block;
              background-color: rgb(24,0,172);
              color: #ffffff;
              text-decoration: none;
              padding: 12px 24px;
              font-size: 16px;
              border-radius: 5px;
              font-weight: bold;
          }
          .footer {
              font-size: 14px;
              color: #777;
              margin-top: 20px;
          }
          .footer a {
              color: rgb(24,0,172);
              text-decoration: none;
          }
      </style>
  </head>
  <body>
      <div class="email-container">
          <div class="header">${sitename}</div>
          <div class="content">
              <p>Dear ${username},</p>
              <p>Welcome to <strong>${sitename}</strong>! We're excited to have you on board.</p>
              <p>To complete your registration and verify your email address, please click the button below:</p>
              <a href="https://indhostel.com/verify?verificationKey=${securityKey}" class="verify-button">Verify</a>
              <p>If you didn’t sign up for <strong>${sitename}</strong>, please disregard this email or contact our support team immediately.</p>
          </div>
          <div class="footer">
              <p>Need help? Contact us at <a href="mailto:support@${sitename}.com">support@${sitename}.com</a>.</p>
              <p> 2025 ${sitename}. All rights reserved.</p>
          </div>
      </div>
  </body>
  </html>
  `
};


exports.ForgetPassword = (fullname, email, role) => {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Welcome to ${sitename}</title>
  <style>
      body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
      }
      .email-container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          text-align: center;
      }
      .header {
          font-size: 24px;
          font-weight: bold;
          color: #333;
          margin-bottom: 20px;
      }
      .content {
          font-size: 16px;
          color: #555;
          line-height: 1.6;
          margin-bottom: 20px;
      }
      .verify-button {
          display: inline-block;
          background-color: rgb(24,0,172);
          color: #ffffff;
          text-decoration: none;
          padding: 12px 24px;
          font-size: 16px;
          border-radius: 5px;
          font-weight: bold;
      }
      .footer {
          font-size: 14px;
          color: #777;
          margin-top: 20px;
      }
      .footer a {
          color: rgb(24,0,172);
          text-decoration: none;
      }
  </style>
</head>
<body>
  <div class="email-container">
      <div class="header">${sitename}</div>
      <div class="content">
          <p>Dear ${fullname},</p>
          <p>Welcome to <strong>${sitename}</strong>! We're excited to have you on board.</p>
          <p>If You Forget Your Password And need to reset it, please click the button below:</p>
          <a href="https://indhostel.com/set_new_password?email=${email}&Role=${role}" class="verify-button">Reset Password</a>
          <p>If you didn’t sign up for <strong>${sitename}</strong>, please disregard this email or contact our support team immediately.</p>
      </div>
      <div class="footer">
          <p>Need help? Contact us at <a href="mailto:support@${sitename}.com">support@${sitename}.com</a>.</p>
          <p> 2025 ${sitename}. All rights reserved.</p>
      </div>
  </div>
</body>
</html>
`
};



exports.AadminForgetPassword = (fullname, email, role) => {
  return `<!DOCTYPE html>
        <html>
        <head>
          <title>Welcome to ${sitename}</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #f4f4f4;
                  margin: 0;
                  padding: 0;
              }
              .email-container {
                  max-width: 600px;
                  margin: 20px auto;
                  background-color: #ffffff;
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                  text-align: center;
              }
              .header {
                  font-size: 24px;
                  font-weight: bold;
                  color: rgb(24,0,172);
                  margin-bottom: 20px;
              }
              .content {
                  font-size: 16px;
                  color: #333;
                  line-height: 1.6;
                  margin-bottom: 20px;
              }
              .verify-button {
                  display: inline-block;
                  background-color: rgb(24,0,172);
                  color: #ffffff;
                  text-decoration: none;
                  padding: 12px 24px;
                  font-size: 16px;
                  border-radius: 5px;
                  font-weight: bold;
              }
              .verify-button:hover {
                  background-color: #b88434; /* darker shade on hover */
              }
              .footer {
                  font-size: 14px;
                  color: #777;
                  margin-top: 20px;
              }
              .footer a {
                  color: rgb(24,0,172);
                  text-decoration: none;
              }
          </style>
        </head>
        <body>
          <div class="email-container">
              <div class="header">${sitename}</div>
              <div class="content">
                  <p>Dear ${fullname},</p>
                  <p>Welcome to <strong>${sitename}</strong>! We're excited to have you on board.</p>
                  <p>If you forget your password and need to reset it, please click the button below:</p>
                  <a href="https://indhostel.com/reset-password?email=${email}&Role=${role}" class="verify-button">Reset Password</a>
                  <p>If you didn’t sign up for <strong>${sitename}</strong>, please disregard this email or contact our support team immediately.</p>
              </div>
              <div class="footer">
                  <p>Need help? Contact us at <a href="mailto:support@${sitename}.com">support@${sitename}.com</a>.</p>
                  <p> 2025 ${sitename}. All rights reserved.</p>
              </div>
          </div>
        </body>
        </html>`;
};

exports.vendorAccountCreatedTemplate = (vendorName, phone, password) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Vendor Account Created</title>

  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f4f7;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .email-container {
      max-width: 600px;
      background: #ffffff;
      margin: 30px auto;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .header {
      background: rgb(24,0,172);
      color: #fff;
      text-align: center;
      padding: 22px;
      font-size: 24px;
      font-weight: 600;
    }

    .content {
      padding: 30px;
      color: #333;
      font-size: 16px;
      line-height: 1.6;
    }

    .label {
      font-weight: 600;
      margin-top: 15px;
      display: block;
      font-size: 16px;
    }

    .credentials-box {
      background: #f7f9fc;
      border-left: 4px solid rgb(24,0,172);
      padding: 15px 18px;
      margin-top: 12px;
      border-radius: 6px;
      font-size: 15px;
    }

    .button {
      display: inline-block;
      background: rgb(24,0,172);
      color: #ffffff !important;
      padding: 14px 28px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 17px;
      font-weight: 500;
      margin-top: 25px;
    }

    .footer {
      background: #f0f0f0;
      padding: 15px;
      text-align: center;
      font-size: 13px;
      color: #777;
    }
  </style>
</head>

<body>
  <div class="email-container">
    
    <div class="header">
      Welcome to Our Vendor Platform 🎉
    </div>
    
    <div class="content">
      <p>Hi ${vendorName || "Vendor"},</p>

      <p>Your vendor profile has been successfully created on our platform.  
      Below are your login credentials:</p>

      <div class="credentials-box">
        <div><strong>Phone:</strong> ${phone}</div>
        <div><strong>Password:</strong> ${password}</div>
      </div>
      
      <p style="margin-top: 18px;">Click below to access your vendor dashboard:</p>

      <a href="https://vendors.indhostel.com/" class="button">Login to Vendor Panel</a>

      <p style="margin-top: 20px;">
        Once logged in, you can update your products, manage orders, edit your profile, and more.
      </p>
    </div>
    
    <div class="footer">
      © ${new Date().getFullYear()} IndHostels Vendor Portal. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

exports.VendorForgetPassword = (fullname, email, role) => {
  return `<!DOCTYPE html>
        <html>
        <head>
          <title>Welcome to ${sitename}</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #f4f4f4;
                  margin: 0;
                  padding: 0;
              }
              .email-container {
                  max-width: 600px;
                  margin: 20px auto;
                  background-color: #ffffff;
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                  text-align: center;
              }
              .header {
                  font-size: 24px;
                  font-weight: bold;
                  color: rgb(140, 19, 201);
                  margin-bottom: 20px;
              }
              .content {
                  font-size: 16px;
                  color: #333;
                  line-height: 1.6;
                  margin-bottom: 20px;
              }
              .verify-button {
                  display: inline-block;
                  background-color: rgb(140, 19, 201);
                  color: #ffffff;
                  text-decoration: none;
                  padding: 12px 24px;
                  font-size: 16px;
                  border-radius: 5px;
                  font-weight: bold;
              }
              .verify-button:hover {
                  background-color: #b88434; /* darker shade on hover */
              }
              .footer {
                  font-size: 14px;
                  color: #777;
                  margin-top: 20px;
              }
              .footer a {
                  color: rgb(140, 19, 201);
                  text-decoration: none;
              }
          </style>
        </head>
        <body>
          <div class="email-container">
              <div class="header">${sitename}</div>
              <div class="content">
                  <p>Dear ${fullname},</p>
                  <p>Welcome to <strong>${sitename}</strong>! We're excited to have you on board.</p>
                  <p>If you forget your password and need to reset it, please click the button below:</p>
                  <a href="https://vendors.indhostel.com/reset-password?email=${email}&Role=${role}" class="verify-button">Reset Password</a>
                  <p>If you didn’t sign up for <strong>${sitename}</strong>, please disregard this email or contact our support team immediately.</p>
              </div>
              <div class="footer">
                  <p>Need help? Contact us at <a href="mailto:support@${sitename}.com">support@${sitename}.com</a>.</p>
                  <p>© 2025 ${sitename}. All rights reserved.</p>
              </div>
          </div>
        </body>
        </html>`;
};


// exports.invoiceTemplate = (order, paymenthistory) => {

//     // Build amenities list
//     const amenitiesHtml = order.accommodationId.amenities
//         ?.map(a => `<span class="amenity-tag">${a}</span>`)
//         .join("") || "";

//     // Discount block
//     const discountHtml = order.discountamount
//         ? `
//             <div class="price-row" style="color: #10b981;">
//                 <span class="label">Discount (${order.couponCode})</span>
//                 <span class="amount">-₹${order.discountamount}</span>
//             </div>
//         `
//         : `<div class="price-row" style="color: #10b981;">
//                 <span class="label">Discount NA</span>
//                 <span class="amount">-₹0</span>
//             </div>`;

//     // Payment status class
//     const paymentStatusClass =
//         order.paymentid.payment_status === "paid"
//             ? "status-confirmed"
//             : order.paymentid.payment_status === "pending"
//             ? "status-pending"
//             : "status-cancelled";

//     // Payment extra fields
//     const paymentExtra =
//         paymenthistory.method === "upi"
//             ? `<p><strong>UPI ID:</strong> ${paymenthistory.vpa}</p>`
//             : paymenthistory.method === "razorpay"
//             ? `
//                 <p><strong>Transaction ID:</strong> ${paymenthistory.id}</p>
//                 <p><strong>Order ID:</strong> ${paymenthistory.order_id}</p>
//               `
//             : "";

//     return `
//       <!DOCTYPE html>
//       <html lang="en">
//       <head>
//           <meta charset="UTF-8">
//           <meta name="viewport" content="width=device-width, initial-scale=1.0">
//           <title>Booking Invoice - ${order.paymentid.invoice}</title>

//           <style>
//               * { margin: 0; padding: 0; box-sizing: border-box; }
//               body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; padding: 20px; }
//               .invoice-container {
//                   max-width: 900px; margin: 0 auto; background: #fff;
//                   border-radius: 8px; overflow: hidden;
//                   box-shadow: 0px 2px 10px rgba(0,0,0,0.1);
//               }
//               .invoice-header {
//                   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//                   color: #fff; padding: 40px; text-align: center;
//               }
//               .invoice-info {
//                   display: grid; grid-template-columns: 1fr 1fr;
//                   padding: 30px 40px; background: #f9fafb;
//                   border-bottom: 2px solid #e5e7eb; gap: 30px;
//               }
//               .info-section h3 {
//                   color: #667eea; font-size: 14px; text-transform: uppercase;
//                   margin-bottom: 15px; letter-spacing: 1px; font-weight: 600;
//               }
//               .info-section p { margin-bottom: 8px; color: #4b5563; font-size: 14px; }
//               .info-section strong { color: #1f2937; }
//               .invoice-details { padding: 40px; }
//               .section-title {
//                   font-size: 18px; font-weight: 600; color: #1f2937;
//                   border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-bottom: 30px;
//               }
//               .accommodation-info {
//                   background: #f0f4ff; padding: 25px;
//                   border-radius: 8px; margin-bottom: 30px;
//               }
//               .amenities { margin-top: 15px; display: flex; flex-wrap: wrap; gap: 8px; }
//               .amenity-tag {
//                   padding: 6px 12px; border-radius: 20px;
//                   font-size: 12px; color: #667eea; border: 1px solid #667eea; background: #fff;
//               }
//               .booking-details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
//               .detail-card {
//                   background: #f9fafb; padding: 20px;
//                   border-radius: 8px; border-left: 4px solid #667eea;
//               }
//               .detail-card h4 { color: #667eea; margin-bottom: 10px; font-size: 12px; text-transform: uppercase; }
//               .detail-card p { margin-bottom: 5px; font-size: 15px; color: #1f2937; }
//               .highlight { font-size: 18px; font-weight: 600; color: #667eea; }
//               .price-breakdown { background: #f9fafb; padding: 25px; border-radius: 8px; margin-bottom: 30px; }
//               .price-row {
//                   display: flex; justify-content: space-between; padding: 12px 0;
//                   border-bottom: 1px solid #e5e7eb; font-size: 15px;
//               }
//               .price-row.total { border-bottom: none; border-top: 2px solid #667eea; margin-top: 10px; padding-top: 15px; font-weight: 700; font-size: 20px; color: #667eea; }
//               .payment-info {
//                   background: #ecfdf5; padding: 20px; border-radius: 8px;
//                   border-left: 4px solid #10b981; margin-bottom: 30px;
//               }
//               .payment-info .status-badge {
//                   padding: 4px 12px; border-radius: 20px; background: #10b981;
//                   color: #fff; font-size: 12px; font-weight: 600; text-transform: uppercase;
//               }
//               .status-confirmed { background: #10b981 !important; }
//               .status-pending { background: #f59e0b !important; }
//               .status-cancelled { background: #ef4444 !important; }
//               .footer {
//                   background: #f9fafb; padding: 30px 40px; text-align: center; border-top: 2px solid #e5e7eb;
//               }
//               .footer p { color: #6b7280; font-size: 13px; margin-bottom: 10px; }
//           </style>
//       </head>

//       <body>
//       <div class="invoice-container">

//     <!-- Header -->
//     <div class="invoice-header">
//         <h1>🏨 IND HOSTELS</h1>
//         <p>Your Comfort, Our Priority</p>
//     </div>

//     <!-- Invoice Details -->
//     <div class="invoice-info">
//         <div class="info-section">
//             <h3>Invoice Details</h3>
//             <p><strong>Invoice Number:</strong> ${order.paymentid.invoice}</p>
//             <p><strong>Booking ID:</strong> ${order.bookingId}</p>
//             <p><strong>Invoice Date:</strong> ${order.createdAt}</p>
//             <p><strong>Status:</strong> ${order.status}</p>
//         </div>

//         <div class="info-section">
//             <h3>Billed To</h3>
//             <p><strong>${order.guestdetails.fullname}</strong></p>
//             <p>Email: ${order.guestdetails.emailAddress}</p>
//             <p>Phone: ${order.guestdetails.mobileNumber}</p>
//         </div>
//     </div>

//     <div class="invoice-details">

//         <!-- Accommodation -->
//         <h2 class="section-title">Accommodation Details</h2>
//         <div class="accommodation-info">
//             <h3>${order.accommodationId.property_name}</h3>
//             <p><strong>Type:</strong> ${order.accommodationId.property_type}</p>
//             <p><strong>Category:</strong> ${order.accommodationId.category_name}</p>
//             <p><strong>Location:</strong> ${order.accommodationId.location.address}, ${order.accommodationId.location.area}, ${order.accommodationId.location.city}</p>
//             <p><strong>Host:</strong> ${order.accommodationId.host_details.host_name} (${order.accommodationId.host_details.host_contact})</p>
//             <p><strong>Description:</strong> ${order.accommodationId.property_description}</p>

//             <div class="amenities">${amenitiesHtml}</div>
//         </div>

//         <!-- Booking Info -->
//         <h2 class="section-title">Booking Information</h2>
//         <div class="booking-details">
//             <div class="detail-card">
//                 <h4>Check-In</h4>
//                 <p class="highlight">${order.check_in_date}</p>
//                 <p>${order.accommodationId.check_in_time}</p>
//             </div>

//             <div class="detail-card">
//                 <h4>Check-Out</h4>
//                 <p class="highlight">${order.check_out_date}</p>
//                 <p>${order.accommodationId.check_out_time}</p>
//             </div>

//             <div class="detail-card">
//                 <h4>Room Details</h4>
//                 <p><strong>Type:</strong> ${order.room_id.room_type}</p>
//                 <p><strong>Amenities:</strong> ${order.room_id.room_amenities}</p>
//             </div>
//         </div>

//         <!-- Price -->
//         <h2 class="section-title">Price Breakdown</h2>
//         <div class="price-breakdown">
//             <div class="price-row">
//                 <span class="label">Room Price (${order.price_type})</span>
//                 <span class="amount">₹${order.room_price}</span>
//             </div>
//             <div class="price-row">
//                 <span class="label">Tax</span>
//                 <span class="amount">₹${order.paymentid.tax}</span>
//             </div>
//             ${discountHtml}
//             <div class="price-row total">
//                 <span>Total Amount</span>
//                 <span>₹${order.bookingamount}</span>
//             </div>
//         </div>

//         <!-- Payment -->
//         <h2 class="section-title">Payment Details</h2>
//         <div class="payment-info">
//             <h3>
//                 Payment Status: 
//                 <span class="status-badge ${paymentStatusClass}">
//                     ${order.paymentid.payment_status}
//                 </span>
//             </h3>

//             <p><strong>Payment Method:</strong> ${paymenthistory.method}</p>
//             ${paymentExtra}

//             <p><strong>Amount Paid:</strong> ₹${order.bookingamount}</p>
//             <p><strong>Payment Date:</strong> ${order.createdAt}</p>
//         </div>

//         <!-- Terms -->
//         <h2 class="section-title">Terms & Conditions</h2>
//         <div style="background:#f9fafb; padding:20px; border-radius:8px;">
//             <p>• <strong>Cancellation Policy:</strong> ${order.accommodationId.cancellation_policy}</p>
//             <p>• Check-in time: ${order.accommodationId.check_in_time}</p>
//             <p>• Check-out time: ${order.accommodationId.check_out_time}</p>
//             <p>• Please carry a valid ID proof at check-in</p>
//             <p>• Hotel reserves the right to refuse service</p>
//             <p>• This is a digitally generated invoice</p>
//         </div>

//     </div>

//     <!-- Footer -->
//     <div class="footer">
//         <p><strong>Thank you for choosing IND HOSTELS!</strong></p>
//         <p>For any queries or support, contact us:</p>
//         <p>Email: support@indhostels.com | Phone: +91-1800-123-4567</p>
//         <p>Website: www.indhostels.com</p>
//     </div>

// </div>
// </body>
// </html>
// `;
// };


exports.invoiceTemplate = (order, paymenthistory) => {
  const amenitiesHtml = (order.accommodationId.amenities || [])
    .map(a => `<span class="amenity-tag">${a}</span>`)
    .join("");

  const discountHtml = order.discountamount
    ? `
      <div class="price-row">
        <div class="label">Discount ${order.couponCode ? `(${order.couponCode})` : ""}</div>
        <div class="amount">-₹${order.discountamount}</div>
      </div>`
    : `
      <div class="price-row">
        <div class="label">Discount NA</div>
        <div class="amount">-₹0</div>
      </div>`;

  const paymentStatusClass =
    order.paymentid?.payment_status === "paid"
      ? "status-confirmed"
      : order.paymentid?.payment_status === "pending"
        ? "status-pending"
        : "status-cancelled";

  const paymentExtra =
    paymenthistory?.method === "upi"
      ? `<div class="small-row"><strong>UPI ID:</strong> ${paymenthistory.vpa}</div>`
      : paymenthistory?.method === "razorpay"
        ? `<div class="small-row"><strong>Transaction ID:</strong> ${paymenthistory.id}</div>
         <div class="small-row"><strong>Order ID:</strong> ${paymenthistory.order_id}</div>`
        : "";

  // Normalize safe strings (avoid undefined)
  const safe = v => (v === undefined || v === null ? "" : v);

  return `
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Invoice - ${safe(order.paymentid?.invoice)}</title>

<style>
  /* Reset */
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:#f3f6fb;font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;color:#222}
  .page { width: 100%; max-width:900px; margin:20px auto; }
  .sheet { background:#fff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.06); overflow:hidden; }

  /* Header */
  .header {
    background: rgb(24,0,172);
    color:#fff; padding:34px 28px; text-align:center;
  }
  .header h1{font-size:22px;margin:0 0 6px;font-weight:700}
  .header p{margin:0;opacity:0.95;font-size:13px}

  /* Info row (two columns) - flex fallback */
  .info-row{display:flex;flex-wrap:wrap;padding:26px 28px;background:#f9fafb;border-bottom:1px solid #e6e9f0}
  .info{flex:1 1 300px;padding-right:20px}
  .info h3{color:rgb(24,0,172);font-size:13px;margin:0 0 10px;text-transform:uppercase;letter-spacing:1px}
  .info .line{font-size:13px;color:#424a57;margin:6px 0}
  .info .muted{color:#6b7280;font-size:12px}

  /* Content area */
  .content{padding:28px}

  /* Accommodation card (rounded) */
  .card {
    background:#fbfdff;padding:18px;border-radius:8px;margin-bottom:18px;border:1px solid #eef3ff;
  }
  .card h3{margin:0 0 8px;color:#1f2937;font-size:18px}
  .card p{margin:4px 0;color:#475569;font-size:13px}

  /* amenities row */
  .amenities{margin-top:12px;display:flex;flex-wrap:wrap;gap:8px}
  .amenity-tag{padding:6px 10px;border-radius:16px;border:1px solid #c7d2fe;background:#fff;color:rgb(24,0,172);font-size:12px}

  /* booking details - three columns, using flex */
  .booking-details{display:flex;flex-wrap:wrap;gap:12px;margin:18px 0 26px}
  .detail { flex:1 1 200px; background:#fff;border-radius:6px;padding:14px;border-left:6px solid rgb(24,0,172); box-shadow: 0 1px 0 rgba(0,0,0,0.02)}
  .detail h4{margin:0 0 8px;font-size:12px;color:#475569;text-transform:uppercase}
  .detail .big{font-weight:700;color:#2b3a67;font-size:16px}

  /* price breakdown */
  .section-title{font-size:15px;color:#283046;border-bottom:2px solid rgb(24,0,172);padding-bottom:10px;margin:20px 0}
  .price-break{background:#fff;border-radius:8px;padding:16px;border:1px solid #eef4ff}
  .price-row{display:flex;justify-content:space-between;padding:10px 6px;border-bottom:1px solid #f1f5fb}
  .price-row .label{color:#525f7a}
  .price-row .amount{color:#1f2937;font-weight:600}
  .price-row:last-child{border-bottom:none}
  .price-row.total{border-top:2px solid rgb(24,0,172);padding-top:14px;margin-top:8px;font-size:17px;color:rgb(24,0,172);font-weight:800}

  /* payment details block */
  .payment-block{display:flex;gap:14px;align-items:flex-start}
  .payment-left{width:6px;border-radius:6px 0 0 6px;background:#10b981}
  .payment-inner{flex:1;background:#f8fffb;border-radius:6px;padding:12px 14px;border:1px solid #e7f7ee}
  .payment-inner .small-row{font-size:13px;color:#065f46;margin:6px 0}
  .status-badge{display:inline-block;padding:4px 10px;border-radius:14px;font-size:11px;font-weight:700;color:#fff}
  .status-confirmed{background:#10b981}
  .status-pending{background:#f59e0b}
  .status-cancelled{background:#ef4444}

  /* terms */
  .terms{background:#fff;padding:14px;border-radius:8px;border:1px solid #eef4ff;margin-top:18px}
  .terms ul{margin:8px 0 0 18px}
  .terms li{margin:6px 0;color:#374151;font-size:13px}

  /* footer */
  .footer{padding:18px 14px;text-align:center;background:#f9fafb;border-top:1px solid #eef3ff;font-size:12px;color:#6b7280}

  /* print safe adjustments */
  @media print {
    .page{margin:0}
    body{background:#fff}
    .sheet{box-shadow:none;border-radius:0}
  }
</style>
</head>
<body>
  <div class="page">
    <div class="sheet">

      <!-- header -->
      <div class="header">
        <h1>IND HOSTELS</h1>
        <p>Your Comfort, Our Priority</p>
      </div>

      <!-- invoice + billed to -->
      <div class="info-row">
        <div class="info">
          <h3>Invoice Details</h3>
          <div class="line"><strong>Invoice:</strong> ${safe(order.paymentid?.invoice)}</div>
          <div class="line"><strong>Booking ID:</strong> ${safe(order.bookingId)}</div>
          <div class="line"><strong>Invoice Date:</strong> ${safe(order.createdAt)}</div>
          <div class="line"><strong>Status:</strong> ${safe(order.status)}</div>
        </div>

        <div class="info">
          <h3>Billed To</h3>
          <div class="line"><strong>${safe(order.guestdetails?.fullname)}</strong></div>
          <div class="line">${safe(order.guestdetails?.emailAddress)}</div>
          <div class="line">${safe(order.guestdetails?.mobileNumber)}</div>
        </div>
      </div>

      <!-- main content -->
      <div class="content">

        <!-- accommodation card -->
        <div class="card">
          <h3>${safe(order.accommodationId?.property_name)}</h3>
          <p><strong>Type:</strong> ${safe(order.accommodationId?.property_type)}</p>
          <p><strong>Category:</strong> ${safe(order.accommodationId?.category_name)}</p>
          <p><strong>Location:</strong> ${safe(order.accommodationId?.location?.address)}, ${safe(order.accommodationId?.location?.area)}, ${safe(order.accommodationId?.location?.city)}</p>
          <p><strong>Host:</strong> ${safe(order.accommodationId?.host_details?.host_name)} (${safe(order.accommodationId?.host_details?.host_contact)})</p>
          <p style="margin-top:8px">${safe(order.accommodationId?.property_description)}</p>
          <div class="amenities">${amenitiesHtml}</div>
        </div>

        <!-- booking details -->
        <div class="booking-details">
          <div class="detail">
            <h4>Check-In</h4>
            <div class="big">${safe(order.check_in_date)}</div>
            <div class="muted">${safe(order.accommodationId?.check_in_time)}</div>
          </div>

          <div class="detail">
            <h4>Check-Out</h4>
            <div class="big">${safe(order.check_out_date)}</div>
            <div class="muted">${safe(order.accommodationId?.check_out_time)}</div>
          </div>

          <div class="detail">
            <h4>Room Details</h4>
            <div class="big">${safe(order.room_id?.room_type)}</div>
            <div class="muted">${Array.isArray(order.room_id?.room_amenities) ? safe(order.room_id.room_amenities.join(", ")) : safe(order.room_id?.room_amenities)}</div>
          </div>
        </div>

        <!-- price -->
        <div>
          <div class="section-title">Price Breakdown</div>
          <div class="price-break">
            <div class="price-row">
              <div class="label">Room Price (${safe(order.price_type)})</div>
              <div class="amount">₹${safe(order.room_price)}</div>
            </div>

            <div class="price-row">
              <div class="label">Tax</div>
              <div class="amount">₹${safe(order.paymentid?.tax)}</div>
            </div>
            ${discountHtml}

            <div class="price-row total">
              <div>Total Amount</div>
              <div>₹${safe(order.bookingamount)}</div>
            </div>
          </div>
        </div>
        <!-- payment -->
        <div style="margin-top:18px">
          <div class="section-title">Payment Details</div>
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div style="width:8px;border-radius:6px;background:#10b981"></div>
            <div style="flex:1">
              <div style="background:#fbfff9;border-radius:6px;border:1px solid #e7f7ee;padding:12px">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
                  <div style="font-weight:700;color:#065f46">Payment Status:</div>
                  <div class="status-badge ${paymentStatusClass}">${safe(order.paymentid?.payment_status)}</div>
                </div>

                <div class="small-row"><strong>Payment Method:</strong> ${safe(paymenthistory?.method)}</div>
                ${paymentExtra}
                <div class="small-row"><strong>Amount Paid:</strong> ₹${safe(order.bookingamount)}</div>
                <div class="small-row"><strong>Payment Date:</strong> ${safe(order.createdAt)}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- terms -->
        <div style="margin-top:22px">
          <div class="section-title">Terms & Conditions</div>
          <div class="terms">
            <ul>
              <li><strong>Cancellation Policy:</strong> ${safe(order.accommodationId?.cancellation_policy)}</li>
              <li>Check-in time: ${safe(order.accommodationId?.check_in_time)}</li>
              <li>Check-out time: ${safe(order.accommodationId?.check_out_time)}</li>
              <li>Please carry a valid ID proof at check-in</li>
              <li>Hotel reserves the right to refuse service</li>
              <li>This is a digitally generated invoice</li>
            </ul>
          </div>
        </div>

      </div> <!-- content -->

      <div class="footer">
        <div style="font-weight:700;margin-bottom:6px">Thank you for choosing IND HOSTELS!</div>
        <div>For any queries or support, contact us:</div>
        <div>Email: support@indhostels.com | Phone: +91-1800-123-4567</div>
        <div>Website: www.indhostels.com</div>
      </div>

    </div> <!-- sheet -->
  </div> <!-- page -->
</body>
</html>
`;
};

exports.confirmbookingmail = (order) => {
  return `
       <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8" />
          <title>Booking Confirmation</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f6f6f6;
              margin: 0;
              padding: 0;
            }
            .container {
              background: #ffffff;
              max-width: 600px;
              margin: 30px auto;
              padding: 25px;
              border-radius: 10px;
              box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              padding-bottom: 10px;
              border-bottom: 1px solid #eee;
            }
            .header h1 {
              margin: 0;
              color: rgb(24,0,172);
              font-size: 24px;
            }
            .header h2 {
              color: #2c3e50;
              margin: 10px 0 0 0;
            }
            .content {
              margin-top: 20px;
              line-height: 1.6;
              color: #444;
            }
            .details-box {
              background: #f1f7ff;
              padding: 15px;
              border-radius: 8px;
              margin-top: 15px;
            }
            .details-title {
              font-size: 18px;
              font-weight: bold;
              color: rgb(24,0,172);
              margin-bottom: 10px;
            }
            .footer {
              margin-top: 25px;
              text-align: center;
              font-size: 13px;
              color: #666;
              border-top: 1px solid #eee;
              padding-top: 15px;
            }
            .button {
              display: inline-block;
              background: rgb(24,0,172);
              color: #fff;
              padding: 10px 20px;
              border-radius: 6px;
              text-decoration: none;
              margin-top: 15px;
            }
          </style>
        </head>
        <body>

        <div class="container">
          
          <!-- ✔ Booking ID added here -->
          <div class="header">
            <h1>Booking ID: ${order.bookingId}</h1>
            <h2>Booking Confirmed 🎉</h2>
            <p>Thank you for booking with <strong>IndHostels</strong></p>
          </div>

          <div class="content">
            <p>Hi <strong>${order.userId.fullname}</strong>,</p>
            <p>Your booking has been successfully confirmed. Below are your booking details:</p>

            <div class="details-box">
              <div class="details-title">🏨 Accommodation Details</div>
              <p><strong>Property Name:</strong> ${order.accommodationId.property_name}</p>
              <p><strong>Location:</strong> ${order.accommodationId.location.address}</p>
              <p><strong>Room Type:</strong> ${order.roomtype}</p>
              <p><strong>Guests:</strong> ${order.guests}</p>

              <div class="details-title">📅 Stay Duration</div>
              <p><strong>Check-in:</strong> ${order.check_in_date}</p>
              <p><strong>Check-out:</strong> ${order.check_out_date}</p>
              <p><strong>Total Days:</strong> ${order.days}</p>

              <div class="details-title">💳 Payment Summary</div>
              <p><strong>Price:</strong> ₹${order.room_price}</p>
              <p><strong>Tax:</strong> ₹${order.paymentid.tax}</p>
              <p><strong>Discount:</strong> -₹${order.discountamount}</p>
              <p><strong>Total Paid:</strong> ₹${order.bookingamount}</p>
            </div>
            <p>If you need any support, feel free to contact us anytime.</p>
          </div>
          <div class="footer">
            © 2025 IndHostels · All Rights Reserved<br>
            This is an automated email — please do not reply.
          </div>
        </div>
        </body>
        </html>
    `
}

exports.contactFormResponse = (email, subject, message, replyMessage) => {
  // Extract name from email if available, otherwise use mobile
  const getNameFromEmail = (email) => {
    if (!email) return '';
    const namePart = email.split('@')[0];
    return namePart.replace(/[^a-zA-Z]/g, ' ').replace(/\s+/g, ' ').trim();
  };
  
  const userName = getNameFromEmail(email);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Contact Form Response - ${sitename}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }
    .header h1 {
      margin: 0;
      color: rgb(24,0,172);
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      margin-top: 20px;
      line-height: 1.6;
      color: #333;
    }
    .message-box {
      background: #f8f9ff;
      border-left: 4px solid rgb(24,0,172);
      padding: 15px;
      margin: 15px 0;
      border-radius: 6px;
    }
    .subject {
      font-weight: bold;
      color: rgb(24,0,172);
      font-size: 16px;
      margin-bottom: 10px;
    }
    .reply-box {
      background: #f0f9ff;
      border-left: 4px solid #10b981;
      padding: 15px;
      margin: 15px 0;
      border-radius: 6px;
    }
    .reply-title {
      font-weight: bold;
      color: #10b981;
      font-size: 16px;
      margin-bottom: 10px;
    }
    .footer {
      margin-top: 25px;
      text-align: center;
      font-size: 13px;
      color: #666;
      border-top: 1px solid #eee;
      padding-top: 15px;
    }
    .button {
      display: inline-block;
      background: rgb(24,0,172);
      color: #ffffff !important;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      margin-top: 15px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Thank You for Contacting ${sitename}</h1>
    </div>
    
    <div class="content">
      <p>Dear <strong>${userName}</strong>,</p>
      
      <p>Thank you for reaching out to us. We have received your message and our team has prepared a response for you:</p>
      
      <div class="message-box">
        <div class="subject">Your Subject: ${subject}</div>
        <p><strong>Your Message:</strong></p>
        <p>${message}</p>
      </div>
      
      ${replyMessage ? `
      <div class="reply-box">
        <div class="reply-title">Our Reply:</div>
        <p>${replyMessage}</p>
      </div>
      ` : ''}
      
      <p>If you have any further questions or need additional assistance, please don't hesitate to contact us.</p>
      
      <p>Best regards,<br>
      The ${sitename} Team</p>
      
      <div style="text-align: center; margin-top: 20px;">
        <a href="https://indhostel.com" class="button">Visit Our Website</a>
      </div>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${sitename}. All rights reserved.</p>
      <p>This is an automated response - please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;
};

