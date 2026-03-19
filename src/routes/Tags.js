const express = require("express");
const router = express.Router();
const admin= require("../middlewares/authUser.js")
const tagsctrl = require("../controllers/Tags.js");

router.post("/createtag",admin.adminAuthenticate,admin.isAdmin,tagsctrl.createTag) 
router.get("/alltags",admin.adminAuthenticate,admin.isAdmin,tagsctrl.getTags)
router.put("/updatetag/:id",admin.adminAuthenticate,admin.isAdmin,tagsctrl.updateTag)
router.delete("/deletetag/:id",admin.adminAuthenticate,admin.isAdmin,tagsctrl.deleteTag)
module.exports = router;
