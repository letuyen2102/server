// // Khai báo module twilio
// const twilio = require('twilio');

// // Khai báo tài khoản Twilio
// const accountSid = 'AC0c8e9ccb0de3f134033fd46c862a91a1';
// const authToken = '4d9869e943d2b346c5c96bde537d6df7';
// const client = new twilio(accountSid, authToken);

// // Gửi tin nhắn
// client.messages
//   .create({
//      body: 'Chào mừng đến với Twilio!',
//      from: '+14344426635',
//      to: '+84984993733'
//    })
//   .then(message => console.log(message.sid))
//   .catch(error => console.log(error));



const cloudinary = require('cloudinary').v2;

// const express = require('express');

require('dotenv').config({
  path : './../config.env'
})
// Khởi tạo cloudinary bằng cách truyền vào thông tin đăng nhập
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_CLOUD_KEY,
  api_secret: process.env.API_CLOUD_SECRET,
});



exports.uploadImage = (req, res, next) => {
  console.log( process.env.CLOUD_NAME)
  // // Xử lý request upload file ảnh
  // upload(req, res, (err) => {
  //   if (err) {
  //     console.log(err);
  //     return res.status(500).json(err);
  //   }

  //   // Upload ảnh lên Cloudinary
    // cloudinary.uploader.upload(req.file.path, (error, result) => {
    //   if (error) {
    //     console.log(error);
    //     return res.status(500).json(error);
    //   }

    //   // Trả về URL của ảnh đã upload
    //   return res.status(200).json(result.secure_url);
    // });
  // });
  try {
    if (req.files) {
      console.log(req.files)
    }
    res.status(200).json({
      status : 'success'
    })
  }
  catch(err){
    console.log(err)
    res.status(400).json({
      status : 'error'
    })
  }
};




