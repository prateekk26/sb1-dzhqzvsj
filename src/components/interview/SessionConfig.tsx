import React, { useState, useEffect } from 'react';
import { Settings, CheckCircle, HelpCircle, Filter } from 'lucide-react';
import { Button } from '../Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../Card';
import { Alert } from '../Alert';
import { Competency } from '../../hooks/useCompetencies';

interface SessionConfigProps {
  competencies: Competency[];
  onStartSession: (config: SessionConfigOptions) => void;
  loading: boolean;
}

export interface SessionConfigOptions {
  numQuestions: number;
  selectedCompetencies: string[];
  sessionDuration: number; // in seconds
  questionDuration: number; // in seconds
}

export function SessionConfig({ competencies, onStartSession, loading }: SessionConfigProps) {
  // Change the default question duration to 3 minutes (180 seconds)
  const defaultQuestionDuration = 3 * 60; // 3 minutes in seconds
  const defaultSessionDuration = 30 * 60; // 30 minutes in seconds
  
  // Calculate how many questions can fit in the session (default to 30/3 = 10 questions)
  const maxQuestions = Math.floor(defaultSessionDuration / defaultQuestionDuration);
  
  const [numQuestions, setNumQuestions] = useState(Math.min(6, maxQuestions));
  const [selectedCompetencies, setSelectedCompetencies] = useState<string[]>([]);
  const [sessionDuration, setSessionDuration] = useState(defaultSessionDuration);
  const [questionDuration, setQuestionDuration] = useState(defaultQuestionDuration);
  const [filterTerm, setFilterTerm] = useState("");

  // Recalculate numQuestions whenever session or question duration changes
  useEffect(() => {
    const maxPossible = Math.floor(sessionDuration / questionDuration);
    // If current numQuestions is greater than possible, adjust it down
    if (numQuestions > maxPossible) {
      setNumQuestions(maxPossible);
    }
  }, [sessionDuration, questionDuration, numQuestions]);
  
  const handleCompetencyToggle = (code: string) => {
    setSelectedCompetencies(prevSelected => {
      if (prevSelected.includes(code)) {
        return prevSelected.filter(c => c !== code);
      } else {
        return [...prevSelected, code];
      }
    });
  };

  const handleStartSession = () => {
    onStartSession({
      numQuestions,
      selectedCompetencies: selectedCompetencies.length > 0 ? selectedCompetencies : [], // Empty array means "any competency"
      sessionDuration,
      questionDuration
    });
  };

  // Group competencies by category
  const groupedCompetencies: Record<string, Competency[]> = {};
  competencies.forEach(comp => {
    if (!groupedCompetencies[comp.category]) {
      groupedCompetencies[comp.category] = [];
    }
    groupedCompetencies[comp.category].push(comp);
  });
  
  // Filter competencies if search term exists
  const filteredGroups: Record<string, Competency[]> = {};
  if (filterTerm) {
    Object.entries(groupedCompetencies).forEach(([category, comps]) => {
      const filtered = comps.filter(comp => 
        comp.name.toLowerCase().includes(filterTerm.toLowerCase()) ||
        comp.code.toLowerCase().includes(filterTerm.toLowerCase()) ||
        comp.definition.toLowerCase().includes(filterTerm.toLowerCase())
      );
      if (filtered.length > 0) {
        filteredGroups[category] = filtered;
      }
    });
  } else {
    Object.assign(filteredGroups, groupedCompetencies);
  }

  // Calculate max possible questions
  const maxPossibleQuestions = Math.floor(sessionDuration / questionDuration);

  return (
    <Card className="border border-gray-700 animate-fadeIn">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="h-5 w-5 mr-2 text-[#FF8A00]" />
          Interview Session Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert 
          variant="info" 
          message="Customize your interview session by selecting the number of questions and specific competencies you want to focus on."
          className="mb-4"
        />
        
        <div className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Number of Questions</label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min={1}
                max={maxPossibleQuestions}
                step={1}
                value={numQuestions}
                onChange={e => setNumQuestions(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="bg-gray-700 px-3 py-1 rounded text-white w-8 text-center">{numQuestions}</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              Maximum {maxPossibleQuestions} questions possible with {sessionDuration / 60} minute session and {questionDuration / 60} minute per question
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-white font-medium mb-2">Session Duration</label>
              <div className="bg-gray-800 px-3 py-2 rounded border border-gray-700">
                <span className="text-blue-400">{sessionDuration / 60} minutes</span> per session
              </div>
            </div>
            
            <div>
              <label className="block text-white font-medium mb-2">Question Time Limit</label>
              <div className="bg-gray-800 px-3 py-2 rounded border border-gray-700">
                <span className="text-blue-400">{questionDuration / 60} minutes</span> per question
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-white font-medium">Competencies</label>
              <div className="text-sm text-gray-400">
                Selected: {selectedCompetencies.length > 0 ? selectedCompetencies.length : "All"}
              </div>
            </div>
            
            <div className="mb-3 relative">
              <input
                type="text"
                placeholder="Search competencies..."
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF8A00]/50 pl-10 pr-4"
              />
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
            
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 max-h-64 overflow-y-auto">
              {Object.entries(filteredGroups).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(filteredGroups).map(([category, comps]) => (
                    <div key={category}>
                      <h4 className="text-white font-medium mb-2">{category}</h4>
                      <div className="flex flex-wrap gap-2">
                        {comps.map(comp => (
                          <button
                            key={comp.code}
                            onClick={() => handleCompetencyToggle(comp.code)}
                            className={`px-3 py-1.5 rounded-full text-sm ${
                              selectedCompetencies.includes(comp.code)
                                ? 'bg-[#FF8A00]/20 text-[#FF8A00] border border-[#FF8A00]/40'
                                : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                            } transition-colors flex items-center`}
                            title={comp.definition}
                          >
                            {selectedCompetencies.includes(comp.code) && (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            )}
                            <span>{comp.code} - {comp.name}</span>
                            <HelpCircle
                              className="h-3 w-3 ml-1 text-gray-400 hover:text-white"
                              title={comp.definition}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">
                  {filterTerm ? "No matching competencies found" : "Loading competencies..."}
                </p>
              )}
              
              {selectedCompetencies.length === 0 && (
                <div className="mt-2 text-xs text-gray-400">
                  <p>No competencies selected. All competencies will be used.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t border-gray-700 pt-4 flex justify-end">
        <Button
          onClick={handleStartSession}
          isLoading={loading}
          disabled={loading}
          size="lg"
          className="w-full sm:w-auto"
        >
          Begin Session ({numQuestions} questions)
        </Button>
      </CardFooter>
    </Card>
  );
}