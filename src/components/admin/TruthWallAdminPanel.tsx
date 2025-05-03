import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Building, 
  Briefcase, 
  Clock, 
  X, 
  Eye, 
  ThumbsUp, 
  ThumbsDown, 
  Ghost
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../Card';
import { Button } from '../Button';
import { Alert } from '../Alert';
import { LoadingSpinner } from '../LoadingState';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

// Interface for interview review
interface InterviewReview {
  id: string;
  user_id: string | null;
  session_id: string | null;
  company_name: string;
  role_title: string | null;
  stage: string;
  date_range: string | null;
  was_ghosted: boolean | null;
  interviewer_attitude: string | null;
  gave_feedback: boolean | null;
  had_assignment: boolean | null;
  assignment_duration: string | null;
  previous_salary: string | null;
  expected_salary: string | null;
  offered_salary: string | null;
  comments: string | null;
  moderation_status: string | null;
  created_at: string;
}

export function TruthWallAdminPanel() {
  const [reviews, setReviews] = useState<InterviewReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Fetch reviews
  useEffect(() => {
    async function fetchReviews() {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('interview_reviews')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setReviews(data || []);
      } catch (err) {
        console.error('Error fetching interview reviews:', err);
        setError(err instanceof Error ? err.message : 'Failed to load interview reviews');
      } finally {
        setLoading(false);
      }
    }
    
    fetchReviews();
  }, []);
  
  // Filter reviews based on search term and status filter
  const filteredReviews = reviews.filter(review => {
    const matchesStatus = statusFilter === 'all' || review.moderation_status === statusFilter;
    
    const matchesSearch = searchTerm === '' || 
      review.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (review.role_title && review.role_title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (review.comments && review.comments.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });
  
  // Approve a review
  const approveReview = async (id: string) => {
    setProcessingId(id);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('interview_reviews')
        .update({ moderation_status: 'approved' })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setReviews(prev => 
        prev.map(review => 
          review.id === id 
            ? { ...review, moderation_status: 'approved' }
            : review
        )
      );
    } catch (err) {
      console.error('Error approving review:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve review');
    } finally {
      setProcessingId(null);
    }
  };
  
  // Reject a review
  const rejectReview = async (id: string) => {
    setProcessingId(id);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('interview_reviews')
        .update({ moderation_status: 'rejected' })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setReviews(prev => 
        prev.map(review => 
          review.id === id 
            ? { ...review, moderation_status: 'rejected' }
            : review
        )
      );
    } catch (err) {
      console.error('Error rejecting review:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject review');
    } finally {
      setProcessingId(null);
    }
  };
  
  // Delete a review
  const deleteReview = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }
    
    setProcessingId(id);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('interview_reviews')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setReviews(prev => prev.filter(review => review.id !== id));
    } catch (err) {
      console.error('Error deleting review:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete review');
    } finally {
      setProcessingId(null);
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-700/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-700/30">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-400 border border-yellow-700/30">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
    }
  };
  
  // Get stage badge
  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'interview_invite':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-700/30">
            Interview Invite
          </span>
        );
      case 'hr_screen':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-700/30">
            HR Screen
          </span>
        );
      case 'test':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-900/30 text-purple-400 border border-purple-700/30">
            Test
          </span>
        );
      case 'assignment':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-900/30 text-purple-400 border border-purple-700/30">
            Assignment
          </span>
        );
      case 'interview_round_1_2':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-900/30 text-indigo-400 border border-indigo-700/30">
            Interview Round 1/2
          </span>
        );
      case 'interview_round_3_4':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-900/30 text-indigo-400 border border-indigo-700/30">
            Interview Round 3/4
          </span>
        );
      case 'interview_round_5_plus':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-900/30 text-indigo-400 border border-indigo-700/30">
            Interview Round 5/5+
          </span>
        );
      case 'got_offer':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-700/30">
            Got Offer
          </span>
        );
      case 'rejected_offer':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-700/30">
            Rejected Offer
          </span>
        );
      case 'accepted_offer':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-700/30">
            Accepted Offer
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-900/30 text-gray-400 border border-gray-700/30">
            {stage}
          </span>
        );
    }
  };
  
  return (
    <Card className="border border-gray-700 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <MessageCircle className="h-6 w-6 mr-3 text-[#FF8A00]" />
          Manage Interview Truth Wall
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {error && (
          <Alert
            variant="error"
            message={error}
            className="mb-4"
            onClose={() => setError(null)}
          />
        )}
        
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Status filter */}
          <div className="relative inline-block">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-10 pr-10 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF8A00]/50 focus:border-transparent text-base"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
          
          {/* Search input */}
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF8A00]/50 focus:border-transparent text-base"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
        
        {/* Reviews List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-700">
            <MessageCircle className="h-16 w-16 text-gray-600 mx-auto mb-6" />
            <h3 className="text-xl font-medium text-white mb-3">No reviews found</h3>
            <p className="text-gray-400 mb-6 text-lg">
              {reviews.length === 0 
                ? "There are no interview reviews in the system." 
                : "No reviews match your current filters."}
            </p>
            {reviews.length > 0 && statusFilter !== 'all' && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => setStatusFilter('all')}
              >
                View All Reviews
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredReviews.map((review) => (
              <div 
                key={review.id} 
                className="bg-gray-800 rounded-lg border border-gray-700 p-5 hover:border-[#FF8A00]/30 transition-colors shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-white font-medium text-xl">{review.company_name}</h3>
                      {review.role_title && (
                        <span className="text-[#FF8A00] text-lg">• {review.role_title}</span>
                      )}
                      {getStatusBadge(review.moderation_status)}
                      {getStageBadge(review.stage)}
                      {review.date_range && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-700 text-gray-300 border border-gray-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          {review.date_range === '0_3_months' && '0-3 months ago'}
                          {review.date_range === '3_6_months' && '3-6 months ago'}
                          {review.date_range === '6_12_months' && '6-12 months ago'}
                          {review.date_range === '12_plus_months' && '12+ months ago'}
                        </span>
                      )}
                      {review.was_ghosted && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-900/30 text-red-400 border border-red-700/30">
                          <Ghost className="h-4 w-4 mr-1" />
                          Ghosted
                        </span>
                      )}
                    </div>
                    
                    <div className="text-base text-gray-400 mb-3">
                      Submitted {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                    </div>
                    
                    {/* Review details */}
                    <div className="space-y-3 mt-4">
                      {/* Interviewer attitude */}
                      {review.interviewer_attitude && (
                        <div className="flex items-center text-base">
                          <span className="text-gray-400 mr-3 font-medium">Interviewer:</span>
                          <span className="text-white">{review.interviewer_attitude}</span>
                        </div>
                      )}
                      
                      {/* Feedback */}
                      {review.gave_feedback !== null && (
                        <div className="flex items-center text-base">
                          <span className="text-gray-400 mr-3 font-medium">Gave feedback:</span>
                          <span className={review.gave_feedback ? "text-green-400" : "text-red-400"}>
                            {review.gave_feedback ? "Yes" : "No"}
                          </span>
                        </div>
                      )}
                      
                      {/* Assignment */}
                      {review.had_assignment && (
                        <div className="flex items-center text-base">
                          <span className="text-gray-400 mr-3 font-medium">Assignment:</span>
                          <span className="text-white">
                            {review.assignment_duration === 'less_than_2_hours' && '< 2 hours'}
                            {review.assignment_duration === '2_to_6_hours' && '2-6 hours'}
                            {review.assignment_duration === 'more_than_6_hours' && '6+ hours'}
                            {!review.assignment_duration && 'Yes'}
                          </span>
                        </div>
                      )}
                      
                      {/* Salary info */}
                      {(review.previous_salary || review.expected_salary || review.offered_salary) && (
                        <div className="flex flex-wrap items-center gap-x-5 text-base">
                          {review.previous_salary && (
                            <div>
                              <span className="text-gray-400 mr-2 font-medium">Previous:</span>
                              <span className="text-white font-medium">{review.previous_salary}</span>
                            </div>
                          )}
                          {review.expected_salary && (
                            <div>
                              <span className="text-gray-400 mr-2 font-medium">Expected:</span>
                              <span className="text-white font-medium">{review.expected_salary}</span>
                            </div>
                          )}
                          {review.offered_salary && (
                            <div>
                              <span className="text-gray-400 mr-2 font-medium">Offered:</span>
                              <span className="text-white font-medium">{review.offered_salary}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Comments */}
                      {review.comments && (
                        <div className="mt-4 p-4 bg-gray-750 rounded-lg border border-gray-700">
                          <p className="text-gray-300 text-base whitespace-pre-line">{review.comments}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex sm:flex-col gap-2">
                    {review.moderation_status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={CheckCircle}
                          onClick={() => approveReview(review.id)}
                          isLoading={processingId === review.id}
                          className="text-green-400 border-green-500/30 hover:bg-green-900/20"
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={XCircle}
                          onClick={() => rejectReview(review.id)}
                          isLoading={processingId === review.id}
                          className="text-red-400 border-red-500/30 hover:bg-red-900/20"
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={X}
                      onClick={() => deleteReview(review.id)}
                      isLoading={processingId === review.id}
                      className="text-gray-400 hover:text-red-400"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}