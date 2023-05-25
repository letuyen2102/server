// // // Khai báo module twilio
// // const twilio = require('twilio');

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
// const path = require('path')
// const fs = require('fs')
// require('dotenv').config({
//   path : './../config.env'
// })
// const cloudinary = require('cloudinary').v2;
// const { CloudinaryStorage } = require('multer-storage-cloudinary');

// cloudinary.config({
//   cloud_name: process.env.CLOUD_NAME,
//   api_key: process.env.API_CLOUD_KEY,
//   api_secret: process.env.API_CLOUD_SECRET,
// });

// const imagePath = './../public/image/users';

// // Lấy danh sách các file trong folder
// const uploadImage = (file) => {
//   return new Promise((resolve, reject) => {
//     const publicId = `my_image_user/${file}`;
    
//     const options = {
//       public_id: publicId
//     };
    
//     cloudinary.uploader.upload(`${imagePath}/${file}`, options, (error, result) => {
//       if (error) reject(error);
//       console.log(`Uploaded ${result.public_id} to Cloudinary`);
//       resolve(result.public_id);
//     });
//   });
// }

// const uploadImages = async () => {
//   try {
//     const files = await fs.promises.readdir(imagePath);
//     for (const file of files) {
//       await uploadImage(file);
//     }
//     console.log('All images uploaded successfully!');
//   } catch (error) {
//     console.error(error);
//   }
// }

// uploadImages();