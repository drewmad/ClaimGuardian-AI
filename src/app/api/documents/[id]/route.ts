import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getFileUrl, deleteFile } from '@/lib/s3-operations';

// Helper function to check document ownership
async function getDocumentIfOwned(documentId: string, userId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    return null;
  }

  if (document.userId !== userId) {
    return null;
  }

  return document;
}

// GET /api/documents/[id] - Get a specific document
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get document
    const document = await getDocumentIfOwned(params.id, session.user.id);
    if (!document) {
      return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    }

    // Generate signed URL
    let url = null;
    try {
      url = await getFileUrl(document.fileKey);
    } catch (error) {
      console.error('Error generating URL:', error);
    }

    // Return document with URL
    return NextResponse.json({
      ...document,
      url,
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { message: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id] - Delete a document
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get document
    const document = await getDocumentIfOwned(params.id, session.user.id);
    if (!document) {
      return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    }

    // Delete from S3
    try {
      await deleteFile(document.fileKey);
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      // Continue with database deletion even if S3 deletion fails
    }

    // Delete from database
    await prisma.document.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { message: 'Failed to delete document' },
      { status: 500 }
    );
  }
}

// PATCH /api/documents/[id] - Update document metadata
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get document
    const document = await getDocumentIfOwned(params.id, session.user.id);
    if (!document) {
      return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    
    // Validate fields that can be updated
    const allowedUpdates = {
      documentType: body.documentType,
      description: body.description,
      policyId: body.policyId === null ? null : body.policyId,
      claimId: body.claimId === null ? null : body.claimId,
    };

    // If policyId is provided, check if it exists and belongs to the user
    if (allowedUpdates.policyId) {
      const policy = await prisma.insurancePolicy.findFirst({
        where: {
          id: allowedUpdates.policyId,
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
    if (allowedUpdates.claimId) {
      const claim = await prisma.claim.findFirst({
        where: {
          id: allowedUpdates.claimId,
          userId: session.user.id
        }
      });
      
      if (!claim) {
        return NextResponse.json({ 
          message: 'Claim not found or does not belong to the user' 
        }, { status: 404 });
      }
    }

    // Update document
    const updatedDocument = await prisma.document.update({
      where: { id: params.id },
      data: allowedUpdates,
    });

    return NextResponse.json({
      message: 'Document updated successfully',
      document: updatedDocument,
    });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { message: 'Failed to update document' },
      { status: 500 }
    );
  }
} 