const axios = require('axios')
const global = require('../models/globalsearch');
const { find } = require('../models/rooms');

exports.getarounddata = async(latitude, longitude) => {
    try {
        const query = `
            [out:json];
           (
            node(around:2000,${latitude},${longitude})[amenity=cafe] (if: t["name"]);
            node(around:2000,${latitude},${longitude})[amenity=restaurant] (if: t["name"]);
            node(around:2000,${latitude},${longitude})[shop=mall] (if: t["name"]);
            node(around:2000,${latitude},${longitude})[amenity=hospital] (if: t["name"]);
           );
            out 15;
        `;
        const response = await axios.post(
            "https://overpass-api.de/api/interpreter",
            query,
            { headers: { "Content-Type": "text/plain" } }
        );
        
        // Return only the data we need
        return response.data;
    } catch (error) {
        console.error('Error in getarounddata:', error.message);
        // Return a consistent error object that can be safely serialized
        return {
            success: false,
            statuscode: 500,
            message: "Error when getting data || internal server error",
            error: error.message
        };
    }
}

exports.normalizestring = (str) => {
   return str.toString().toLowerCase().replace(/[-_]/g, " ");
}

exports.validateEmail = (email) => {
    let re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if(!re.test(email)){
        return { success: false, message: 'Please enter a valid email' };
    }
    return email;
}


exports.validatePhone = (phone) => {
    let re = /^\d{10}$/;
    if(!re.test(phone)){
        return { success: false, message: 'Please enter a valid phone number,it should be 10 digits' };
    }
    return phone;
}

exports.validatePassword = (password) => {
    let re = /^(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!])[A-Za-z\d@#$%^&+=!]{8,}$/;
    if(!re.test(password)){
        return { success: false, message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one number, and one special character' };
    }
    return password;
}

exports.validateaccount_number = (account_num) => {
    let re = /^\d{9,16}$/;
    if(!re.test(account_num)){
        return { success: false, message: 'Please enter a valid account number' };
    }
    return account_num;
}

exports.validateifsc = (ifsc) => {
     const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/; 
     if(!ifscRegex.test(ifsc)){
        console.log('Regex test result:', ifscRegex.test(ifsc), 'for ifsc:', ifsc);
        console.log('Regex validation failed - Invalid ifsc code:', ifsc);
        return { success: false, message: 'Please enter a valid ifsc code' };
     }
     return ifsc;
}

// exports.store_user_sesarch = async(userid, type, searchtext, location, checkin, checkout) => {
//      try{
//         //console.log('Storing search:', { searchtext, userid });
//         const validSearchRegex = /^[a-zA-Z0-9\s\-+#@']+$/; 
//         //console.log('Regex test result:', validSearchRegex.test(searchtext), 'for searchtext:', searchtext);
        
//         if(!validSearchRegex.test(searchtext) || (location && checkin && checkout)){
//            // console.log('Regex passed - proceeding with search storage');
//             const find_user = await global.findOne({user_id: userid})
//             //console.log('Found user:', find_user);
//             // if(find_user){
//             //     find_user.searchtext.push(searchtext)
//             //     await find_user.save()
//             //     //console.log('Updated existing user search history');
//             // }else{
//             //     const data = await global.create({
//             //         user_id: userid,
//             //         searchtext: [searchtext]
//             //     })
//             //     //console.log('Created new user search record:', data);
//             // } 
            
//             if(type === 'text'){
//                 if(find_user){
//                     find_user.searchtext.push(searchtext)
//                     await find_user.save()
//                     console.log('Search text added successfully');
//                 }else{
//                     const data = await global.create({
//                         user_id: userid,
//                         searchtext: [searchtext]
//                     })
//                     console.log('New user search record created:', data);
//                 }
//             }else if(type === 'Location'){
//                 if(find_user){
//                     find_user.locationsearch.push({
//                             location: location,
//                             checkin: checkin,
//                             checkout: checkout
//                          });

//                     await find_user.save();
//                     console.log('Location search saved successfully');
//                 }else{
//                     const data = await global.create({
//                          user_id: userid,
//                          searchtext: [],
//                          locationsearch: [{
//                              location: location,
//                              checkin: checkin,
//                              checkout: checkout
//                          }]
//                     })
//                     console.log('New user location search record created:', data);
//                     await data.save();
//                 }
//             }
//             return { success: true, message: 'Search stored successfully' }
//         } else {
//             console.log('Regex validation failed - Invalid search text format:', searchtext);
//         }
//         //return { success: false, message: 'Invalid search text format' }
//      }catch(error){
//          //console.error('Error in store_user_sesarch:', error);
//          return {
//              success: false,
//              statuscode:500,
//              message:"internal server error",
//              error: error.message
//          }
//      }
// }  

exports.store_user_sesarch = async ({
    userid,
    type,
    searchtext = null,
    location = null,
    checkin = null,
    checkout = null
    }) => {
    try {

        const validSearchRegex = /^[a-zA-Z0-9\s\-+#@']+$/;

        const find_user = await global.findOne({ user_id: userid });

        if (type === "text") {

            if (!searchtext || !validSearchRegex.test(searchtext)) {
                return;
            }

            if (find_user) {
                find_user.searchtext.push(searchtext);
                await find_user.save();
            } else {
                await global.create({
                    user_id: userid,
                    searchtext: [searchtext]
                });
            }

        } else if (type === "Location") {

            if (!location || !checkin || !checkout) {
                return;
            }

            if (find_user) {

                find_user.locationsearch.push({
                    location: location,
                    checkin: checkin,
                    checkout: checkout
                });

                await find_user.save();

            } else {

                await global.create({
                    user_id: userid,
                    searchtext: [],
                    locationsearch: [{
                        location: location,
                        checkin: checkin,
                        checkout: checkout
                    }]
                });

            }
        }

        return {
            success: true,
            message: "Search stored successfully"
        };

    } catch (error) {

        return {
            success: false,
            statuscode: 500,
            message: "internal server error",
            error: error.message
        };

    }
};