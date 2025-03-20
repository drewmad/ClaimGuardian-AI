import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { analyzeDocument } from '@/lib/document-analysis';

// POST /api/documents/[id]/analyze - Analyze a document
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get the document
    const document = await prisma.document.findUnique({
      where: {
        id: params.id,
        userId: session.user.id, // Ensure document belongs to user
      },
    });

    if (!document) {
      return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    }

    // 3. Check if document has already been analyzed
    if (document.isAnalyzed) {
      return NextResponse.json({
        message: 'Document has already been analyzed',
        extractedData: document.extractedData,
      });
    }

    // 4. Analyze the document
    try {
      const analyzedData = await analyzeDocument(document.fileKey);

      // 5. Update the document with the analyzed data
      const updatedDocument = await prisma.document.update({
        where: { id: params.id },
        data: {
          isAnalyzed: true,
          extractedData: analyzedData as any, // Prisma will store as JSON
        },
      });

      // 6. Check if document contains policy or claim data
      // and update its associations if needed
      await updateDocumentAssociations(updatedDocument, analyzedData, session.user.id);

      return NextResponse.json({
        message: 'Document analyzed successfully',
        extractedData: analyzedData,
      });
    } catch (analysisError) {
      console.error('Error analyzing document:', analysisError);
      return NextResponse.json({
        message: 'Failed to analyze document',
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in document analysis endpoint:', error);
    return NextResponse.json({
      message: 'An error occurred during document analysis',
    }, { status: 500 });
  }
}

/**
 * Helper function to update document associations based on analysis
 */
async function updateDocumentAssociations(
  document: any,
  analyzedData: any,
  userId: string
) {
  const updates: any = {};
  const { fields } = analyzedData;

  // If document has a policy number but no policy association
  if (fields.policyNumber && !document.policyId) {
    // Try to find matching policy
    const policy = await prisma.insurancePolicy.findFirst({
      where: {
        userId,
        policyNumber: fields.policyNumber,
      },
    });

    if (policy) {
      updates.policyId = policy.id;
    }
  }

  // If document has a claim number but no claim association
  if (fields.claimNumber && !document.claimId) {
    // Try to find matching claim
    const claim = await prisma.claim.findFirst({
      where: {
        userId,
        claimNumber: fields.claimNumber,
      },
    });

    if (claim) {
      updates.claimId = claim.id;
    }
  }

  // Update document if there are associations to be made
  if (Object.keys(updates).length > 0) {
    await prisma.document.update({
      where: { id: document.id },
      data: updates,
    });
  }
} 