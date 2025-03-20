import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

// Load S3 configuration from environment variables
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  // Add timeout settings to prevent hanging connections
  requestHandler: {
    timeoutInMs: 30000 // 30 second timeout
  }
});

const S3_BUCKET = process.env.AWS_S3_BUCKET || '';

// Image size presets for different use cases
export const IMAGE_SIZES = {
  THUMBNAIL: { width: 200, height: 200 },
  MEDIUM: { width: 800, height: 600 },
  LARGE: { width: 1600, height: 1200 },
};

/**
 * Optimize image buffer with sharp
 */
export async function optimizeImage(
  buffer: Buffer, 
  options: { 
    width?: number; 
    height?: number; 
    quality?: number;
    format?: 'jpeg' | 'webp' | 'png';
  } = {}
): Promise<Buffer> {
  const { 
    width, 
    height,
    quality = 80,
    format = 'webp' // webp for better compression
  } = options;
  
  let sharpInstance = sharp(buffer);
  
  // Resize if dimensions provided
  if (width || height) {
    sharpInstance = sharpInstance.resize({
      width,
      height,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }
  
  // Convert to appropriate format based on input
  switch (format) {
    case 'jpeg':
      return sharpInstance.jpeg({ quality }).toBuffer();
    case 'png':
      return sharpInstance.png({ quality }).toBuffer();
    case 'webp':
    default:
      return sharpInstance.webp({ quality }).toBuffer();
  }
}

/**
 * Generate responsive image sizes
 */
export async function generateResponsiveImages(buffer: Buffer): Promise<{
  original: Buffer;
  thumbnail: Buffer;
  medium: Buffer;
  webp: Buffer;
}> {
  const [thumbnail, medium, webp] = await Promise.all([
    optimizeImage(buffer, { 
      width: IMAGE_SIZES.THUMBNAIL.width, 
      height: IMAGE_SIZES.THUMBNAIL.height,
      quality: 75,
      format: 'jpeg'
    }),
    optimizeImage(buffer, { 
      width: IMAGE_SIZES.MEDIUM.width, 
      height: IMAGE_SIZES.MEDIUM.height,
      quality: 80,
      format: 'jpeg'
    }),
    optimizeImage(buffer, { 
      quality: 85,
      format: 'webp'
    })
  ]);
  
  return {
    original: buffer,
    thumbnail,
    medium,
    webp
  };
}

/**
 * Upload optimized image to S3 and return URLs
 */
export async function uploadOptimizedImage(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  folderName = 'images'
): Promise<{
  originalUrl: string;
  thumbnailUrl: string;
  mediumUrl: string;
  webpUrl: string;
}> {
  try {
    // Generate a unique ID for this image
    const imageId = randomUUID();
    const baseName = fileName.split('.')[0];
    
    // Generate optimized versions
    const { thumbnail, medium, webp } = await generateResponsiveImages(buffer);
    
    // Create S3 keys for each version
    const originalKey = `${folderName}/original/${imageId}-${fileName}`;
    const thumbnailKey = `${folderName}/thumbnails/${imageId}-${baseName}.jpg`;
    const mediumKey = `${folderName}/medium/${imageId}-${baseName}.jpg`;
    const webpKey = `${folderName}/webp/${imageId}-${baseName}.webp`;
    
    // Upload all versions to S3 in parallel
    await Promise.all([
      s3Client.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: originalKey,
        Body: buffer,
        ContentType: contentType,
      })),
      s3Client.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: thumbnailKey,
        Body: thumbnail,
        ContentType: 'image/jpeg',
      })),
      s3Client.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: mediumKey,
        Body: medium,
        ContentType: 'image/jpeg',
      })),
      s3Client.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: webpKey,
        Body: webp,
        ContentType: 'image/webp',
      }))
    ]);
    
    // Create URLs for each version
    const baseUrl = `https://${S3_BUCKET}.s3.amazonaws.com`;
    
    return {
      originalUrl: `${baseUrl}/${originalKey}`,
      thumbnailUrl: `${baseUrl}/${thumbnailKey}`,
      mediumUrl: `${baseUrl}/${mediumKey}`,
      webpUrl: `${baseUrl}/${webpKey}`,
    };
  } catch (error) {
    console.error('Error uploading optimized image to S3:', error);
    throw new Error('Failed to upload optimized image: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Get image metadata
 */
export async function getImageMetadata(buffer: Buffer): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
}> {
  const metadata = await sharp(buffer).metadata();
  
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    size: buffer.length,
  };
}

/**
 * Determine if a MIME type is an image
 */
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export default {
  optimizeImage,
  generateResponsiveImages,
  uploadOptimizedImage,
  getImageMetadata,
  isImage,
  IMAGE_SIZES,
}; 