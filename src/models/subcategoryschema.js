const mongoose = require('mongoose')  


const subcategorySchema = new mongoose.Schema({
      subcategoryname: {
         type: String
      },
      categoryname: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'categories'
      },
      image: {
         type: String
      }
},
{timestamps: true}
)

module.exports = mongoose.model('subcategories',subcategorySchema)