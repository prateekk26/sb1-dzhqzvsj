import React, { useEffect, useState } from 'react';
import { FileText, Briefcase, Copy, Check, Sparkles, RefreshCw, Trash } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingState';
import { Alert } from './Alert';
import { supabase } from '../lib/supabase';

interface Project {
  id: string;
  title: string;
  raw_input: string;
  enhanced_description?: string;
  company_name?: string;
  experience_id: string;
  impact_statement?: string;
}

interface Experience {
  id: string;
  company: string;
  role: string;
}

interface ProjectWithExperience extends Project {
  company: string;
  role: string;
}

interface ProjectImpactStatementsProps {
  userId: string;
  className?: string;
  showCard?: boolean;
  onClose?: () => void;
}

export function ProjectImpactStatements({ userId, className = '', showCard = true, onClose }: ProjectImpactStatementsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectWithExperience[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch all projects with their experience info
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        // First get all experiences
        const { data: experiences, error: expError } = await supabase
          .from('experiences')
          .select('id, company, role')
          .eq('user_id', userId);
        
        if (expError) throw expError;
        
        // Then get all projects
        const { data: allProjects, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', userId);
        
        if (projectsError) throw projectsError;
        
        // Map experiences to projects
        const projectsWithCompany = allProjects.map(project => {
          const experience = experiences.find(exp => exp.id === project.experience_id);
          return {
            ...project,
            company: experience?.company || 'Unknown Company',
            role: experience?.role || 'Unknown Role'
          };
        });
        
        // Sort by company name
        projectsWithCompany.sort((a, b) => a.company.localeCompare(b.company));
        
        setProjects(projectsWithCompany);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Failed to load projects. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    if (userId) {
      fetchData();
    }
  }, [userId, refreshTrigger]);

  // Copy impact statement to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Generate impact statement for a project
  const generateImpactStatement = async (project: ProjectWithExperience) => {
    if (!project.id) return;
    
    setGeneratingId(project.id);
    
    try {
      let statement = '';
      
      try {
        // Try to use the edge function if available
        const { data, error } = await supabase.functions.invoke('generate-impact-statement', {
          body: { projectId: project.id }
        });
        
        if (error) {
          throw new Error(error.message);
        }
        
        if (data?.impact_statement) {
          statement = data.impact_statement;
          console.log("Generated impact statement via edge function:", statement);
        } else {
          throw new Error("No impact statement returned");
        }
      } catch (edgeFunctionError) {
        console.warn("Edge function failed, using fallback:", edgeFunctionError);
        
        // Client-side generation using project data (fallback)
        const projectText = project.enhanced_description || project.raw_input;
        
        // Simple template-based generation with focus on brevity
        const verbs = ['Led', 'Delivered', 'Improved', 'Increased', 'Reduced', 'Created', 'Implemented', 'Developed', 'Launched', 'Optimized'];
        const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];
        
        // Extract key metrics if they exist (numbers with % or $)
        let metrics = '';
        const percentMatch = projectText.match(/\d+(\.\d+)?%/);
        const dollarMatch = projectText.match(/\$\d+(\,\d+)?(\.\d+)?/);
        const numberMatch = projectText.match(/\b\d+(\.\d+)?\b/);
        
        if (percentMatch) {
          metrics = ` resulting in ${percentMatch[0]} improvement`;
        } else if (dollarMatch) {
          metrics = ` saving ${dollarMatch[0]}`;
        } else if (numberMatch) {
          metrics = ` affecting ${numberMatch[0]} users`;
        }
        
        // Create a concise impact statement (max 100 chars)
        const words = projectText.split(' ').slice(0, 6).join(' ');
        statement = `${randomVerb} ${words}${metrics}`;
        
        // Trim to reasonable length if needed
        if (statement.length > 100) {
          statement = statement.substring(0, 97) + '...';
        }
      }
      
      if (statement) {
        // Update the project with the impact statement
        await supabase
          .from('projects')
          .update({ impact_statement: statement })
          .eq('id', project.id);
        
        // Refresh the list to show the new statement
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error generating impact statement:', err);
    } finally {
      setGeneratingId(null);
    }
  };

  // Regenerate all missing impact statements
  const generateAllStatements = async () => {
    const projectsWithoutStatements = projects.filter(p => !p.impact_statement);
    
    if (projectsWithoutStatements.length === 0) {
      return;
    }
    
    for (const project of projectsWithoutStatements) {
      await generateImpactStatement(project);
    }
    
    // Final refresh to show all new statements
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Regenerate a specific impact statement
  const regenerateImpactStatement = async (project: ProjectWithExperience) => {
    setGeneratingId(project.id);
    
    try {
      // Update the project with a null impact statement to force regeneration
      await supabase
        .from('projects')
        .update({ impact_statement: null })
        .eq('id', project.id);
      
      // Generate a new impact statement
      await generateImpactStatement(project);
    } catch (err) {
      console.error('Error regenerating impact statement:', err);
    } finally {
      setGeneratingId(null);
    }
  };

  // Group projects by company
  const projectsByCompany: Record<string, ProjectWithExperience[]> = {};
  projects.forEach(project => {
    if (!projectsByCompany[project.company]) {
      projectsByCompany[project.company] = [];
    }
    projectsByCompany[project.company].push(project);
  });

  const content = (
    <>
      {loading ? (
        <div className="py-8 text-center">
          <LoadingSpinner />
          <p className="mt-2 text-gray-400">Loading your projects...</p>
        </div>
      ) : error ? (
        <Alert variant="error" message={error} />
      ) : projects.length === 0 ? (
        <div className="py-6 text-center">
          <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-white mb-2">No projects found</h3>
          <p className="text-gray-400 max-w-md mx-auto mb-4">
            Add some projects to your work experiences to generate impact statements for your resume.
          </p>
          <Button onClick={() => window.location.href = '/memory'}>
            Add Projects
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-400">
              These concise statements can be copied directly into your resume as bullet points.
            </p>
            
            <Button
              variant="outline"
              size="sm"
              leftIcon={Sparkles}
              onClick={generateAllStatements}
              className="text-[#FF8A00] border-[#FF8A00]/30 hover:bg-[#FF8A00]/10"
            >
              Generate All Missing
            </Button>
          </div>
          
          {Object.entries(projectsByCompany).map(([company, companyProjects]) => (
            <div key={company} className="space-y-3">
              <h3 className="text-white font-semibold text-lg border-b border-gray-700 pb-2">
                {company}
              </h3>
              
              <div className="space-y-3">
                {companyProjects.map(project => (
                  <div key={project.id} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-[#FF8A00]/30 transition-all duration-200">
                    <div className="p-3">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-white font-medium text-sm">
                          {project.title || 'Untitled Project'}
                        </h4>
                      </div>
                      
                      {project.impact_statement ? (
                        <div className="relative group">
                          <div className="p-2.5 pr-14 bg-gray-700/50 rounded-lg border border-[#FF8A00]/20">
                            <p className="text-gray-300 text-sm">{project.impact_statement}</p>
                          </div>
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                            <button
                              onClick={() => copyToClipboard(project.impact_statement!, project.id)}
                              className="p-1.5 bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Copy to clipboard"
                            >
                              {copiedId === project.id ? (
                                <Check className="h-4 w-4 text-green-400" />
                              ) : (
                                <Copy className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                            <button
                              onClick={() => regenerateImpactStatement(project)}
                              className="p-1.5 bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Regenerate statement"
                              disabled={generatingId === project.id}
                            >
                              {generatingId === project.id ? (
                                <div className="h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <RefreshCw className="h-4 w-4 text-blue-400" />
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end mt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={Sparkles}
                            onClick={() => generateImpactStatement(project)}
                            isLoading={generatingId === project.id}
                            className="h-7 py-0 px-2 text-xs"
                          >
                            Generate Impact Statement
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  if (!showCard) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Card className={`border border-gray-700 ${className}`}>
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="flex items-center">
          <Briefcase className="h-5 w-5 mr-2 text-[#FF8A00]" />
          Project Impact Statements
        </CardTitle>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}