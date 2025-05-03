import React, { useState } from 'react';
import { useCompetencies, Competency } from '../hooks/useCompetencies';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { LoadingSpinner } from './LoadingState';
import { Alert } from './Alert';
import { Filter, Search, Tag, X, ChevronDown, ChevronUp } from 'lucide-react';

interface CompetencyItemProps {
  competency: Competency;
  expanded: boolean;
  onToggle: () => void;
}

const CompetencyItem: React.FC<CompetencyItemProps> = ({ competency, expanded, onToggle }) => {
  const getLevelColor = (level: number) => {
    const colors = {
      1: 'from-red-900/30 to-red-800/10 border-red-800/30',
      2: 'from-orange-900/30 to-orange-800/10 border-orange-800/30',
      3: 'from-yellow-900/30 to-yellow-800/10 border-yellow-800/30',
      4: 'from-green-900/30 to-green-800/10 border-green-800/30',
      5: 'from-emerald-900/30 to-emerald-800/10 border-emerald-800/30'
    };
    return colors[level as keyof typeof colors] || '';
  };

  return (
    <div 
      className={`bg-gray-800 rounded-lg border border-gray-700 overflow-hidden transition-all duration-300 ${
        expanded ? 'shadow-lg shadow-black/20' : 'hover:border-gray-600'
      }`}
    >
      <div 
        className="p-4 cursor-pointer flex justify-between items-start"
        onClick={onToggle}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#FF8A00]/20 text-[#FF8A00] px-2 py-0.5 rounded text-xs font-mono">
              {competency.code}
            </span>
            <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-xs">
              {competency.category}
            </span>
            <span className="bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded text-xs">
              {competency.assessment_type}
            </span>
          </div>
          <h3 className="text-white font-medium">{competency.name}</h3>
          <p className="text-gray-400 text-sm mt-1">{competency.definition}</p>
        </div>
        <div className="text-gray-400">
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>
      
      {expanded && (
        <div className="pb-4 px-4 animate-fadeIn">
          <h4 className="text-sm font-medium text-gray-300 mb-3 mt-1">Assessment Levels:</h4>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(level => (
              <div 
                key={level} 
                className={`p-3 rounded-md bg-gradient-to-r ${getLevelColor(level)} border`}
              >
                <div className="flex items-center mb-1">
                  <span className="text-white font-semibold text-sm">Level {level}</span>
                </div>
                <p className="text-sm text-gray-300">
                  {competency[`level_${level}_description` as keyof Competency] as string}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export function CompetencyList() {
  const { 
    competencies, 
    loading, 
    error,
    getCategories, 
    getAssessmentTypes 
  } = useCompetencies();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const categories = getCategories();
  const assessmentTypes = getAssessmentTypes();
  
  const filteredCompetencies = competencies.filter(competency => {
    const matchesSearch = searchTerm === '' || 
      competency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      competency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      competency.definition.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = selectedCategory === null || competency.category === selectedCategory;
    const matchesType = selectedType === null || competency.assessment_type === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  });
  
  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory(null);
    setSelectedType(null);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Competencies Framework</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search and filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search competencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF8A00]/50 focus:border-transparent"
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
          
          <div className="flex flex-wrap gap-2">
            <div className="relative inline-block">
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="appearance-none pl-8 pr-8 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF8A00]/50 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <Tag className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
            
            <div className="relative inline-block">
              <select
                value={selectedType || ''}
                onChange={(e) => setSelectedType(e.target.value || null)}
                className="appearance-none pl-8 pr-8 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF8A00]/50 focus:border-transparent"
              >
                <option value="">All Types</option>
                {assessmentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <Filter className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
            
            {(selectedCategory || selectedType || searchTerm) && (
              <button 
                onClick={clearFilters}
                className="py-2 px-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-600 flex items-center gap-1"
              >
                <X size={16} />
                Clear filters
              </button>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <Alert
            variant="error"
            message={error}
          />
        ) : filteredCompetencies.length === 0 ? (
          <div className="text-center py-8 bg-gray-800/50 rounded-lg">
            <Filter className="mx-auto h-10 w-10 text-gray-500 mb-3" />
            <h3 className="text-lg font-medium text-white mb-1">No competencies found</h3>
            <p className="text-gray-400 mb-4">Try adjusting your search or filters</p>
            <button 
              onClick={clearFilters}
              className="py-2 px-4 bg-[#FF8A00] hover:bg-[#E67A00] text-white rounded-lg transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mb-2 text-sm text-gray-400">
              Showing {filteredCompetencies.length} of {competencies.length} competencies
            </div>
            {filteredCompetencies.map(competency => (
              <CompetencyItem 
                key={competency.id}
                competency={competency}
                expanded={expandedId === competency.id}
                onToggle={() => handleToggle(competency.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}