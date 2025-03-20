import { 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand, 
  ListObjectsV2Command 
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET_NAME, generateFileKey } from './aws-config';

/**
 * Upload a file to S3
 * @param file File or Blob to upload
 * @param userId User ID for organizing files
 * @param fileType Category for the file (e.g., 'policy', 'claim')
 * @returns The S3 key and URL of the uploaded file
 */
export async function uploadFile(
  file: File | Blob, 
  userId: string, 
  fileType: string = 'document'
): Promise<{ key: string; url: string }> {
  // Generate a unique key for the file
  const key = generateFileKey(userId, fileType);
  
  try {
    // Convert file to Buffer for upload
    const buffer = await file.arrayBuffer();
    
    // Prepare upload command
    const params = {
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: Buffer.from(buffer),
      ContentType: file instanceof File ? file.type : 'application/octet-stream',
    };

    // Execute upload
    await s3Client.send(new PutObjectCommand(params));
    
    // Generate a temporary URL for the file (valid for 1 hour)
    const url = await getSignedUrl(
      s3Client, 
      new GetObjectCommand({ 
        Bucket: S3_BUCKET_NAME, 
        Key: key 
      }),
      { expiresIn: 3600 }
    );
    
    return { key, url };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file to S3');
  }
}

/**
 * Get a temporary signed URL for a file in S3
 * @param key The S3 key of the file
 * @returns A temporary signed URL for accessing the file
 */
export async function getFileUrl(key: string): Promise<string> {
  try {
    const url = await getSignedUrl(
      s3Client, 
      new GetObjectCommand({ 
        Bucket: S3_BUCKET_NAME, 
        Key: key 
      }),
      { expiresIn: 3600 } // 1 hour
    );
    
    return url;
  } catch (error) {
    console.error('Error generating file URL:', error);
    throw new Error('Failed to generate signed URL');
  }
}

/**
 * Delete a file from S3
 * @param key The S3 key of the file to delete
 */
export async function deleteFile(key: string): Promise<void> {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
      })
    );
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file from S3');
  }
}

/**
 * List all files for a user in a specific category
 * @param userId User ID to filter files by
 * @param fileType Category of files to list (optional)
 * @returns Array of file keys
 */
export async function listUserFiles(
  userId: string, 
  fileType?: string
): Promise<string[]> {
  try {
    const prefix = fileType 
      ? `${userId}/${fileType}/` 
      : `${userId}/`;
    
    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: S3_BUCKET_NAME,
        Prefix: prefix,
      })
    );
    
    if (!response.Contents) {
      return [];
    }
    
    return response.Contents.map(item => item.Key as string);
  } catch (error) {
    console.error('Error listing files:', error);
    throw new Error('Failed to list files from S3');
  }
} 