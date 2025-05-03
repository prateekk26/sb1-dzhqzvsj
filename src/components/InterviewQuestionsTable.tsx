import React, { useState } from 'react';
import { Edit, Trash, Plus, Tag, Filter, ChevronDown, ChevronUp, X, Search, InfoIcon, Lock } from 'lucide-react';
import { 
  InterviewQuestion, 
  QuestionInput,
  DifficultyLevel,
  DIFFICULTY_LEVELS,
  QUESTION_TYPES
} from '../hooks/useInterviewQuestions';
import { Button } from './Button';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { TextArea } from './TextArea';
import { FormInput } from './FormInput';
import { useCompetencies } from '../hooks/useCompetencies';
import { Alert } from './Alert';
import { LoadingSpinner } from './LoadingState';

interface InterviewQuestionsTableProps {
  questions: InterviewQuestion[];
  loading: boolean;
  error: string | null;
  onAdd: (question: QuestionInput) => Promise<{ success: boolean; error: string | null }>;
  onUpdate: (id: string, updates: Partial<QuestionInput>) => Promise<{ success: boolean; error: string | null }>;
  onDelete: (id: string) => Promise<{ success: boolean; error: string | null }>;
  showAddForm?: boolean;
  setShowAddForm?: (show: boolean) => void;
  isAdmin?: boolean;
  className?: string;
}

export function InterviewQuestionsTable({
  questions,
  loading,
  error,
  onAdd,
  onUpdate,
  onDelete,
  showAddForm = false,
  setShowAddForm,
  isAdmin = false,
  className = '',
}: InterviewQuestionsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);
  const [competencyFilter, setCompetencyFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<QuestionInput>({
    question: '',
    primary_competency_code: null,
    secondary_competency_code: null,
    difficulty: null,
    question_id: null,
    type: null
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { competencies } = useCompetencies();

  const startEditing = (question: InterviewQuestion) => {
    setFormData({
      question: question.question,
      primary_competency_code: question.primary_competency_code,
      secondary_competency_code: question.secondary_competency_code,
      difficulty: question.difficulty,
      question_id: question.question_id,
      type: question.type
    });
    setEditingId(question.id);
    if (setShowAddForm) {
      setShowAddForm(true);
    }
  };

  const cancelForm = () => {
    setFormData({
      question: '',
      primary_competency_code: null,
      secondary_competency_code: null,
      difficulty: null,
      question_id: null,
      type: null
    });
    setEditingId(null);
    setFormError(null);
    if (setShowAddForm) {
      setShowAddForm(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.question.trim()) {
      setFormError('Question is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = editingId
        ? await onUpdate(editingId, formData)
        : await onAdd(formData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to save question');
      }

      cancelForm();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter questions based on search terms and selected filters
  const filteredQuestions = questions.filter(q => {
    if (difficultyFilter && q.difficulty !== difficultyFilter) return false;
    
    if (competencyFilter && 
       (q.primary_competency_code !== competencyFilter && 
        q.secondary_competency_code !== competencyFilter)) {
      return false;
    }
    
    if (typeFilter && q.type !== typeFilter) return false;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesQuestion = q.question.toLowerCase().includes(term);
      const matchesID = q.question_id?.toLowerCase().includes(term);
      
      return matchesQuestion || matchesID;
    }
    
    return true;
  });

  // Get all unique values for filters
  const uniquePrimaryCompetencies = [...new Set(questions.map(q => q.primary_competency_code).filter(Boolean))];
  const uniqueSecondaryCompetencies = [...new Set(questions.map(q => q.secondary_competency_code).filter(Boolean))];
  const uniqueCompetencies = [...new Set([...uniquePrimaryCompetencies, ...uniqueSecondaryCompetencies])];
  const uniqueTypes = [...new Set(questions.map(q => q.type).filter(Boolean))];

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className={className}>
      <div className="mb-6 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF8A00]/50 focus:border-transparent"
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
          
          <div className="relative inline-block">
            <select
              value={typeFilter || ''}
              onChange={(e) => setTypeFilter(e.target.value || null)}
              className="appearance-none pl-10 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF8A00]/50 focus:border-transparent"
            >
              <option value="">All Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
              {uniqueTypes.length === 0 && QUESTION_TYPES.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>
          
          <div className="relative inline-block">
            <select
              value={difficultyFilter || ''}
              onChange={(e) => setDifficultyFilter(e.target.value || null)}
              className="appearance-none pl-10 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF8A00]/50 focus:border-transparent"
            >
              <option value="">All Difficulties</option>
              {DIFFICULTY_LEVELS.map(level => (
                <option key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>
            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>
          
          <div className="relative inline-block">
            <select
              value={competencyFilter || ''}
              onChange={(e) => setCompetencyFilter(e.target.value || null)}
              className="appearance-none pl-10 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF8A00]/50 focus:border-transparent"
            >
              <option value="">All Competencies</option>
              {uniqueCompetencies.map(code => {
                const comp = competencies.find(c => c.code === code);
                return (
                  <option key={code} value={code}>
                    {code} - {comp?.name || code}
                  </option>
                );
              })}
            </select>
            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>
          
          {(difficultyFilter || competencyFilter || typeFilter || searchTerm) && (
            <button 
              onClick={() => {
                setDifficultyFilter(null);
                setCompetencyFilter(null);
                setTypeFilter(null);
                setSearchTerm('');
              }}
              className="py-2 px-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-600 hover:text-white flex items-center gap-1 transition-colors"
            >
              <X size={16} />
              Clear filters
            </button>
          )}
        </div>
        
        {isAdmin && (
          <Button
            variant={showAddForm ? "secondary" : "primary"}
            leftIcon={showAddForm ? Edit : Plus}
            onClick={() => setShowAddForm && setShowAddForm(!showAddForm)}
          >
            {showAddForm ? (editingId ? "Editing Question" : "Cancel") : "Add Question"}
          </Button>
        )}
      </div>
      
      {showAddForm && (
        <Card className="mb-6 border border-gray-700 animate-fadeIn">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Question' : 'Add New Question'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  name="question_id"
                  value={formData.question_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, question_id: e.target.value }))}
                  label="Question ID"
                  placeholder="e.g., CST-1"
                  icon={InfoIcon}
                  optional
                  helpText="Unique identifier for this question (optional)"
                />
              </div>
              
              <TextArea
                name="question"
                value={formData.question}
                onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                label="Question"
                placeholder="Enter interview question"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">Type</label>
                  <select
                    value={formData.type || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value || null }))}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF8A00]"
                  >
                    <option value="">Select Type</option>
                    {QUESTION_TYPES.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2">Difficulty</label>
                  <select
                    value={formData.difficulty || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value || null }))}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF8A00]"
                  >
                    <option value="">Select Difficulty</option>
                    {DIFFICULTY_LEVELS.map(level => (
                      <option key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">Primary Competency</label>
                  <select
                    value={formData.primary_competency_code || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, primary_competency_code: e.target.value || null }))}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF8A00]"
                  >
                    <option value="">Select Primary Competency</option>
                    {competencies.map(comp => (
                      <option key={comp.code} value={comp.code}>
                        {comp.code} - {comp.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2">Secondary Competency</label>
                  <select
                    value={formData.secondary_competency_code || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, secondary_competency_code: e.target.value || null }))}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF8A00]"
                  >
                    <option value="">Select Secondary Competency</option>
                    {competencies.map(comp => (
                      <option key={comp.code} value={comp.code}>
                        {comp.code} - {comp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {formError && (
                <Alert variant="error" message={formError} />
              )}
              
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={cancelForm}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={!formData.question.trim()}
                >
                  {editingId ? 'Update' : 'Save'} Question
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <Alert variant="error" message={error} />
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-8 bg-gray-800 rounded-lg border border-gray-700">
          <div className="mx-auto h-12 w-12 text-gray-600 mb-4">❓</div>
          <h3 className="text-lg font-medium text-white mb-2">No questions found</h3>
          <p className="text-gray-400 mb-4">
            {questions.length === 0 
              ? "There aren't any interview questions in the database yet." 
              : "No questions match your current filters."}
          </p>
          {questions.length === 0 && isAdmin ? (
            <Button onClick={() => setShowAddForm && setShowAddForm(true)} leftIcon={Plus}>
              Add Your First Question
            </Button>
          ) : (
            <Button 
              onClick={() => {
                setDifficultyFilter(null);
                setCompetencyFilter(null);
                setTypeFilter(null);
                setSearchTerm('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Showing {filteredQuestions.length} of {questions.length} questions
          </p>
          
          <div className="overflow-hidden border border-gray-700 rounded-lg bg-gray-800">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Question
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">
                    Competencies
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredQuestions.map(question => (
                  <React.Fragment key={question.id}>
                    <tr 
                      className={`hover:bg-gray-750 transition-colors cursor-pointer ${
                        expandedId === question.id ? 'bg-gray-750' : ''
                      }`}
                      onClick={() => toggleExpand(question.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="mr-2">
                            {expandedId === question.id ? (
                              <ChevronUp size={16} className="text-gray-400" />
                            ) : (
                              <ChevronDown size={16} className="text-gray-400" />
                            )}
                          </div>
                          <div>
                            {question.question_id && (
                              <span className="inline-block mr-2 px-2 py-0.5 text-xs rounded bg-gray-700 text-gray-300">
                                {question.question_id}
                              </span>
                            )}
                            <div className="text-sm font-medium text-white line-clamp-1">{question.question}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {question.primary_competency_code && (
                            <span className="px-2 py-1 text-xs rounded-full bg-[#FF8A00]/20 text-[#FF8A00]">
                              {question.primary_competency_code}
                            </span>
                          )}
                          
                          {question.secondary_competency_code && (
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-900/20 text-blue-300">
                              {question.secondary_competency_code}
                            </span>
                          )}
                          
                          {question.difficulty && (
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              question.difficulty === 'easy' 
                                ? 'bg-green-900/30 text-green-400' 
                                : question.difficulty === 'medium'
                                  ? 'bg-yellow-900/30 text-yellow-400'
                                  : 'bg-red-900/30 text-red-400'
                            }`}>
                              {question.difficulty}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        {isAdmin ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={Edit}
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(question);
                              }}
                              className="mr-2 text-blue-400 hover:bg-blue-900/20"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={Trash}
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (window.confirm('Are you sure you want to delete this question?')) {
                                  await onDelete(question.id);
                                }
                              }}
                              className="text-red-400 hover:bg-red-900/20"
                            >
                              Delete
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled
                            className="opacity-50 pointer-events-none"
                          >
                            <Lock size={14} className="mr-1" /> Admin Only
                          </Button>
                        )}
                      </td>
                    </tr>
                    {expandedId === question.id && (
                      <tr className="bg-gray-750">
                        <td colSpan={4} className="px-8 py-4">
                          <div className="pl-6 space-y-4">
                            <div className="space-y-2">
                              <h4 className="text-white font-medium">Question:</h4>
                              <p className="text-gray-300">{question.question}</p>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                              <div>
                                <h5 className="text-sm text-gray-400 font-medium mb-1">Question ID</h5>
                                {question.question_id ? (
                                  <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded">{question.question_id}</span>
                                ) : (
                                  <span className="text-gray-500">Not specified</span>
                                )}
                              </div>
                              
                              <div>
                                <h5 className="text-sm text-gray-400 font-medium mb-1">Type</h5>
                                {question.type ? (
                                  <span className="px-2 py-1 bg-purple-900/20 text-purple-300 rounded">{question.type}</span>
                                ) : (
                                  <span className="text-gray-500">Not specified</span>
                                )}
                              </div>
                              
                              <div>
                                <h5 className="text-sm text-gray-400 font-medium mb-1">Difficulty</h5>
                                {question.difficulty ? (
                                  <span className={`px-2 py-1 text-sm rounded-md ${
                                    question.difficulty === 'easy' 
                                      ? 'bg-green-900/30 text-green-400' 
                                      : question.difficulty === 'medium'
                                        ? 'bg-yellow-900/30 text-yellow-400'
                                        : 'bg-red-900/30 text-red-400'
                                  }`}>
                                    {question.difficulty}
                                  </span>
                                ) : (
                                  <span className="text-gray-500">Not specified</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <h5 className="text-sm text-gray-400 font-medium mb-1">Primary Competency</h5>
                                {question.primary_competency_code ? (
                                  <div className="flex items-center">
                                    <span className="px-2 py-1 text-sm rounded-md bg-[#FF8A00]/20 text-[#FF8A00] font-mono">
                                      {question.primary_competency_code}
                                    </span>
                                    <span className="ml-2 text-sm text-gray-300">
                                      {competencies.find(c => c.code === question.primary_competency_code)?.name || ''}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-gray-500">Not specified</span>
                                )}
                              </div>
                              
                              <div>
                                <h5 className="text-sm text-gray-400 font-medium mb-1">Secondary Competency</h5>
                                {question.secondary_competency_code ? (
                                  <div className="flex items-center">
                                    <span className="px-2 py-1 text-sm rounded-md bg-blue-900/20 text-blue-300 font-mono">
                                      {question.secondary_competency_code}
                                    </span>
                                    <span className="ml-2 text-sm text-gray-300">
                                      {competencies.find(c => c.code === question.secondary_competency_code)?.name || ''}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-gray-500">Not specified</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}