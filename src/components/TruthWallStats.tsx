import React from 'react';
import { 
  Ghost, 
  Award, 
  Hash, 
  Flame, 
  Building
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { useTruthWall } from '../hooks/useTruthWall';

// Increase the size of the cards and make them more prominent
export function TruthWallStats() {
  const { 
    topGhosters, 
    respectfulCompanies, 
    popularTags, 
    loading 
  } = useTruthWall();
  
  // Render the Ghoster Hall of Shame card
  const renderGhosterCard = () => (
    <Card className="border border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:border-red-500/30 transition-colors shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-xl">
          <Ghost className="h-6 w-6 mr-3 text-red-400" />
          <span>Ghoster Hall of Shame</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-4">
          {topGhosters.map((company, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-3 rounded-lg bg-gray-750 border border-gray-700 hover:border-red-500/30 transition-colors"
            >
              <div className="flex items-center">
                <span className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded-full text-sm font-bold mr-3">
                  {index + 1}
                </span>
                <span className="text-white font-medium text-lg">{company.company_name}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-300 mr-2 text-lg font-semibold">{company.ghost_count}</span>
                {company.trend === 'up' && (
                  <Flame className="h-5 w-5 text-red-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
  
  // Render the Most Respectful Panels card
  const renderRespectfulCard = () => (
    <Card className="border border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:border-green-500/30 transition-colors shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-xl">
          <Award className="h-6 w-6 mr-3 text-green-400" />
          <span>Most Respectful Panels</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-5">
          {respectfulCompanies.map((company, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium text-lg">{company.company_name}</span>
                <span className="text-green-400 font-bold text-xl">{company.respect_score}%</span>
              </div>
              <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${company.respect_score}%` }}
                ></div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {company.tags?.map((tag, tagIndex) => (
                  <span 
                    key={tagIndex} 
                    className="bg-green-900/30 text-green-300 px-3 py-1 rounded-full text-sm border border-green-700/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
  
  // Render the Tags Wordcloud card
  const renderTagsCard = () => (
    <Card className="border border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:border-blue-500/30 transition-colors shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-xl">
          <Hash className="h-6 w-6 mr-3 text-blue-400" />
          <span>Real Tags. Real People.</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="flex flex-wrap gap-3 justify-center py-6">
          {popularTags.map((tag, index) => {
            // Calculate size based on count (1-5)
            const size = Math.max(1, Math.min(5, Math.floor(tag.count / 100) + 1));
            // Determine color based on sentiment
            const colorClass = tag.sentiment === 'positive' 
              ? 'bg-green-900/30 text-green-300 border-green-700/50' 
              : tag.sentiment === 'negative'
                ? 'bg-red-900/30 text-red-300 border-red-700/50'
                : 'bg-blue-900/30 text-blue-300 border-blue-700/50';
            
            return (
              <div 
                key={index} 
                className={`px-4 py-2 rounded-full border ${colorClass} cursor-pointer transition-transform hover:scale-110 group relative`}
                style={{ fontSize: `${0.85 + (size * 0.15)}rem` }}
              >
                {tag.tag}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {tag.count} mentions
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
  
  return (
    <div className="space-y-6">
      {renderGhosterCard()}
      {renderRespectfulCard()}
      {renderTagsCard()}
    </div>
  );
}