import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { uploadFile } from '@/lib/s3-operations';

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
];

export async function POST(request: Request) {
  try {
    // 1. Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    // Check if file exists
    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }
    
    // 3. Validate file
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        message: `File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
      }, { status: 400 });
    }
    
    // Check file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        message: 'File type not allowed. Allowed types: ' + ALLOWED_MIME_TYPES.join(', ') 
      }, { status: 400 });
    }
    
    // 4. Get additional metadata
    const documentType = formData.get('documentType') as string;
    const policyId = formData.get('policyId') as string | null;
    const claimId = formData.get('claimId') as string | null;
    const description = formData.get('description') as string | null;
    
    // Validate document type
    if (!documentType) {
      return NextResponse.json({ message: 'Document type is required' }, { status: 400 });
    }
    
    // If policyId is provided, check if it exists and belongs to the user
    if (policyId) {
      const policy = await prisma.insurancePolicy.findFirst({
        where: {
          id: policyId,
          userId: session.user.id
        }
      });
      
      if (!policy) {
        return NextResponse.json({ 
          message: 'Policy not found or does not belong to the user' 
        }, { status: 404 });
      }
    }
    
    // If claimId is provided, check if it exists and belongs to the user
    if (claimId) {
      const claim = await prisma.claim.findFirst({
        where: {
          id: claimId,
          userId: session.user.id
        }
      });
      
      if (!claim) {
        return NextResponse.json({ 
          message: 'Claim not found or does not belong to the user' 
        }, { status: 404 });
      }
    }
    
    // 5. Upload file to S3
    const { key, url } = await uploadFile(file, session.user.id, documentType.toLowerCase());
    
    // 6. Store document metadata in the database
    const document = await prisma.document.create({
      data: {
        fileName: file.name,
        fileKey: key,
        fileType: file.type,
        fileSize: file.size,
        documentType: documentType as any, // Cast to enum type
        description: description || undefined,
        userId: session.user.id,
        policyId: policyId || undefined,
        claimId: claimId || undefined,
      }
    });
    
    // 7. Return document data with temporary URL
    return NextResponse.json({
      message: 'File uploaded successfully',
      id: document.id,
      fileName: document.fileName,
      url: url,
      fileType: document.fileType,
      documentType: document.documentType,
      uploadDate: document.uploadDate,
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ 
      message: 'Failed to upload document' 
    }, { status: 500 });
  }
} 