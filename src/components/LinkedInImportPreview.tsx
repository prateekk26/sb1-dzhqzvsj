import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, MapPin, Briefcase, CheckCircle, CheckSquare, Square, X } from 'lucide-react';

export interface LinkedInExperienceData {
  companyName: string;
  title: string;
  location?: string;
  description?: string;
  dateRange?: {
    start: {
      year: number;
      month: number;
    };
    end?: {
      year: number;
      month: number;
    };
  };
  companyLogo?: string;
  employmentType?: string;
}

interface LinkedInImportPreviewProps {
  data: LinkedInExperienceData[];
  onImport?: (selectedExperiences: LinkedInExperienceData[]) => void;
  onCancel?: () => void;
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const formatDate = (year: number, month: number): string => {
  return `${monthNames[month - 1]} ${year}`;
};

const calculateDuration = (start: { year: number; month: number }, end?: { year: number; month: number }): string => {
  if (!end) return 'Present';
  
  const startDate = new Date(start.year, start.month - 1);
  const endDate = new Date(end.year, end.month - 1);
  
  const diffYears = endDate.getFullYear() - startDate.getFullYear();
  const diffMonths = endDate.getMonth() - startDate.getMonth();
  
  let totalMonths = diffYears * 12 + diffMonths;
  if (totalMonths < 0) totalMonths = 0;
  
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  
  const parts = [];
  if (years > 0) parts.push(`${years} yr${years !== 1 ? 's' : ''}`);
  if (months > 0 || parts.length === 0) parts.push(`${months} mo${months !== 1 ? 's' : ''}`);
  
  return parts.join(' ');
};

// Experience item component for cleaner code organization
const ExperienceItem: React.FC<{
  experience: LinkedInExperienceData;
  index: number;
  isSelected: boolean;
  onToggle: (index: number) => void;
}> = ({ experience, index, isSelected, onToggle }) => {
  const startDate = experience.dateRange?.start 
    ? formatDate(experience.dateRange.start.year, experience.dateRange.start.month)
    : '';
  const endDate = experience.dateRange?.end 
    ? formatDate(experience.dateRange.end.year, experience.dateRange.end.month)
    : 'Present';
  const duration = experience.dateRange?.start 
    ? calculateDuration(experience.dateRange.start, experience.dateRange?.end)
    : '';

  return (
    <div 
      className={`border rounded-lg transition-colors ${
        isSelected 
          ? 'border-[#FF8A00] bg-[#FF8A00]/10 hover:bg-[#FF8A00]/20' 
          : 'border-gray-700 bg-gray-700/50 hover:bg-gray-700'
      }`}
      onClick={() => onToggle(index)}
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onToggle(index);
          e.preventDefault();
        }
      }}
    >
      <div className="p-4">
        <div className="flex items-start">
          {/* Checkbox area */}
          <div className="flex-shrink-0 mt-1 p-1 rounded-md bg-gray-600/50 cursor-pointer">
            {isSelected ? (
              <CheckSquare className="h-5 w-5 text-[#FF8A00]" />
            ) : (
              <Square className="h-5 w-5 text-gray-400" />
            )}
          </div>

          {/* Company logo */}
          <div className="ml-3 flex-shrink-0">
            {experience.companyLogo ? (
              <img 
                src={experience.companyLogo} 
                alt={`${experience.companyName} logo`}
                className="w-12 h-12 bg-white rounded-md object-contain p-1"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-600 rounded-md flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>

          {/* Experience details */}
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-semibold text-white">{experience.title}</h3>
            <p className="text-[#FF8A00]">{experience.companyName}</p>
            
            <div className="flex flex-wrap gap-x-4 mt-1 text-sm text-gray-300">
              {experience.employmentType && (
                <span className="flex items-center">
                  <Briefcase className="h-3 w-3 mr-1" /> {experience.employmentType}
                </span>
              )}
              
              {experience.location && (
                <span className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" /> {experience.location}
                </span>
              )}
              
              {startDate && (
                <span className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" /> {startDate} - {endDate}
                </span>
              )}
              
              {duration && (
                <span className="text-white bg-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {duration}
                </span>
              )}
            </div>

            {/* Description */}
            {experience.description && (
              <div className="mt-3 max-h-[200px] overflow-y-auto pr-2 text-sm text-gray-300 whitespace-pre-line">
                {experience.description}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Empty state component
const EmptyState: React.FC = () => (
  <div className="bg-gray-800 rounded-lg p-8 text-center">
    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-white mb-2">No experiences found</h3>
    <p className="text-gray-400">We couldn't find any work experiences to import.</p>
  </div>
);

export const LinkedInImportPreview: React.FC<LinkedInImportPreviewProps> = ({ 
  data, 
  onImport, 
  onCancel 
}) => {
  const [selectedExperiences, setSelectedExperiences] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Select all experiences by default
  useEffect(() => {
    if (data?.length > 0) {
      setSelectedExperiences(data.map((_, index) => index));
      setSelectAll(true);
    } else {
      setSelectedExperiences([]);
      setSelectAll(false);
    }
  }, [data]);

  // Toggle selection of an experience
  const toggleExperienceSelection = useCallback((index: number) => {
    setSelectedExperiences(prev => {
      if (prev.includes(index)) {
        const newSelected = prev.filter(i => i !== index);
        setSelectAll(newSelected.length === data.length);
        return newSelected;
      } else {
        const newSelected = [...prev, index];
        setSelectAll(newSelected.length === data.length);
        return newSelected;
      }
    });
  }, [data?.length]);

  // Toggle all experiences
  const toggleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedExperiences([]);
      setSelectAll(false);
    } else {
      setSelectedExperiences(data?.map((_, index) => index) || []);
      setSelectAll(true);
    }
  }, [data, selectAll]);

  // Handle import
  const handleImport = useCallback(() => {
    if (onImport && selectedExperiences.length > 0) {
      const selectedItems = selectedExperiences.map(index => data[index]);
      onImport(selectedItems);
    }
  }, [data, onImport, selectedExperiences]);

  // Return empty state if no data
  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl text-white w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-700">
        <h2 className="text-2xl font-bold">Import LinkedIn Experiences</h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Select All row */}
        <div 
          className="flex items-center mb-4 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
          onClick={toggleSelectAll}
          role="checkbox"
          aria-checked={selectAll}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              toggleSelectAll();
              e.preventDefault();
            }
          }}
        >
          <div className="flex-shrink-0 mr-3 p-1 rounded-md bg-gray-600/50">
            {selectAll ? (
              <CheckSquare className="h-5 w-5 text-[#FF8A00]" />
            ) : (
              <Square className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <span className="font-medium">Select All Experiences</span>
          <span className="ml-auto text-sm text-gray-400">
            {selectedExperiences.length} of {data.length} selected
          </span>
        </div>

        {/* List of experiences */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {data.map((experience, index) => (
            <ExperienceItem
              key={index}
              experience={experience}
              index={index}
              isSelected={selectedExperiences.includes(index)}
              onToggle={toggleExperienceSelection}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-700 flex justify-end space-x-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleImport}
          disabled={selectedExperiences.length === 0}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
            selectedExperiences.length === 0
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-[#FF8A00] hover:bg-[#E67A00] text-white'
          }`}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Import Selected ({selectedExperiences.length})
        </button>
      </div>
    </div>
  );
};

