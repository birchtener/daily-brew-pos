import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import path from 'path';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const fileExt = path.extname(file.originalname).toLowerCase();

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/octet-stream'];

    const isMimeValid = allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('image/');
    const isExtValid = allowedExtensions.includes(fileExt);

    if (isMimeValid && isExtValid) {
      cb(null, true);
    } else {
      cb(
        Object.assign(
          new Error(`Invalid File Type: Received type [${file.mimetype}] with extension [${fileExt}]. Only standard image assets are allowed.`), 
          { statusCode: 400 }
        ) as any, 
        false
      );
    }
  }
});


export const streamUpload = (fileBuffer: Buffer, subFolder: 'products' | 'avatars' | 'ingredients'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        folder: `daily_brew/${subFolder}`,
        transformation: [{ quality: 'auto:good', fetch_format: 'auto' }] 
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result!.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};