const multer = require('multer');
const path = require('path')
const appRoot = require('app-root-path')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, appRoot + "/public/image/products");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix);
    }
});

const imageFilter = function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|avif|AVIF)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
const upload = multer({ storage: storage, fileFilter: imageFilter });

module.exports = upload