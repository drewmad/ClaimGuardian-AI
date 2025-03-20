import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getFileUrl } from '@/lib/s3-operations';
import { DocumentList } from '@/components/documents/DocumentList';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { Layout } from '@/components/layout/Layout';

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  // Fetch all documents for the user
  const documents = await prisma.document.findMany({
    where: { userId: session.user.id },
    orderBy: { uploadDate: 'desc' },
  });

  // For each document, generate a signed URL
  const documentsWithUrls = await Promise.all(
    documents.map(async (doc) => {
      try {
        const url = await getFileUrl(doc.fileKey);
        return { ...doc, url };
      } catch (error) {
        console.error(`Error generating URL for document ${doc.id}:`, error);
        return doc; // Return without URL if there's an error
      }
    })
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-8">Documents</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Document Upload Section */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">Upload Documents</h2>
              <DocumentUpload 
                documentType="OTHER"
                onUploadComplete={() => {
                  // This will trigger a page refresh after upload
                }}
              />
            </div>
          </div>

          {/* Document List Section */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">Your Documents</h2>
              <DocumentList 
                documents={documentsWithUrls} 
                emptyMessage="You haven't uploaded any documents yet. Use the form on the left to upload your first document."
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 