import { S3Client } from '@aws-sdk/client-s3';
import { RekognitionClient } from '@aws-sdk/client-rekognition';

// For local development without proper AWS credentials, 
// we can set defaults to prevent runtime errors
const defaultConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'mock-access-key',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'mock-secret-key',
  }
};

// Create S3 client instance
export const s3Client = new S3Client(defaultConfig);

// Create Rekognition client instance 
export const rekognitionClient = new RekognitionClient(defaultConfig);

// S3 bucket name
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'florida-insurance-claims';

// Export utility function to generate unique file keys
export const generateFileKey = (userId: string, fileType: string): string => {
  const date = new Date().toISOString().replace(/[:.]/g, '-');
  const randomId = Math.random().toString(36).substring(2, 10);
  return `${userId}/${fileType}/${date}_${randomId}`;
}; 