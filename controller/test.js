// // // Khai báo module twilio
// // const twilio = require('twilio');

const multer = require('multer');

// // // Khai báo tài khoản Twilio
// // const accountSid = 'AC0c8e9ccb0de3f134033fd46c862a91a1';
// // const authToken = '4d9869e943d2b346c5c96bde537d6df7';
// // const client = new twilio(accountSid, authToken);

// // // Gửi tin nhắn
// // client.messages
// //   .create({
// //      body: 'Chào mừng đến với Twilio!',
// //      from: '+14344426635',
// //      to: '+84984993733'
// //    })
// //   .then(message => console.log(message.sid))
// //   .catch(error => console.log(error));


const storage = multer.memoryStorage()
const cloudinary = require('cloudinary').v2;
require('dotenv').config({
  path : './../config.env'
})

const upload = multer({ storage: storage});
exports.uploadTest = upload.any();

exports.uploadImagesToCloudinary = async (req, res, next) => {
  try {
    // Cấu hình Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.API_CLOUD_KEY,
      api_secret: process.env.API_CLOUD_SECRET,
    });

    // Xử lý từng file đã tải lên
    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const { originalname, buffer } = file;
        console.log(file)
        cloudinary.uploader.upload_stream(
          {
            folder: 'my_image_product',
            public_id: originalname.split('.')[0],
            resource_type: 'image',
          },
          (error, result) => {
            if (error) {
              console.error(error);
              reject(error);
            } else {
              console.log(result);
              resolve(result);
            }
          }
        ).end(buffer);
      });
    });

    // Đợi tất cả các tệp tin được tải lên lên Cloudinary
    const cloudinaryResults = await Promise.all(uploadPromises);

    res.status(200).json({
      status: 'success',
      cloudinary_results: cloudinaryResults,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: 'error',
    });
  }
};



