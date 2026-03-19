const express = require('express');
const router = express.Router();
const { authenticate, authenticateifNeeded, } = require('../middlewares/authUser.js');
const accommodations = require('../controllers/Accomodations.js');
const { getgategoriesandsubcategories } = require('../controllers/subcategoryControllers.js');
const reviews = require('../controllers/reviews.js')
const categories = require('../controllers/categoryControllers.js')
const amenities = require('../controllers/amenities.js')
const rooms = require('../controllers/Rooms.js')


// Accommodation Routes: 
router.get('/dealsincity', accommodations.getdealsincity)
router.get('/searches', authenticateifNeeded,accommodations.RecentSerachesOfGlobal)
router.get('/featureaccommodations', accommodations.getFeaturedAccommodationsbycity)
router.get("/productfilter", authenticateifNeeded,accommodations.getfilteraccomidations);
router.patch('/clear-all-searches',authenticateifNeeded,accommodations.clearallsearches)
router.get('/user-liked-accommodation', accommodations.get_user_may_like_accomidations)
router.get("/sortaccommodation", accommodations.sortaccomodations)
router.get('/advanced-search', authenticateifNeeded, accommodations.advancedSearch)
router.get("/search", accommodations.searchProducts);
router.get('/getfilter-accomidations-by-area',accommodations.getfilteraccomidationsbyarea)
router.get("/filternames", accommodations.getallfilternames)
router.get('/randomproducts', accommodations.getRandomProducts);
router.get('/recentlyviews', authenticate, accommodations.getrecentlyviews)
router.get('/allamenities', amenities.getallamenities);
router.get('/topaccommodations', accommodations.gettopaccommodations)
router.get('/bycity', accommodations.getAccommodationsbycity)
router.get('/getcategoriesandsubcategories', getgategoriesandsubcategories)
router.get('/getallcategoriesanditsstaytype', categories.getallcategoriesanditsstaytype)
router.get('/neighborhoods', accommodations.getNeighborhoodAccommodations)
router.get('/:id', authenticateifNeeded,accommodations.getAccommodationById);
router.get('/', accommodations.getAllAccommodations);
router.get('/room/:id', rooms.getroomById)





// Rating Routes : 
const { reviewimages } = require('../middlewares/multer.js');

router.get("/reviews/all/:id", reviews.getReviewsByProduct);
//router.post("/review/:id", authenticate, reviewimages.single('image'), reviews.createReview);
router.post("/review/:id", authenticate, reviews.createReview);
router.get("/reviews/random", reviews.getrandomreviews)
router.patch("/review/:id", authenticate, reviews.updatereview)
module.exports = router;