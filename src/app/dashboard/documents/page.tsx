'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchDocuments();
  }, [filter]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/documents?status=${filter}`);
      const data = await response.json();
      setDocuments(data.data || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/documents/${userId}/approve`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchDocuments();
      }
    } catch (error) {
      console.error('Failed to approve document:', error);
    }
  };

  const handleReject = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/documents/${userId}/reject`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchDocuments();
      }
    } catch (error) {
      console.error('Failed to reject document:', error);
    }
  };

  const getVerificationStatus = (doc: any) => {
    if (doc.verificationStatus === 'approved') {
      return <Badge className="bg-green-500">Approved</Badge>;
    } else if (doc.verificationStatus === 'rejected') {
      return <Badge className="bg-red-500">Rejected</Badge>;
    } else {
      return <Badge className="bg-yellow-500">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">KYC Documents Verification</h1>
        <p className="text-gray-600 mt-2">Manage user document verification and KYC status</p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => setFilter('pending')}
          variant={filter === 'pending' ? 'default' : 'outline'}
        >
          Pending
        </Button>
        <Button
          onClick={() => setFilter('approved')}
          variant={filter === 'approved' ? 'default' : 'outline'}
        >
          Approved
        </Button>
        <Button
          onClick={() => setFilter('rejected')}
          variant={filter === 'rejected' ? 'default' : 'outline'}
        >
          Rejected
        </Button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8">No documents found</div>
        ) : (
          documents.map((doc: any) => (
            <Card key={doc._id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{doc.userName}</CardTitle>
                    <CardDescription>{doc.userEmail}</CardDescription>
                  </div>
                  {getVerificationStatus(doc)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Document Type</p>
                      <p className="text-sm text-gray-600">{doc.documentType}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">User Type</p>
                      <p className="text-sm text-gray-600">{doc.userRole}</p>
                    </div>
                  </div>

                  {doc.documentUrls && doc.documentUrls.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Documents</p>
                      <div className="grid grid-cols-2 gap-2">
                        {doc.documentUrls.map((url: string, idx: number) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Document {idx + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {doc.verificationStatus === 'pending' && (
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => handleApprove(doc.userId)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleReject(doc.userId)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
