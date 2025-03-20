import { 
  DetectTextCommand, 
  DetectLabelsCommand,
  DetectModerationLabelsCommand 
} from '@aws-sdk/client-rekognition';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { rekognitionClient, s3Client, S3_BUCKET_NAME } from './aws-config';
import { createHash } from 'crypto';

// Types for extracted information
interface ExtractedData {
  text: string;
  fields: {
    policyNumber?: string;
    claimNumber?: string;
    dateOfLoss?: string;
    estimatedAmount?: string;
    insurer?: string;
    insured?: string;
    [key: string]: string | undefined;
  };
  labels: string[];
  containsSensitiveContent: boolean;
}

// Regular expressions for finding important information
const REGEX_PATTERNS = {
  policyNumber: /policy\s*(?:#|no|number|num)[:.]?\s*([A-Z0-9-]{5,20})/i,
  claimNumber: /claim\s*(?:#|no|number|num)[:.]?\s*([A-Z0-9-]{5,20})/i,
  dateOfLoss: /(loss|incident|accident)\s*date[:.]?\s*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})/i,
  estimatedAmount: /(?:estimated|damage|claim)\s*(?:amount|cost|value|loss)[:.]?\s*[$]?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
  insurer: /(?:insurer|insurance\s*company|carrier)[:.]?\s*([A-Za-z0-9\s&]+?)(?:\.|,|\n|$)/i,
  insured: /(?:insured|policy\s*holder|customer)[:.]?\s*([A-Za-z0-9\s]+?)(?:\.|,|\n|$)/i,
};

/**
 * Analyze a document using AWS Rekognition
 * @param documentKey The S3 key of the document to analyze
 * @returns Extracted data from the document
 */
export async function analyzeDocument(documentKey: string): Promise<ExtractedData> {
  try {
    // Get the file from S3
    const { Body, ContentType } = await s3Client.send(
      new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: documentKey,
      })
    );

    if (!Body) {
      throw new Error('Document body is empty');
    }

    // Convert the file to a buffer
    const buffer = await streamToBuffer(Body as any);

    // Only process images and PDFs
    const isImage = ContentType?.startsWith('image/');
    const isPDF = ContentType === 'application/pdf';

    if (!isImage && !isPDF) {
      throw new Error('Document type not supported for analysis');
    }

    // Detect text in the document
    const textResults = await rekognitionClient.send(
      new DetectTextCommand({
        Image: {
          Bytes: buffer,
        },
      })
    );

    // Extract detected text
    const text = (textResults.TextDetections || [])
      .filter(item => item.Type === 'LINE')
      .map(item => item.DetectedText)
      .filter(Boolean)
      .join('\n');

    // Extract fields using regex patterns
    const fields: ExtractedData['fields'] = {};
    
    // Apply regex patterns to extract structured information
    for (const [fieldName, pattern] of Object.entries(REGEX_PATTERNS)) {
      const match = text.match(pattern);
      if (match && match[1]) {
        fields[fieldName] = match[1].trim();
      }
    }

    // Detect objects and scenes in the image
    const labelResults = await rekognitionClient.send(
      new DetectLabelsCommand({
        Image: {
          Bytes: buffer,
        },
        MaxLabels: 10,
        MinConfidence: 70,
      })
    );

    // Extract detected labels
    const labels = (labelResults.Labels || [])
      .map(label => label.Name as string)
      .filter(Boolean);

    // Check for sensitive content
    const moderationResults = await rekognitionClient.send(
      new DetectModerationLabelsCommand({
        Image: {
          Bytes: buffer,
        },
        MinConfidence: 60,
      })
    );

    // Determine if the document contains sensitive content
    const containsSensitiveContent = 
      (moderationResults.ModerationLabels || []).length > 0;

    // Return the extracted data
    return {
      text,
      fields,
      labels,
      containsSensitiveContent,
    };
  } catch (error) {
    console.error('Error analyzing document:', error);
    throw new Error('Failed to analyze document');
  }
}

/**
 * Helper function to convert a stream to a buffer
 */
async function streamToBuffer(stream: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk: any) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Generate a unique hash for a document based on its content
 * @param buffer The document buffer
 * @returns A hash string
 */
export function generateDocumentHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
} 