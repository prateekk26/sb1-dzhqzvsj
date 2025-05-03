import React, { useState } from 'react';
import { Award, ChevronDown, ChevronUp, Sparkles, AlertTriangle, CheckCircle, Lightbulb, Clipboard, Check, Calendar, BookOpen } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';
import { Button } from './Button';
import { SuggestionItem } from './SuggestionItem';
import { useSuggestionsStore } from '../hooks/useSuggestionsStore';
import { AcceptedSuggestions } from './AcceptedSuggestions';
import { SuggestionParser, parseSuggestion } from './SuggestionParser';

interface ScoreBreakdownItem {
  score: number;
  comment: string;
  "What works": string[];
  "Improve": string[];
}

interface ScoreBreakdown {
  quantified_impact: ScoreBreakdownItem;
  depth_of_ownership: ScoreBreakdownItem;
  growth_trajectory: ScoreBreakdownItem;
  structure_and_formatting: ScoreBreakdownItem;
  language_and_clarity: ScoreBreakdownItem;
  action_orientation: ScoreBreakdownItem;
  project_substance: ScoreBreakdownItem;
  keyword_optimization: ScoreBreakdownItem;
  brand_equity: ScoreBreakdownItem;
  academic_prestige: ScoreBreakdownItem;
  professionalism?: ScoreBreakdownItem;
}

interface ResumeAnalysisResult {
  score: number;
  breakdown: ScoreBreakdown;
  summary: string;
  suggestions: string[];
  projectOneLiners?: string[];
  experienceLevel?: string;
  weights?: Record<string, number>;
}

interface ResumeScoreCardProps {
  results: ResumeAnalysisResult;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  userId?: string;
}

// Friendly names for the breakdown categories
const categoryNames: Record<string, string> = {
  quantified_impact: "Quantified Impact",
  depth_of_ownership: "Depth of Ownership",
  growth_trajectory: "Growth Trajectory",
  structure_and_formatting: "Structure & Formatting",
  language_and_clarity: "Language & Clarity",
  action_orientation: "Action Orientation",
  project_substance: "Project Substance & Innovation",
  keyword_optimization: "Keyword Optimization",
  brand_equity: "Brand Equity of Employers",
  academic_prestige: "Academic Prestige",
  professionalism: "Professionalism"
};

// Category descriptions to explain what each category means
const categoryDescriptions: Record<string, string> = {
  quantified_impact: "Use of specific metrics (e.g., % growth, $ savings) to demonstrate accomplishments",
  depth_of_ownership: "Evidence of leading projects end-to-end and being accountable for results",
  growth_trajectory: "Clear progression in scope, responsibility, or complexity over time",
  structure_and_formatting: "Clean layout, whitespace, hierarchy, alignment, and consistent styling",
  language_and_clarity: "Correct grammar, active phrasing, clarity in achievements and actions",
  action_orientation: "Strong verbs showing initiative at the start of each bullet",
  project_substance: "Showcases creativity, analytical thinking, and business relevance",
  keyword_optimization: "Inclusion of relevant skills, tools, and domain keywords for ATS",
  brand_equity: "Experience in prestigious or high-performing companies",
  academic_prestige: "Degrees from elite or top-ranking institutions"
};

// Default category weights (used as fallback if dynamic weights aren't provided)
const defaultCategoryWeights: Record<string, number> = {
  quantified_impact: 0.15,
  depth_of_ownership: 0.15,
  growth_trajectory: 0.12,
  structure_and_formatting: 0.10,
  language_and_clarity: 0.10,
  action_orientation: 0.10,
  project_substance: 0.08,
  keyword_optimization: 0.07,
  brand_equity: 0.07,
  academic_prestige: 0.06,
  professionalism: 0.00
};

export function ResumeScoreCard({ results, onRefresh, isRefreshing, userId }: ResumeScoreCardProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showCategoryDescriptions, setShowCategoryDescriptions] = useState(false);
  const [showSavedSuggestions, setShowSavedSuggestions] = useState(false);
  
  const { 
    acceptedCount,
    getAcceptedSuggestions,
    acceptSuggestion,
    rejectSuggestion
  } = useSuggestionsStore(userId);
  
  // Get weights from results or use defaults
  const weights = results.weights || defaultCategoryWeights;
  
  // Calculate color based on score
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400";
    if (score >= 6) return "text-yellow-400";
    return "text-red-400";
  };
  
  // Get background color for score pill
  const getScoreBgColor = (score: number) => {
    if (score >= 8) return "bg-green-900/30 text-green-400 border-green-700/50";
    if (score >= 6) return "bg-yellow-900/30 text-yellow-400 border-yellow-700/50";
    return "bg-red-900/30 text-red-400 border-red-700/50";
  };
  
  // Get icon for score
  const getScoreIcon = (score: number) => {
    if (score >= 8) return <CheckCircle className="h-5 w-5 text-green-400" />;
    if (score >= 6) return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
    return <AlertTriangle className="h-5 w-5 text-red-400" />;
  };
  
  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };
  
  // Handle copying project one-liner
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Format percentage (0.15 -> 15%)
  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(0)}%`;
  };
  
  // Map experience level to a human-readable format
  const formatExperienceLevel = (level?: string) => {
    if (!level) return "Unknown";
    
    switch(level) {
      case "0-2": return "Early Career (0-2 years)";
      case "3-6": return "Mid Career (3-6 years)";
      case "7+": return "Experienced (7+ years)";
      default: return level;
    }
  };
  
  // Sort categories by weight (highest first)
  const sortedCategories = Object.entries(results.breakdown)
    .filter(([category]) => categoryNames[category]) // Only include recognized categories
    .filter(([category]) => category !== 'professionalism' || weights[category] > 0) // Skip professionalism if weight is 0
    .sort(([categoryA], [categoryB]) => {
      const weightA = weights[categoryA] || 0;
      const weightB = weights[categoryB] || 0;
      return weightB - weightA; // Sort descending
    });
  
  return (
    <div className="space-y-6">
      {/* If there are accepted suggestions, show notification */}
      {acceptedCount > 0 && (
        <div className="mb-4 bg-green-900/20 border border-green-600/30 rounded-lg p-3 flex justify-between items-center">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <span className="text-white">
              You have <span className="font-bold text-green-400">{acceptedCount}</span> accepted resume improvements
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSavedSuggestions(true)}
            className="text-green-400 border-green-600/30 hover:bg-green-900/20"
          >
            View Improvements
          </Button>
        </div>
      )}
      
      {/* Saved suggestions modal */}
      {showSavedSuggestions && userId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <AcceptedSuggestions
              userId={userId}
              onClose={() => setShowSavedSuggestions(false)}
            />
          </div>
        </div>
      )}
      
      {/* Overall Score Card */}
      <Card className="border border-gray-700">
        <CardHeader className="bg-gradient-to-r from-[#FF8A00]/10 to-transparent">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Award className="h-5 w-5 mr-2 text-[#FF8A00]" />
              Resume Score
            </div>
            {onRefresh && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={RefreshCw}
                onClick={onRefresh}
                isLoading={isRefreshing}
                className="text-xs"
              >
                Refresh Analysis
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <svg className="w-32 h-32" viewBox="0 0 100 100">
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke="#374151" 
                    strokeWidth="10" 
                  />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke={results.score >= 8 ? "#34D399" : results.score >= 6 ? "#FBBF24" : "#F87171"} 
                    strokeWidth="10" 
                    strokeDasharray={`${results.score * 28.26} 282.6`} 
                    strokeDashoffset="0" 
                    strokeLinecap="round" 
                    transform="rotate(-90 50 50)" 
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className={`text-3xl font-bold ${getScoreColor(results.score)}`}>
                    {results.score.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400">out of 10</span>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full border text-sm ${getScoreBgColor(results.score)}`}>
                {results.score >= 8 
                  ? 'Excellent' 
                  : results.score >= 6 
                    ? 'Good' 
                    : 'Needs Improvement'}
              </div>
              
              {/* Experience level indicator */}
              {results.experienceLevel && (
                <div className="mt-2 flex items-center text-blue-300 bg-blue-900/20 px-3 py-1 rounded-full text-sm border border-blue-800/50">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  {formatExperienceLevel(results.experienceLevel)}
                </div>
              )}
            </div>
            
            <div className="flex-1 bg-gray-800 p-4 rounded-lg border border-gray-700 max-w-xl">
              <h3 className="text-lg font-medium text-white mb-2">Professional Summary</h3>
              <p className="text-gray-300 text-sm whitespace-pre-line">{results.summary}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Suggestions Card */}
      <Card className="border border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-[#FF8A00]" />
            Improvement Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.suggestions.map((suggestion, index) => (
              <SuggestionParser 
                key={index}
                suggestion={suggestion}
                userId={userId}
              />
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Project One-Liners */}
      {results.projectOneLiners && results.projectOneLiners.length > 0 && (
        <Card className="border border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-[#FF8A00]" />
              Project Impact Statements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400 mb-4">
              These statements highlight key achievements from your selected projects. Use them as strong bullet points in your resume.
            </p>
            <ul className="space-y-3">
              {results.projectOneLiners.map((statement, index) => (
                <li 
                  key={index}
                  className="relative bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-blue-500/50 transition-colors cursor-pointer group"
                  onClick={() => copyToClipboard(statement, index)}
                >
                  <div className="flex items-start pr-8">
                    <div className="flex-shrink-0 mt-1 mr-3">
                      <BookOpen className="h-4 w-4 text-[#FF8A00]" />
                    </div>
                    <p className="text-gray-300">{statement}</p>
                  </div>
                  <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="outline" 
                      size="sm"
                      leftIcon={copiedIndex === index ? Check : Clipboard}
                      className={`h-7 py-0 px-2 text-xs ${copiedIndex === index ? 'text-green-400 border-green-500/30' : 'text-gray-400 border-gray-600'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(statement, index);
                      }}
                    >
                      {copiedIndex === index ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      {/* Detailed Breakdown */}
      <Card className="border border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Award className="h-5 w-5 mr-2 text-[#FF8A00]" />
              Detailed Breakdown
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCategoryDescriptions(!showCategoryDescriptions)}
              className="text-xs"
            >
              {showCategoryDescriptions ? 'Hide Descriptions' : 'Show Descriptions'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showCategoryDescriptions && (
            <div className="mb-4 p-3 bg-gray-800/50 border border-gray-700 rounded-lg animate-fadeIn">
              <h3 className="text-white font-medium mb-2">Resume Evaluation Categories</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {Object.entries(categoryDescriptions).map(([key, description]) => (
                  <div key={key} className="flex items-start">
                    <div className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-[#FF8A00]"></div>
                    <div className="ml-2">
                      <span className="font-medium text-white">{categoryNames[key]}:</span>
                      <span className="text-gray-300 ml-1">{description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            {sortedCategories.map(([category, details]) => {
              const weight = weights[category] || 0;
              const categoryScore = details.score * 10; // Convert 0-1 to 0-10
              
              return (
                <div 
                  key={category} 
                  className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
                >
                  <div 
                    className="flex items-center justify-between p-3 cursor-pointer"
                    onClick={() => toggleCategory(category)}
                  >
                    <div className="flex items-center">
                      <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getScoreBgColor(categoryScore)}`}
                      >
                        {getScoreIcon(categoryScore)}
                      </div>
                      <div>
                        <h3 className="text-white font-medium flex items-center">
                          {categoryNames[category]}
                          <span className="ml-2 text-xs text-blue-300 bg-blue-900/40 px-1.5 py-0.5 rounded">
                            {formatPercent(weight)}
                          </span>
                        </h3>
                        <div className="flex items-center">
                          <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden mr-2">
                            <div 
                              className={`h-full rounded-full ${
                                categoryScore >= 8 
                                  ? 'bg-green-500' 
                                  : categoryScore >= 6 
                                    ? 'bg-yellow-500' 
                                    : 'bg-red-500'
                              }`}
                              style={{ width: `${details.score * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-400">{categoryScore.toFixed(1)}/10</span>
                        </div>
                      </div>
                    </div>
                    {expandedCategories.includes(category) ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  
                  {expandedCategories.includes(category) && (
                    <div className="p-3 border-t border-gray-700 bg-gray-800/50 animate-fadeIn">
                      <p className="text-gray-300 mb-4">{details.comment}</p>
                      
                      {/* Category description */}
                      {categoryDescriptions[category] && (
                        <div className="mb-4 px-3 py-2 bg-gray-700/50 rounded-md text-sm text-blue-300 border border-gray-600">
                          <span className="block font-medium text-white">What this category measures:</span>
                          {categoryDescriptions[category]}
                        </div>
                      )}
                      
                      {/* What works */}
                      {details["What works"] && details["What works"].length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-green-400 mb-2">What Works</h4>
                          <ul className="space-y-2">
                            {details["What works"].map((item, idx) => (
                              <li key={idx} className="flex items-start">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                                <p className="text-sm text-gray-300">{item}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Needs improvement */}
                      {details["Improve"] && details["Improve"].length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-yellow-400 mb-2">Could Improve</h4>
                          <ul className="space-y-4">
                            {details["Improve"].map((item, idx) => (
                              <li key={idx}>
                                <SuggestionParser
                                  suggestion={item}
                                  category={category}
                                  userId={userId}
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
        <CardFooter className="bg-gray-800/50 border-t border-gray-700">
          <p className="text-xs text-gray-400">
            Analysis powered by OpenAI Vision API. Scoring based on experience level: {formatExperienceLevel(results.experienceLevel)}.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}