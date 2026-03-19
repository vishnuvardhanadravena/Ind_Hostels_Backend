const multer = require("multer");
const express = require("express");
const multers3 = require('multer-s3');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();


// module.exports = upload;
const s3Client = new S3Client({
   region: process.env.cloud_aws_region_static,
   credentials: {
      accessKeyId: process.env.cloud_aws_credentials_access_key,
      secretAccessKey: process.env.cloud_aws_credentials_secret_key,
   }
});

const profileImages = multer({
   storage: multers3({
      s3: s3Client,
      bucket: process.env.application_bucket_name,
      contentType: multers3.AUTO_CONTENT_TYPE,
      cacheControl: 'public, max-age=31536000',

      contentDisposition: 'inline',
      key: function (req, file, cb) {
         const filename = Date.now().toString() + '-' + file.originalname;
         cb(null, `profileImages/${filename}`);
      }
   }),
   limits: {
      fileSize: 20 * 1024 * 1024, // 20MB
   },
   fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith("image/")) {
         return cb(new Error("Only image files are allowed."), false);
      }
      cb(null, true);
   },

})

const accommodationImages = multer({
   storage: multers3({
      s3: s3Client,
      bucket: process.env.application_bucket_name,
      contentType: multers3.AUTO_CONTENT_TYPE,
      cacheControl: 'public, max-age=31536000',
      contentDisposition: 'inline',
      key: function (req, file, cb) {
         const filename = Date.now().toString() + '-' + file.originalname;
         cb(null, `accommodationImages/${filename}`);
      },
   }),
   limits: {
      fileSize: 20 * 1024 * 1024,
      fieldSize: 20 * 1024 * 1024, // 20MB limit for fields
   },
   preservePath: true,
   fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith("image/")) {
         return cb(new Error("Only image files are allowed."), false);
      }
      cb(null, true);
   },

})

const roomImages = multer({
   storage: multers3({
      s3: s3Client,
      bucket: process.env.application_bucket_name,
      contentType: multers3.AUTO_CONTENT_TYPE,
      cacheControl: 'public, max-age=31536000',

      contentDisposition: 'inline',
      key: function (req, file, cb) {
         const filename = Date.now().toString() + '-' + file.originalname;
         cb(null, `roomImages/${filename}`);
      },
   }),
   limits: {
      fileSize: 20 * 1024 * 1024,
   },
   fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith("image/")) {
         return cb(new Error("Only image files are allowed."), false);
      }
      cb(null, true);
   },

})

const documents = multer({
   storage: multers3({
      s3: s3Client,
      bucket: process.env.application_bucket_name,
      contentType: multers3.AUTO_CONTENT_TYPE,
      cacheControl: 'public, max-age=31536000',
      contentDisposition: 'inline',
      key: function (req, file, cb) {
         const filename = Date.now().toString() + '-' + file.originalname;
         cb(null, `documents/${filename}`);
      },
   }),
   limits: {
      fileSize: 20 * 1024 * 1024,
   },
   fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith("image/")) {
         return cb(new Error("Only image files are allowed."), false);
      }
      cb(null, true);
   },
})

const attachments = multer({
   storage: multers3({
      s3: s3Client,
      bucket: process.env.application_bucket_name,
      contentType: multers3.AUTO_CONTENT_TYPE,
      cacheControl: 'public, max-age=31536000',
      contentDisposition: 'inline',
      key: function (req, file, cb) {
         const filename = Date.now().toString() + '-' + file.originalname;
         cb(null, `attachments/${filename}`);
      },
   }),
   limits: {
      fileSize: 20 * 1024 * 1024,
   },
   fileFilter: (req, file, cb) => {
      // Accepts any file type for attachments
      cb(null, true);
   },
})

const invoices = multer({
   storage: multers3({
      s3: s3Client,
      bucket: process.env.application_bucket_name,
      contentType: multers3.AUTO_CONTENT_TYPE,
      cacheControl: 'public, max-age=31536000',
      contentDisposition: 'inline',
      key: function (req, file, cb) {
         const filename = Date.now().toString() + '-' + file.originalname;
         cb(null, `invoices/${filename}`);
      },
   }),
   limits: {
      fileSize: 10 * 1024 * 1024, // 10MB for invoices
   },
   fileFilter: (req, file, cb) => {
      if (file.mimetype !== 'application/pdf') {
         return cb(new Error("Only PDF files are allowed for invoices."), false);
      }
      cb(null, true);
   },
})

const uploadAccom = multer({
   storage: multers3({
      s3: s3Client,
      bucket: process.env.application_bucket_name,
      contentType: multers3.AUTO_CONTENT_TYPE,
      cacheControl: "public, max-age=31536000",
      contentDisposition: "inline",
      key: function (req, file, cb) {
         const filename = Date.now().toString() + "-" + file.originalname;

         // Dynamically choose folder based on field name
         let folder = "others/";
         if (file.fieldname === "images") folder = "accommodationImages/";
         if (file.fieldname === "docs") folder = "documents/";

         cb(null, `${folder}${filename}`);
      },
   }),
   limits: {
      fileSize: 20 * 1024 * 1024,
   },
   fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith("image/")) {
         return cb(new Error("Only image files are allowed."), false);
      }
      cb(null, true);
   },
});





















const reviewimages = multer({
   storage: multers3({
      s3: s3Client,
      bucket: process.env.application_bucket_name,
      contentType: multers3.AUTO_CONTENT_TYPE,
      cacheControl: 'public, max-age=31536000',


      contentDisposition: 'inline',
      key: function (req, file, cb) {
         const filename = Date.now().toString() + '-' + file.originalname;
         cb(null, `reviewimages/${filename}`);
      },
   }),
   limits: {
      fileSize: 20 * 1024 * 1024,
   },
   fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith("image/")) {
         return cb(new Error("Only image files are allowed."), false);
      }
      cb(null, true);
   },

})

const subcategoryImages = multer({
   storage: multers3({
      s3: s3Client,
      bucket: process.env.application_bucket_name,
      contentType: multers3.AUTO_CONTENT_TYPE,
      cacheControl: 'public, max-age=31536000',

      contentDisposition: 'inline',
      key: function (req, file, cb) {
         const filename = Date.now().toString() + '-' + file.originalname;
         cb(null, `subcategoryImages/${filename}`);
      },
   }),
   limits: {
      fileSize: 20 * 1024 * 1024,
   },
   fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith("image/")) {
         return cb(new Error("Only image files are allowed."), false);
      }
      cb(null, true);
   },
})
const categoryImages = multer({
   storage: multers3({
      s3: s3Client,
      bucket: process.env.application_bucket_name,
      contentType: multers3.AUTO_CONTENT_TYPE,
      cacheControl: 'public, max-age=31536000',

      contentDisposition: 'inline',
      key: function (req, file, cb) {
         const filename = Date.now().toString() + '-' + file.originalname;
         cb(null, `categoryImages/${filename}`);
      },
   }),
   limits: {
      fileSize: 20 * 1024 * 1024,
   },
   fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith("image/")) {
         return cb(new Error("Only image files are allowed."), false);
      }
      cb(null, true);
   },
})
console.log("S3 Bucket is on Live 🚀");

module.exports = {
   profileImages,
   accommodationImages,
   roomImages,
   reviewimages,
   subcategoryImages,
   categoryImages,
   documents,
   attachments,
   uploadAccom,
   invoices
}


