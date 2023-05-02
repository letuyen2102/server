// Khai báo module twilio
const twilio = require('twilio');

// Khai báo tài khoản Twilio
const accountSid = 'AC0c8e9ccb0de3f134033fd46c862a91a1';
const authToken = '4d9869e943d2b346c5c96bde537d6df7';
const client = new twilio(accountSid, authToken);

// Gửi tin nhắn
client.messages
  .create({
     body: 'Chào mừng đến với Twilio!',
     from: '+14344426635',
     to: '+84984993733'
   })
  .then(message => console.log(message.sid))
  .catch(error => console.log(error));
