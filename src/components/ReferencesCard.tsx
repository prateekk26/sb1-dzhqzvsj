import React, { useState } from 'react';
import { Users, Plus, UserCheck, Clock, CheckCircle, XCircle, Trash, ExternalLink, Send } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Button } from './Button';
import { Alert } from './Alert';
import { ErrorHandler } from './ErrorHandler';
import { Reference, useReferences } from '../hooks/useReferences';
import { ReferenceRequestForm } from './ReferenceRequestForm';
import { LoadingSpinner } from './LoadingState';
import { formatDistanceToNow } from 'date-fns';

interface ReferencesCardProps {
  userId: string;
}

export function ReferencesCard({ userId }: ReferencesCardProps) {
  const { references, loading, error, refresh, deleteReference } = useReferences(userId);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); 
  const [retryingDelete, setRetryingDelete] = useState<string | null>(null);

  const handleRequestSubmitted = () => {
    setShowRequestForm(false);
    refresh();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this reference request?')) {
      return;
    }

    setIsDeleting(id);
    setRetryingDelete(null);
    setDeleteError(null);

    try {
      const result = await deleteReference(id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete reference request');
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsDeleting(null);
      setRetryingDelete(null);
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: Reference['status'] }) => {
    const statusMap = {
      pending: { icon: Clock, color: 'bg-yellow-900/30 text-yellow-400 border-yellow-700/30' },
      sent: { icon: Send, color: 'bg-blue-900/30 text-blue-400 border-blue-700/30' },
      completed: { icon: CheckCircle, color: 'bg-green-900/30 text-green-400 border-green-700/30' },
      declined: { icon: XCircle, color: 'bg-red-900/30 text-red-400 border-red-700/30' }
    };

    const { icon: Icon, color } = statusMap[status];

    return (
      <div className={`inline-flex items-center px-2 py-1 text-xs rounded-full border ${color}`}>
        <Icon className="h-3 w-3 mr-1" />
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </div>
    );
  };

  return (
    <Card className="border border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <UserCheck className="h-5 w-5 mr-2 text-[#FF8A00]" />
            <span>Professional References</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={Plus}
            onClick={() => setShowRequestForm(!showRequestForm)}
          >
            {showRequestForm ? 'Cancel' : 'Request Reference'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ErrorHandler
          error={deleteError}
          onClose={() => setDeleteError(null)}
          onRetry={() => {
            if (retryingDelete) {
              handleDelete(retryingDelete);
            }
          }}
          className="mb-4"
        />

        {showRequestForm ? (
          <ReferenceRequestForm
            userId={userId}
            onSuccess={handleRequestSubmitted}
            onCancel={() => setShowRequestForm(false)}
          />
        ) : (
          <>
            <Alert
              variant="info"
              message="Request professional references from former colleagues, managers, or stakeholders. Their feedback will strengthen your applications."
              className="mb-4"
            />

            {loading ? (
              <ContentLoading 
                message="Loading references..." 
                icon={<UserCheck className="h-8 w-8 text-[#FF8A00] animate-pulse" />}
                className="py-8"
              />
            ) : error ? (
              <ContentLoading 
                error={error}
                onRetry={refresh}
                className="py-8"
              />
            ) : references.length === 0 ? (
              <div className="text-center py-10 bg-gray-800/50 rounded-lg border border-gray-700">
                <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No references yet</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Professional references can significantly increase your chances of landing your dream job.
                </p>
                <Button
                  variant="primary"
                  leftIcon={Plus}
                  onClick={() => setShowRequestForm(true)}
                >
                  Request Your First Reference
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {references.map((reference) => (
                  <div
                    key={reference.id}
                    className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-medium">{reference.referee_name}</h3>
                            <StatusBadge status={reference.status} />
                          </div>
                          <p className="text-[#FF8A00]">{reference.relationship} at {reference.company}</p>
                          <div className="text-gray-400 text-sm mt-1">
                            Requested: {formatDistanceToNow(new Date(reference.created_at), { addSuffix: true })}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {reference.linkedin_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-400"
                              onClick={() => window.open(reference.linkedin_url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {reference.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:bg-red-900/20"
                              onClick={() => handleDelete(reference.id)}
                              isLoading={isDeleting === reference.id}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Completed reference content */}
                      {reference.status === 'completed' && reference.feedback && (
                        <div className="mt-3 p-3 bg-gray-750 rounded border border-green-700/30">
                          <p className="text-sm text-gray-300 italic whitespace-pre-line">
                            "{reference.feedback}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}