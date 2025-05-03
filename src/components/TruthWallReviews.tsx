import React, { useState } from 'react';
import { 
  MessageCircle, 
  Search, 
  Filter, 
  Building, 
  Briefcase, 
  Ghost, 
  Calendar,
  X, 
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Button } from './Button';
import { Alert } from './Alert';
import { LoadingSpinner } from './LoadingState';
import { useTruthWall, InterviewReview } from '../hooks/useTruthWall';
import { formatDistanceToNow } from 'date-fns';

export function TruthWallReviews() {
  const { reviews, loading, error } = useTruthWall();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  
  // Filter reviews based on search term and stage filter
  const filteredReviews = reviews.filter(review => {
    const matchesStage = stageFilter === 'all' || review.stage === stageFilter;
    
    const matchesSearch = searchTerm === '' || 
      review.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (review.role_title && review.role_title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (review.comments && review.comments.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStage && matchesSearch;
  });
  
  // Get stage badge
  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'interview_invite':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-900/30 text-blue-400 border border-blue-700/30">
            Interview Invite
          </span>
        );
      case 'hr_screen':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-900/30 text-blue-400 border border-blue-700/30">
            HR Screen
          </span>
        );
      case 'test':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-900/30 text-purple-400 border border-purple-700/30">
            Test
          </span>
        );
      case 'assignment':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-900/30 text-purple-400 border border-purple-700/30">
            Assignment
          </span>
        );
      case 'interview_round_1_2':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-900/30 text-indigo-400 border border-indigo-700/30">
            Interview Round 1/2
          </span>
        );
      case 'interview_round_3_4':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-900/30 text-indigo-400 border border-indigo-700/30">
            Interview Round 3/4
          </span>
        );
      case 'interview_round_5_plus':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-900/30 text-indigo-400 border border-indigo-700/30">
            Interview Round 5/5+
          </span>
        );
      case 'got_offer':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-900/30 text-green-400 border border-green-700/30">
            Got Offer
          </span>
        );
      case 'rejected_offer':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-900/30 text-red-400 border border-red-700/30">
            Rejected Offer
          </span>
        );
      case 'accepted_offer':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-900/30 text-green-400 border border-green-700/30">
            Accepted Offer
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-900/30 text-gray-400 border border-gray-700/30">
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
          Real Interview Experiences
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {error && (
          <Alert
            variant="error"
            message={error}
            className="mb-4"
            onClose={() => {}}
          />
        )}
        
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Stage filter */}
          <div className="relative inline-block">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="appearance-none pl-10 pr-10 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF8A00]/50 focus:border-transparent text-base"
            >
              <option value="all">All Stages</option>
              <option value="interview_invite">Interview Invite</option>
              <option value="hr_screen">HR Screen</option>
              <option value="test">Test</option>
              <option value="assignment">Assignment</option>
              <option value="interview_round_1_2">Interview Round 1/2</option>
              <option value="interview_round_3_4">Interview Round 3/4</option>
              <option value="interview_round_5_plus">Interview Round 5/5+</option>
              <option value="got_offer">Got Offer</option>
              <option value="rejected_offer">Rejected Offer</option>
              <option value="accepted_offer">Accepted Offer</option>
            </select>
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
          
          {/* Search input */}
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search companies or roles..."
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
                ? "Be the first to share your interview experience!" 
                : "No reviews match your current filters."}
            </p>
            {reviews.length > 0 && (stageFilter !== 'all' || searchTerm !== '') && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setStageFilter('all');
                  setSearchTerm('');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredReviews.map((review) => (
              <ReviewCard key={review.id} review={review} getStageBadge={getStageBadge} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Review card component
interface ReviewCardProps {
  review: InterviewReview;
  getStageBadge: (stage: string) => React.ReactNode;
}

function ReviewCard({ review, getStageBadge }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div 
      className="bg-gray-800 rounded-lg border border-gray-700 p-5 hover:border-[#FF8A00]/30 transition-colors cursor-pointer shadow-md hover:shadow-lg"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h3 className="text-white font-medium text-xl">{review.company_name}</h3>
            {review.role_title && (
              <span className="text-[#FF8A00] text-lg">• {review.role_title}</span>
            )}
            {review.date_range && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-700 text-gray-300 border border-gray-600">
                <Calendar className="h-4 w-4 mr-1" />
                {review.date_range === '0_3_months' && '0-3 months ago'}
                {review.date_range === '3_6_months' && '3-6 months ago'}
                {review.date_range === '6_12_months' && '6-12 months ago'}
                {review.date_range === '12_plus_months' && '12+ months ago'}
              </span>
            )}
            {getStageBadge(review.stage)}
            {review.was_ghosted && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-900/30 text-red-400 border border-red-700/30">
                <Ghost className="h-4 w-4 mr-1" />
                Ghosted
              </span>
            )}
          </div>
          
          <div className="text-base text-gray-400 mb-3">
            Posted {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
          </div>
          
          {/* Preview of comments */}
          {review.comments && !expanded && (
            <p className="text-gray-300 text-base line-clamp-2">
              {review.comments}
            </p>
          )}
          
          {/* Expanded details */}
          {expanded && (
            <div className="space-y-4 mt-4 animate-fade-in">
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
          )}
        </div>
        
        {/* Expand/collapse indicator */}
        <div className="text-gray-400 p-1">
          {expanded ? (
            <ChevronUp size={24} />
          ) : (
            <ChevronDown size={24} />
          )}
        </div>
      </div>
    </div>
  );
}