import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Plus, Building, User, MapPin, Clock, Edit, Trash, CheckCircle, XCircle, Video, Users, Code, Layout, Heart, FileText } from 'lucide-react';
import { Button } from '../components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Alert } from '../components/Alert';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingState';
import { useInterviews, InterviewInput, INTERVIEW_TYPES, INTERVIEW_STATUSES } from '../hooks/useInterviews';
import { FormInput } from '../components/FormInput';
import { TextArea } from '../components/TextArea';
import { Modal } from '../components/Modal';

export default function UpcomingInterviews() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { 
    interviews, 
    loading: interviewsLoading, 
    error: interviewsError,
    addInterview,
    updateInterview,
    deleteInterview,
    getUpcomingInterviews,
    getPastInterviews
  } = useInterviews(user?.id || null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<InterviewInput>({
    company: '',
    position: '',
    date: new Date().toISOString(),
    type: 'technical',
    status: 'scheduled',
    notes: '',
    location: '',
    interviewer: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.company.trim() || !formData.position.trim() || !formData.date) {
      setFormError('Company, position, and date are required');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = editingId
        ? await updateInterview(editingId, formData)
        : await addInterview(formData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to save interview');
      }

      setShowAddModal(false);
      setEditingId(null);
      setFormData({
        company: '',
        position: '',
        date: new Date().toISOString(),
        type: 'technical',
        status: 'scheduled',
        notes: '',
        location: '',
        interviewer: ''
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (interview: InterviewInput) => {
    setFormData(interview);
    setEditingId(interview.id);
    setShowAddModal(true);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-900/30 text-blue-400 border-blue-700/30';
      case 'completed':
        return 'bg-green-900/30 text-green-400 border-green-700/30';
      case 'cancelled':
        return 'bg-red-900/30 text-red-400 border-red-700/30';
      default:
        return 'bg-gray-900/30 text-gray-400 border-gray-700/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'technical':
        return <Code className="h-4 w-4" />;
      case 'behavioral':
        return <Users className="h-4 w-4" />;
      case 'system design':
        return <Layout className="h-4 w-4" />;
      case 'cultural':
        return <Heart className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const upcomingInterviews = getUpcomingInterviews();
  const pastInterviews = getPastInterviews();

  return (
    <div className="min-h-screen bg-[#0F121A]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Button 
          variant="ghost"
          size="sm"
          leftIcon={ArrowLeft}
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-white mb-6 transition-colors duration-200"
        >
          Back to Dashboard
        </Button>
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="bg-[#FF8A00]/20 p-2 rounded-lg">
                <Calendar className="h-6 w-6 text-[#FF8A00]" />
              </div>
              <h1 className="text-3xl font-bold text-white">Upcoming Interviews</h1>
            </div>
            <p className="text-gray-400 text-sm max-w-2xl mt-2">
              Track and manage your upcoming job interviews. Add details, notes, and preparation materials.
            </p>
          </div>
          
          <Button
            leftIcon={Plus}
            onClick={() => {
              setEditingId(null);
              setFormData({
                company: '',
                position: '',
                date: new Date().toISOString(),
                type: 'technical',
                status: 'scheduled',
                notes: '',
                location: '',
                interviewer: ''
              });
              setShowAddModal(true);
            }}
          >
            Add Interview
          </Button>
        </div>
        
        {/* Tabs Navigation */}
        <div className="flex border-b border-gray-700 mb-6">
          <button
            className={`px-6 py-3 text-lg font-medium ${activeTab === 'upcoming' ? 'text-[#FF8A00] border-b-2 border-[#FF8A00]' : 'text-gray-400 hover:text-gray-300'}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming ({upcomingInterviews.length})
          </button>
          <button
            className={`px-6 py-3 text-lg font-medium ${activeTab === 'past' ? 'text-[#FF8A00] border-b-2 border-[#FF8A00]' : 'text-gray-400 hover:text-gray-300'}`}
            onClick={() => setActiveTab('past')}
          >
            Past ({pastInterviews.length})
          </button>
        </div>
        
        {interviewsLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : interviewsError ? (
          <Alert variant="error" message={interviewsError} />
        ) : activeTab === 'upcoming' ? (
          upcomingInterviews.length === 0 ? (
            <div className="text-center py-8 bg-gray-800 rounded-lg border border-gray-700">
              <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No upcoming interviews</h3>
              <p className="text-gray-400 mb-4">Add your next interview to start tracking it.</p>
              {/* Only show Add Interview button here if we want a centered button inside the card */}
              {/* We removed the button here to avoid duplication with the one in the header */}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingInterviews.map(interview => (
                <Card key={interview.id} className="border border-gray-700 hover:border-[#FF8A00]/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-white font-medium">{interview.company}</h3>
                        <p className="text-[#FF8A00]">{interview.position}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full border text-xs ${getStatusColor(interview.status)}`}>
                        {interview.status}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-gray-300 text-sm">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDate(interview.date)}
                      </div>
                      
                      {interview.location && (
                        <div className="flex items-center text-gray-300 text-sm">
                          {interview.location.includes('zoom.us') || interview.location.includes('meet.google') ? (
                            <Video className="h-4 w-4 mr-2 text-gray-400" />
                          ) : (
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          )}
                          {interview.location}
                        </div>
                      )}
                      
                      {interview.interviewer && (
                        <div className="flex items-center text-gray-300 text-sm">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          {interview.interviewer}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-gray-700 text-gray-300`}>
                          {getTypeIcon(interview.type)}
                          {interview.type}
                        </span>
                      </div>
                    </div>
                    
                    {interview.notes && (
                      <div className="bg-gray-700/50 p-3 rounded-md mb-4">
                        <p className="text-gray-300 text-sm whitespace-pre-line">{interview.notes}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={Edit}
                        onClick={() => startEditing(interview)}
                        className="text-blue-400 hover:bg-blue-900/20"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={Trash}
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this interview?')) {
                            deleteInterview(interview.id);
                          }
                        }}
                        className="text-red-400 hover:bg-red-900/20"
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : (
          // Past interviews
          pastInterviews.length === 0 ? (
            <div className="text-center py-8 bg-gray-800 rounded-lg border border-gray-700">
              <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No past interviews</h3>
              <p className="text-gray-400">Your completed interviews will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pastInterviews.map(interview => (
                <Card key={interview.id} className="border border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-medium">{interview.company}</h3>
                        <p className="text-[#FF8A00]">{interview.position}</p>
                        <div className="text-gray-400 text-sm mt-1">
                          {formatDate(interview.date)}
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full border text-xs ${getStatusColor(interview.status)}`}>
                        {interview.status}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}
      </div>

      {/* Add/Edit Interview Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingId(null);
          setFormError(null);
        }}
        title={editingId ? 'Edit Interview' : 'Add New Interview'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              name="company"
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              label="Company"
              placeholder="Enter company name"
              icon={Building}
            />
            
            <FormInput
              name="position"
              value={formData.position}
              onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
              label="Position"
              placeholder="Enter position title"
              icon={User}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2">Date & Time</label>
              <input
                type="datetime-local"
                value={formData.date.slice(0, 16)}
                onChange={(e) => setFormData(prev => ({ ...prev, date: new Date(e.target.value).toISOString() }))}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF8A00]"
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">Interview Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF8A00]"
              >
                {INTERVIEW_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <FormInput
            name="location"
            value={formData.location || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            label="Location"
            placeholder="Enter physical address or virtual meeting link"
            icon={MapPin}
            optional
          />
          
          <FormInput
            name="interviewer"
            value={formData.interviewer || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, interviewer: e.target.value }))}
            label="Interviewer"
            placeholder="Enter interviewer's name"
            icon={User}
            optional
          />
          
          <TextArea
            name="notes"
            value={formData.notes || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            label="Notes"
            placeholder="Add any preparation notes or important details"
            optional
          />
          
          {formError && (
            <Alert variant="error" message={formError} />
          )}
          
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowAddModal(false);
                setEditingId(null);
                setFormError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
            >
              {editingId ? 'Update' : 'Add'} Interview
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}