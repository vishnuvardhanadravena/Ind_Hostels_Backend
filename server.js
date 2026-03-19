const express = require("express");
const app = express();
require('dotenv').config();
const Limiter = require("express-rate-limit");
const cors = require("cors");
const corn = require("node-cron");
const passport = require('./src/config/passport.js');
const session = require("express-session");
const swaggerUI = require("swagger-ui-express");
const YAML = require("yamljs");
const UserDocument = YAML.load("./api.yaml");
const AdminDocument = YAML.load("./admin.yaml");
const VendorDocument = YAML.load("./vendor.yaml")
const AppDocument = YAML.load("./app.yaml")
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const path = require('path');
const cron = require('node-cron');
// const cron = require('node-cron');
require('./src/config/passport.js');
//functions :
const errorHandler = require('./src/middlewares/error.Handler.js');
const authroutes = require("./src/routes/usersRoutes.js");
const postroutes = require("./src/routes/Accommodations.js");
const adminroutes = require("./src/routes/adminRoutes.js");
const { dbConnnection } = require("./src/config/dbConnection.js");
const orderroutes = require('./src/routes/orderRoutes.js');
const couponroutes = require('./src/routes/couponRoutes.js');
const MongoStore = require("connect-mongo");
const notification = require('./src/models/notificationsSchema.js');
const rooms = require('./src/models/rooms.js');
const tagRoutes = require('./src/routes/Tags.js');
const vendorRoutes = require('./src/routes/vendor.js')
const helpandsupportRoutes = require('./src/routes/helpandsupport.js')
const sitename = process.env.SITE_NAME;
const productssc = require('./src/models/accommodations.js');
// Ensure primary DB connection is established for Mongoose models
dbConnnection();
const dbString = process.env.MONGODB_URL || (process.env.NODE_ENV === 'production' ? process.env.MONGODB_PRODUCTION : process.env.MONGODB_LOCAL);
 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session store using Mongo URL (from MONGO_URI/MONGODB_*). Fail fast if missing.
if (!dbString) {
  console.error('Missing Mongo connection string for session store. Set MONGODB_URL or MONGODB_LOCAL/MONGODB_PRODUCTION.');
  process.exit(1);
}

const dbSource = process.env.MONGODB_URL
  ? 'MONGODB_URL'
  : (process.env.NODE_ENV === 'production' ? 'MONGODB_PRODUCTION' : 'MONGODB_LOCAL');
console.log(`Using ${dbSource} for session store`);

app.use(
  session({
    secret: process.env.JWT_SECRET || 'change-this-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: dbString,
      collectionName: 'sessions',
    }),
  })
);

app.use(cookieParser());
//usage od limiter :
const limiter = Limiter({
  windowMs: 1 * 60 * 1000,
  max: 5000,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);
app.use(bodyParser.json());
app.use(express.static('src/public'));


// enable CORS :
app.use(
  cors({
    // origin: ['http://147.93.97.20:3000' , 'https://yourfrontend.com'],
    origin: '*',
     methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials : true,
  })
);

app.set('trust proxy', 1);


app.use(passport.initialize());
app.use(passport.session());
app.use(
  express.urlencoded({
    extended: true,
  })
);



// check the notification schema every day and if scheduledate meets current date then send notification :
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();

    const notifications = await notification.find({
      scheduletime: { $lte: now },
      sendnow: false
    });

    for (const noti of notifications) {
      noti.sendnow = true;
      await noti.save();
      //console.log('The Notification has been sent:', noti.notificationtitle);
    }
  } catch (error) {
    //console.error("Cron error:", error.message);
  }
});

corn.schedule('0 0 * * *',async()=>{
   try{
      const Rooms = await rooms.find({});
      for(const room of Rooms){
        room.bookings = room.bookings.filter(b =>
        new Date(b.check_out_date) > new Date() // keep only active bookings
      );
      await room.save();
      }      
   }catch(error){
      //console.log('Corn Error:',error.message)
   }
});

cron.schedule('* * * * *',async()=>{
   try{
      const Rooms = await rooms.find({});
      for(const room of Rooms){
        const noofrooms = Math.ceil(room.beds_available/room.no_of_guests)
        room.rooms_available = noofrooms
      await room.save();
      //console.log("update has done");
      }      
   }catch(error){
      console.log('Corn Error:',error.message)
   }
})


//initializing app :
app.use(`/${sitename}/auth/user`, authroutes);
app.use(`/${sitename}/auth/accommodation`, postroutes);
app.use(`/${sitename}/auth/admin`, adminroutes);
app.use(`/${sitename}/auth/user/booking`, orderroutes);
app.use(`/${sitename}/auth/coupon`, couponroutes);
app.use(`/${sitename}/auth/admin/tags`, tagRoutes);
app.use(`/${sitename}/auth/vendor`,vendorRoutes)
app.use(`/${sitename}/auth/helpandsupport`,helpandsupportRoutes)

//usage of swagger eith yaml code :
//app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(SwaggerDocument))
app.use('/user-docs',swaggerUI.serveFiles(UserDocument), swaggerUI.setup(UserDocument))
app.use('/admin-docs',swaggerUI.serveFiles(AdminDocument), swaggerUI.setup(AdminDocument))
app.use('/vendor-docs',swaggerUI.serveFiles(VendorDocument), swaggerUI.setup(VendorDocument))
app.use('/app-docs',swaggerUI.serveFiles(AppDocument), swaggerUI.setup(AppDocument))
//usage of error handler :
app.use(errorHandler);

const port = process.env.PORT || 3003;
app.listen(port, () => {
        console.log(`Server is Running on the port : ${port}`);
        console.log(
          `Swagger - Docs are running on Local server: http://localhost:${port}/user-docs`
        );
        console.log(
          `Admin - Docs are running on Local server: http://localhost:${port}/admin-docs`
        );
        console.log(`Vendor - Docs are running on Local server: http://localhost:${port}/vendor-docs`)
        console.log(`App - Docs are running on Local server: http://localhost:${port}/app-docs`)
        console.log('Swagger - Docs are running on live Production server: https://api.indhostel.com/user-docs/')
        console.log('Admin - Docs are running on live Production server: https://api.indhostel.com/admin-docs ')
        console.log('Vendor - Docs are running on live Production server: https://api.indhostel.com/vendor-docs ')
        console.log('App - Docs are running on live Production server: https://api.indhostel.com/app-docs ')
});


