import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, X, UserCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/Card';
import { Button } from '../components/Button';
import { TextArea } from '../components/TextArea';
import { Alert } from '../components/Alert';
import { LoadingSpinner } from '../components/LoadingState';
import { supabase } from '../lib/supabase';

interface ReferenceQuestion {
  id: string;
  question: string;
  sort_order: number;
}

interface ReferenceToken {
  reference_id: string;
  expires_at: string;
}

export default function ReferenceFeedback() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referenceData, setReferenceData] = useState<any>(null);
  const [questions, setQuestions] = useState<ReferenceQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [generalFeedback, setGeneralFeedback] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Validate token and fetch reference data
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError('Missing reference token');
        setLoading(false);
        return;
      }
      
      try {
        // Check if token is valid
        const { data: tokenData, error: tokenError } = await supabase
          .from('reference_tokens')
          .select('reference_id, expires_at')
          .eq('token', token)
          .single();
        
        if (tokenError || !tokenData) {
          throw new Error('Invalid or expired reference token');
        }
        
        const tokenInfo = tokenData as ReferenceToken;
        
        // Check if token has expired
        if (new Date(tokenInfo.expires_at) < new Date()) {
          throw new Error('This reference request has expired');
        }
        
        // Fetch reference data
        const { data: referenceData, error: refError } = await supabase
          .from('references')
          .select(`
            id, 
            referee_name, 
            referee_email, 
            relationship, 
            company,
            status,
            user_id (
              id,
              profiles:users_profile (
                first_name,
                last_name
              )
            )
          `)
          .eq('id', tokenInfo.reference_id)
          .single();
        
        if (refError || !referenceData) {
          throw new Error('Could not find reference data');
        }
        
        // Check if reference is already completed
        if (referenceData.status === 'completed' || referenceData.status === 'declined') {
          throw new Error('This reference has already been submitted');
        }
        
        setReferenceData(referenceData);
        
        // Fetch reference questions
        const { data: questionData, error: qError } = await supabase
          .from('reference_questions')
          .select('*')
          .eq('active', true)
          .order('sort_order', { ascending: true });
        
        if (qError) {
          console.error('Error fetching questions:', qError);
        } else {
          setQuestions(questionData || []);
          
          // Initialize answers object
          const initialAnswers: Record<string, string> = {};
          questionData.forEach((q: ReferenceQuestion) => {
            initialAnswers[q.id] = '';
          });
          setAnswers(initialAnswers);
        }
        
      } catch (err) {
        console.error('Error validating token:', err);
        setError(err instanceof Error ? err.message : 'Failed to validate reference request');
      } finally {
        setLoading(false);
      }
    }
    
    validateToken();
  }, [token]);
  
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate answers
    const unansweredQuestions = questions.filter(q => !answers[q.id]?.trim());
    if (unansweredQuestions.length > 0) {
      setError(`Please answer all questions before submitting`);
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Save each answer
      const answerPromises = questions.map(question => 
        supabase.from('reference_answers').insert({
          reference_id: referenceData.id,
          question_id: question.id,
          answer: answers[question.id]
        })
      );
      
      await Promise.all(answerPromises);
      
      // Update reference status and feedback
      await supabase
        .from('references')
        .update({ 
          status: 'completed',
          feedback: generalFeedback,
          completed_at: new Date().toISOString()
        })
        .eq('id', referenceData.id);
      
      // Show success message
      setShowSuccess(true);
      
    } catch (err) {
      console.error('Error submitting reference feedback:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit reference feedback');
    } finally {
      setSubmitting(false);
    }
  };
  
  const getUserFullName = () => {
    if (!referenceData?.user_id?.profiles) return 'the candidate';
    const profile = referenceData.user_id.profiles[0];
    if (!profile) return 'the candidate';
    return `${profile.first_name} ${profile.last_name}`;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F121A] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <LoadingSpinner />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-[#0F121A] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <Card className="border border-red-500/50">
            <CardHeader>
              <CardTitle className="flex items-center text-red-500">
                <X className="h-5 w-5 mr-2" />
                Reference Request Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert
                variant="error"
                message={error}
                className="mb-4"
              />
              <p className="text-gray-400 text-center">
                If you believe this is an error, please contact the person who requested the reference.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[#0F121A] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <Card className="border border-green-500/50">
            <CardHeader>
              <CardTitle className="flex items-center text-green-500">
                <CheckCircle className="h-5 w-5 mr-2" />
                Reference Submitted Successfully
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="bg-green-900/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Thank You!</h2>
              <p className="text-gray-300 mb-4">
                Your reference for {getUserFullName()} has been submitted successfully. Your feedback is valuable and will help them in their job search.
              </p>
              <p className="text-gray-400 text-sm">
                You can now close this window.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#0F121A] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="border border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserCheck className="h-5 w-5 mr-2 text-[#FF8A00]" />
              Professional Reference for {getUserFullName()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <p className="text-gray-300">
                <strong className="text-white">{referenceData.referee_name}</strong>, you have been asked to provide a professional reference for <strong className="text-white">{getUserFullName()}</strong>, who worked with you as a <strong className="text-[#FF8A00]">{referenceData.relationship}</strong> at <strong className="text-[#FF8A00]">{referenceData.company}</strong>.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {questions.map((question) => (
                <div key={question.id} className="space-y-2">
                  <label className="block text-white font-medium">
                    {question.question}
                  </label>
                  <TextArea
                    name={`question_${question.id}`}
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    label=""
                    rows={3}
                    placeholder="Your answer..."
                  />
                </div>
              ))}
              
              <div className="space-y-2">
                <label className="block text-white font-medium">
                  Additional Comments or Feedback
                </label>
                <TextArea
                  name="generalFeedback"
                  value={generalFeedback}
                  onChange={(e) => setGeneralFeedback(e.target.value)}
                  label=""
                  rows={4}
                  placeholder="Any additional comments or feedback you'd like to share..."
                  optional
                />
              </div>
              
              {error && (
                <Alert
                  variant="error"
                  message={error}
                  onClose={() => setError(null)}
                />
              )}
              
              <CardFooter className="px-0 justify-end">
                <Button
                  type="submit"
                  isLoading={submitting}
                  disabled={submitting}
                >
                  Submit Reference
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}