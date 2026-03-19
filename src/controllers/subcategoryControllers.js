const subcategory = require('../models/subcategoryschema')    
const category = require('../models/categoriesschema')
const {deleteOldImages} = require('../middlewares/S3_bucket');
exports.createsubcategory = async(req,res) => {
    try{
        const { subcategory: subcategoryName, category: categoryName } = req.body  
        if(!categoryName || !subcategoryName){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: 'All fields are required'
            })
        }
        // Find the category by name
        const categoryDoc = await category.findOne({ categery_name: categoryName }).select('_id').lean();
        if(!categoryDoc){
            return res.status(404).json({
                success: false,
                statuscode: 404,
                message: `Category '${categoryName}' does not exist`,
                error: 'Not Found'
            })
        }
        // Check if subcategory already exists
        const existing = await subcategory.findOne({
            subcategoryname: subcategoryName,
            categoryname: categoryDoc._id
        });
        console.log(existing)
        if(existing){
            return res.status(401).json({
                success: false,
                statuscode: 401,
                message: `${subcategoryName} is already exisits`,
                error: 'bad request'
            })
        } 
        let subimage;
        if(req.file){
           subimage = req.file.location;
        }
        const newsubcategory = await subcategory.create({subcategoryname: subcategoryName, categoryname: categoryDoc._id,image: subimage}) 
        if(!newsubcategory){
            return res.status(401).json({
                success: false,
                statuscode: 401,
                message: `${subcategoryName} is not exists`,
                error: 'bad request'
            })
        }
        res.status(200).json({
            success: true,
            statuscode: 200,
            message: 'Subcategory created successfully',
            data: newsubcategory
        })
    }catch(error){
        return res.status(500).json({
            success: false,
            statuscode: 500,
            message: 'Internal ServerError',
            error: error.message
        })
    }
}

exports.getsubcategoriesbycategory = async(req,res) => {
    try{
        const {category: categoryName} = req.params 
        if(!categoryName){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: 'Category is required',
                error: 'Bad Request'
            })
        } 

        // First find the category by name to get its ID
        const categoryDoc = await category.findOne({ categery_name: categoryName });
        console.log(categoryDoc)
        if (!categoryDoc) {
            return res.status(404).json({
                success: false,
                statuscode: 404,
                message: "Category not found",
                error: "Not Found"
            });
        }
        
        // Then find subcategories with the category's ID
        const result = await subcategory.find({ categoryname: categoryDoc._id }).select("subcategoryname image _id") 

        if(!result || result.length === 0){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: 'subcategories not found in db related to the category',
                error: 'Bad Request'
            })
        }

        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: 'Subcategories fetched succesfully by category', 
            data: result
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

exports.updatesubcategory = async(req,res) => {
    try{
        const {id} = req.params
        if(!id){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: 'Invalid ID',
                error: 'Bad Request'
            })
        }
        const isSubcategory = await subcategory.findById(id)
        if(!isSubcategory){
            return res.status(404).json({
                success: false,
                statuscode: 404,
                message: 'Subcategory not found',
                error: 'Not Found'
            })
        }
        const { subcategory: subcategoryName } = req.body;
        if(!subcategory){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: 'Subcategory name is required'
            })
        }
       let subimage 
       if(req.file){
           subimage = req.file.location
           console.log(subimage)
       }
       if(isSubcategory.image){
           await deleteOldImages(isSubcategory.image)
       }
        const updatedSubcategory = await subcategory.findByIdAndUpdate(id, {subcategoryname: subcategoryName, image: subimage}, {new: true})
        return res.status(200).json({
            success: true,
            message: 'Subcategory updated successfully',
            updatedSubcategory
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

exports.getgategoriesandsubcategories = async (req, res) => {
    try {
        const categories = await category.find().select("_id categery_name");
        const result = await Promise.all(
            categories.map(async (cat) => {
                const subs = await subcategory.find({ categoryname: cat._id })
                    .select('_id subcategoryname');
                return {
                    _id: cat._id,
                    category_name: cat.categery_name,
                    subcategories: subs,
                };
            })
        );
        return res.status(200).json({
            success: true,
            statuscode: 200,
            message: 'Categories and subcategories fetched successfully',
            data: result
        });
    } catch (error) {
        //console.error('Error in getgategoriesandsubcategories:', error);
        return res.status(500).json({
            success: false,
            statuscode: 500,
            message: 'Internal Server Error',
            error: error.message
        });
    }
};

exports.deletesubcategory = async(req,res) => {
    try{
        const {id} = req.params
        if(!id){
            return res.status(400).json({
                success: false,
                statuscode: 400,
                message: 'Invalid ID',
                error: 'Bad Request'
            })
        }
        const isSubcategory = await subcategory.findById(id)
        if(!isSubcategory){
            return res.status(404).json({
                success: false,
                statuscode: 404,
                message: 'Subcategory not found',
                error: 'Not Found'
            })
        }
        if(isSubcategory.image){
            const key = decodeURIComponent(new URL(isSubcategory.image).pathname).substring(1);
            await deleteOldImages(key);
        }
        const deletedSubcategory = await subcategory.findByIdAndDelete(id)
        return res.status(200).json({
            success: true,
            message: 'Subcategory deleted successfully',
            deletedSubcategory
        })
    }catch(error){
        return res.status(500).json({
            success: false,
            statuscode: 500,
            message: 'Internal Server Error',
            error: error.message
        })
    }
};


