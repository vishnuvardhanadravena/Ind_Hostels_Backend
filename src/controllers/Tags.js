const tags = require("../models/Tags.js"); 


exports.createTag = async (req,res) => {
    try{
        const {tag} = req.body;
        console.log(tag)
        if(!tag){
            return res.status(400).json({
                success: false,
                message: "Tag name is required",
                error: "Bad Request"
            })
        }
        const tagres = await tags.findOne({tagname: tag})
        if(tagres){
            return res.status(400).json({
                success: false,
                message: "Tag already exists",
                error: "Bad Request"
            })
        }
        const newtag = await tags.create({
            tagname: tag
        })
        return res.status(200).json({
            success: true,
            message: "Tag created successfully",
            statuscode: 200,
            tag: newtag
        })
    }catch(error){
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        })
    }
} 

exports.getTags = async (req,res) => {
     try{
        const {page,limit} = req.query;
        const skip = (page - 1) * limit;
        const alltags = await tags.find().select('-createdAt -updatedAt -__v').skip(skip).limit(limit)
        if(!alltags || alltags.length === 0){
            return res.status(404).json({
                success: false,
                message: "No tags found",
                error: "Not Found"
            })
        }
        return res.status(200).json({
            success: true,
            message: "Tags fetched successfully",
            statuscode: 200,
            tags: alltags,
            totalTags: alltags.length,
            totalPages: Math.ceil(alltags.length / limit),
            currentPage: page
        })
     }catch(error){
         return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
         })
     }
} 

exports.updateTag = async (req,res) => {
    try{
        const {id} = req.params;
        if(!id){
            return res.status(400).json({
                success: false,
                message: "Tag id is required",
                error: "Bad Request"
            })
        }
        const {tagname} = req.body;
        const tag_res = await tags.findOne({_id: id})
        if(!tag_res){
            return res.status(404).json({
                success: false,
                message: "Tag not found",
                error: "Not Found"
            })
        }
        // tag_res.tagname = tagname
        // await tag_res.save() 

        const updatetag = await tags.updateOne({_id: id},{tagname: tagname},{new: true})
        if(!updatetag){
            return res.status(404).json({
                success: false,
                message: "Tag not updated",
                error: "Not Found"
            })
        }
        return res.status(200).json({
            success: true,
            message: "Tag updated successfully",
            statuscode: 200
        })
    }catch(error){
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        })
    }
}
exports.deleteTag = async(req,res) => {
    try{
        const {id} = req.params;
        if(!id){
            return res.status(400).json({
                success: false,
                message: "Tag id is required",
                error: "Bad Request"
            })
        }
        const tag_res = await tags.findById(id)
        if(!tag_res){
            return res.status(404).json({
                success: false,
                message: "Tag not found",
                error: "Not Found"
            })
        }
        const deletedtag = await tags.findByIdAndDelete(id)
        if(!deletedtag){
            return res.status(404).json({
                success: false,
                message: "Tag not deleted",
                error: "Not Found"
            })
        }
        return res.status(200).json({
            success: true,
            message: "Tag deleted successfully",
            statuscode: 200
        })
    }catch(error){
         return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
         })
    }
}
