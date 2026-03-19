const categories  = require('../models/categoriesschema')
const {deleteOldImages} = require('../middlewares/S3_bucket')
const subcategories = require('../models/subcategoryschema')
const staymodel = require('../models/stay')
//create a category : 
exports.createCategory = async(req, res) => {
  try {
    const { staytype,category } = req.body;
    if(!category){
      return res.status(401).json({
        success: false,
        statuscode:401,
        message: "Category filed is required",
        error: "Bad Request"
      })
    } 
    category = category
               .toString()
               .trim()
               .toLowerCase()
               .replace(/[-_]/g, " ") 
               .replace(/\s+/g, ""); 
    const isStaytype = await staymodel.findOne({ staytype: staytype }).select("_id")
    if(!isStaytype){
      return res.status(401).json({
        success: false,
        statuscode:401,
        message: `${staytype} staytype is not found in db`,
        error: "Bad Request",
      })
    }
    const isCategory = await categories.findOne({ category_name: category });
    if(isCategory){
      return res.status(401).json({
        success: false,
        statuscode:401,
        message: `${category} category is already exist`,
        error: "Bad Request",
      })
    }
    // let catimage
    // if(req.file){
    //    catimage = req.file.location;
    // }
    const newCategory = await categories.create({
      staytype: isStaytype._id,
      category_name: category
    })
    return res.status(200).json({
      success: true,
      message: "category created successfully",
      newCategory,
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode:500,
      message: "Internal Server Error",
      error: error.message
    })
  }
};

//get all the categories : 
exports.getAllCategories = async(req, res) =>{
  try {
    const {staytype} = req.query;
    if(!staytype){
      return res.status(401).json({
        success: false,
        statuscode:401,
        message: "Staytype is required",
        error: "Bad Request"
      })
    }
    const isStaytype = await staymodel.findOne({ staytype: staytype }).select("_id")
    if(!isStaytype){
      return res.status(401).json({
        success: false,
        statuscode:401,
        message: `${staytype} staytype is not found in db`,
        error: "Bad Request",
      })
    }
    const allCategories = await categories.find({staytype: isStaytype._id}).select("-createdAt -updatedAt -__v");
    if(!allCategories || allCategories.length === 0){
      return res.status(404).json({
        success: false,
        statuscode:404,
        message: 'categories are empty',
        error: "Not Found"
      })
    }
    return res.status(200).json({
      success: true,
      message: "categories retrieved successfully",
      allCategories,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode:500,
      message: "Intenal Server Error",
      error: error.message,
    })
  }
};

exports.updatecategory = async(req,res) => {
   try{
     const {id} = req.params
     if(!id){
        return res.status(400).json({
          success: false,
          statuscode:400,
          message: 'Invalid ID',
          error: 'Bad Request'
        })
     }
     const iscategory = await categories.findById(id)
     if(!iscategory){
      return res.status(404).json({
        success: false,
        statuscode:404,
        message: 'Category not found',
        error: 'Not Found'
      })
     }
     const {category} = req.body
     if(!category){
      return res.status(400).json({
        success: false,
        statuscode:400,
        message: 'Category is required',
        error: 'Bad Request'
      })
     }
    //  let catimage
    //  if(req.file){
    //   catimage = req.file.location;
    //  }
    //  if(iscategory.image){
    //   await deleteOldImages(iscategory.image)
    //  }
     const updatedCategory = await categories.findByIdAndUpdate(id, {category_name: category}, {new: true})
     return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      updatedCategory
     })

   }catch(error){
      return res.status(500).json({
         success: false,
         statuscode: 500,
         message: "Internal Serever Error",
         error: error.message
      })
   }
};

exports.deletecategory = async(req,res) => {
   try{
     const {id} = req.params
     //console.log(id)
     const cat_res = await categories.findById(id)
    //  if(cat_res.image){
    //   const key = decodeURIComponent(new URL(cat_res.image).pathname).substring(1);
    //   await deleteOldImages(key);
    //  }
     const deletecat = await categories.findByIdAndDelete(id)
     if(!deletecat){
      return res.status(404).json({
        success: false,
        statuscode:404,
        message: 'Category not deleted',
        error: 'Bad Request'
      })
     }
    //  const subcat_res = await subcategories.find({ categoryname: id })
    //  if(subcat_res.image){
    //   const key = decodeURIComponent(new URL(subcat_res.image).pathname).substring(1);
    //   await deleteOldImages(key);
    //  }
    //  await subcategories.deleteMany({ categoryname: id });
     return res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
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

//get all categories and group by staytype
exports.getallcategoriesanditsstaytype = async(req,res) => {
   try{
     const allstaytypes = await staymodel.find().select("_id staytype")
     const allcategories = await categories.find().select("staytype category_name -_id")
     const groupedCategories = allstaytypes.map(staytype => {
       return {
         staytype: staytype.staytype,
         categories: allcategories.filter(category => category.staytype._id.toString() === staytype._id.toString())
       }
     })
     return res.status(200).json({
       success: true,
       message: 'All categories retrieved successfully',
       groupedCategories
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
