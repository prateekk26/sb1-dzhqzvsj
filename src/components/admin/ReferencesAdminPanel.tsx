import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Send, CheckCircle, XCircle, ExternalLink, Search, Filter, Clock, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../Card';
import { Button } from '../Button';
import { Alert } from '../Alert';
import { LoadingSpinner, ContentLoading } from '../LoadingState';
import { ProcessingIndicator } from '../LoadingIndicator';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

// Interface for admin view of references
interface AdminReference {
  id: string;
  user_id: string;
  referee_name: string;
  referee_email: string;
  referee_phone: string | null;
  relationship: string;
  company: string;
  linkedin_url: string | null;
  status: 'pending' | 'sent' | 'completed' | 'declined';
  feedback: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  completed_at: string | null;
  user_email: string;
  user_full_name: string;
}

export function ReferencesAdminPanel() {
  const navigate = useNavigate();
  const [references, setReferences] = useState<AdminReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [sendingStep, setSendingStep] = useState(0);
  const sendingSteps = [
    { name: 'Preparing request', description: 'Setting up the reference request' },
    { name: 'Generating token', description: 'Creating a secure access token' },
    { name: 'Sending email', description: 'Sending the request to the referee' },
    { name: 'Updating status', description: 'Updating the reference status' }
  ];
  
  // Fetch references with user data
  useEffect(() => {
    async function fetchReferences() {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase.rpc('get_all_references_with_users');
        
        if (error) throw error;
        
        setReferences(data || []);
      } catch (err) {
        console.error('Error fetching references:', err);
        setError(err instanceof Error ? err.message : 'Failed to load references');
      } finally {
        setLoading(false);
      }
    }
    
    fetchReferences();
  }, []);
  
  // Filter references based on status and search term
  const filteredReferences = references.filter(ref => {
    const matchesStatus = statusFilter === 'all' || ref.status === statusFilter;
    
    const matchesSearch = searchTerm === '' || 
      ref.referee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.referee_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ref.user_full_name && ref.user_full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });
  
  // Send reference request email
  const sendReferenceRequest = async (reference: AdminReference) => {
    setProcessingId(reference.id);
    setError(null);
    setSendingStep(0);
    
    // Simulate step progression
    const stepInterval = setInterval(() => {
      setSendingStep(prev => {
        if (prev >= sendingSteps.length - 1) {
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    
    try {
      console.log('Sending reference request for:', reference.id);
      
      // Call the edge function to send the reference request email
      const { data, error } = await supabase.functions.invoke('send-reference-request', {
        body: { referenceId: reference.id }
      });
      
      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Failed to send a request to the Edge Function: ${error.message || 'Unknown error'}`);
      }
      
      // Check if we got a successful response
      if (!data?.success) {
        const errorMessage = data?.error || 'Failed to send reference request';
        console.error('Edge function returned error:', errorMessage);
        throw new Error(errorMessage);
      }
      
      // Update local state
      setReferences(prev => 
        prev.map(ref => 
          ref.id === reference.id 
            ? { ...ref, status: 'sent', sent_at: new Date().toISOString() }
            : ref
        )
      );
      
    } catch (err) {
      console.error('Error sending reference request:', err);
      setError(err instanceof Error ? err.message : 'Failed to send request');
    } finally {
      setProcessingId(null);
      clearInterval(stepInterval);
      setSendingStep(sendingSteps.length - 1);
    }
  };
  
  // Verify reference feedback
  const verifyReference = async (reference: AdminReference, approved: boolean) => {
    setProcessingId(reference.id);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('references')
        .update({ 
          status: approved ? 'completed' : 'declined',
          completed_at: new Date().toISOString()
        })
        .eq('id', reference.id);
      
      if (error) throw error;
      
      // Update local state
      setReferences(prev => 
        prev.map(ref => 
          ref.id === reference.id 
            ? { 
                ...ref, 
                status: approved ? 'completed' : 'declined',
                completed_at: new Date().toISOString()
              }
            : ref
        )
      );
      
    } catch (err) {
      console.error('Error verifying reference:', err);
      setError(err instanceof Error ? err.message : 'Failed to update reference');
    } finally {
      setProcessingId(null);
    }
  };
  
  return (
    <Card className="border border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <UserCheck className="h-5 w-5 mr-2 text-[#FF8A00]" />
            <span>Manage References</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert
            variant="error"
            message={error}
            className="mb-4"
            onClose={() => setError(null)}
          />
        )}
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Status filter */}
          <div className="relative inline-block">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-10 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF8A00]/50 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="completed">Completed</option>
              <option value="declined">Declined</option>
            </select>
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>
          
          {/* Search input */}
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search references..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF8A00]/50 focus:border-transparent"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        
        {/* References List */}
        {loading ? (
          <ContentLoading 
            message="Loading references..." 
            icon={<UserCheck className="h-8 w-8 text-[#FF8A00] animate-pulse" />} 
          />
        ) : filteredReferences.length === 0 ? (
          <div className="text-center py-8 bg-gray-800/50 rounded-lg border border-gray-700">
            <UserCheck className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No references found</h3>
            <p className="text-gray-400 mb-4">
              {references.length === 0 
                ? "There are no reference requests in the system." 
                : "No references match your current filters."}
            </p>
            {references.length > 0 && statusFilter !== 'all' && (
              <Button
                variant="outline"
                onClick={() => setStatusFilter('all')}
              >
                View All References
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Referee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Requested By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Relationship
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                {filteredReferences.map((reference) => (
                  <tr key={reference.id} className="hover:bg-gray-750">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">{reference.referee_name}</div>
                        <div className="text-sm text-gray-400">{reference.referee_email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">{reference.user_full_name || 'Unknown'}</div>
                        <div className="text-sm text-gray-400">{reference.user_email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {reference.relationship} at {reference.company}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={reference.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                      {formatDistanceToNow(new Date(reference.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {reference.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={Send}
                          onClick={() => sendReferenceRequest(reference)}
                          isLoading={processingId === reference.id}
                          className="text-blue-400 border-blue-500/30 hover:bg-blue-900/20"
                        >
                          Send Request
                        </Button>
                      )}
                      
                      {/* Show processing steps when sending */}
                      {processingId === reference.id && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
                            <ProcessingIndicator
                              title="Sending Reference Request"
                              steps={sendingSteps}
                              currentStep={sendingStep}
                            />
                          </div>
                        </div>
                      )}
                      
                      {reference.status === 'sent' && (
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={Clock}
                          disabled
                          className="text-yellow-400 border-yellow-500/30"
                        >
                          Awaiting Response
                        </Button>
                      )}
                      
                      {reference.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={ExternalLink}
                          onClick={() => navigate(`/admin/references/${reference.id}`)}
                          className="text-green-400 border-green-500/30 hover:bg-green-900/20"
                        >
                          View Feedback
                        </Button>
                      )}
                      
                      {reference.status === 'declined' && (
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={XCircle}
                          disabled
                          className="text-red-400 border-red-500/30"
                        >
                          Declined
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusInfo = {
    pending: { icon: Clock, className: 'bg-yellow-900/30 text-yellow-400 border-yellow-700/30' },
    sent: { icon: Send, className: 'bg-blue-900/30 text-blue-400 border-blue-700/30' },
    completed: { icon: CheckCircle, className: 'bg-green-900/30 text-green-400 border-green-700/30' },
    declined: { icon: XCircle, className: 'bg-red-900/30 text-red-400 border-red-700/30' }
  }[status as 'pending' | 'sent' | 'completed' | 'declined'] || { 
    icon: Clock, 
    className: 'bg-gray-900/30 text-gray-400 border-gray-700/30' 
  };

  const Icon = statusInfo.icon;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${statusInfo.className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}