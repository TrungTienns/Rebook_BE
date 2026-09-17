const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer storage for Images
const storageImage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'rebook_covers', // Thư mục lưu ảnh
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 750, crop: 'limit' }] // Resize
  }
});

// Configure Multer storage for PDFs
const storagePdf = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'rebook_pdfs', // Thư mục lưu file PDF
    allowed_formats: ['pdf'],
    resource_type: 'raw' // Bắt buộc là 'raw' hoặc 'auto' cho file PDF/document
  }
});

const uploadCloudImage = multer({ storage: storageImage });
const uploadCloudPdf = multer({ 
  storage: storagePdf,
  limits: { fileSize: 50 * 1024 * 1024 } // Giới hạn 50MB
});

// Configure Multer storage to local disk (Temporary for PDF compression)
const tempDir = path.join(__dirname, '..', '..', 'tmp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storageTempFile = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.tmp';
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const uploadTempFile = multer({ 
  storage: storageTempFile,
  limits: { fileSize: 50 * 1024 * 1024 } // Giới hạn 50MB
});

module.exports = { cloudinary, uploadCloudImage, uploadCloudPdf, uploadTempFile };
