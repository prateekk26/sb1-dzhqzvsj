import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Competency {
  id: string;
  code: string;
  name: string;
  assessment_type: string;
  category: string;
  level_1_description: string;
  level_2_description: string;
  level_3_description: string;
  level_4_description: string;
  level_5_description: string;
  definition: string;
  created_at: string;
  updated_at: string;
}

export function useCompetencies() {
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCompetencies() {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('competencies')
          .select('*')
          .order('category', { ascending: true })
          .order('name', { ascending: true });

        if (error) {
          throw error;
        }

        setCompetencies(data || []);
      } catch (err) {
        console.error('Error fetching competencies:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch competencies');
      } finally {
        setLoading(false);
      }
    }

    fetchCompetencies();
  }, []);

  const getCompetencyById = (id: string): Competency | undefined => {
    return competencies.find(competency => competency.id === id);
  };

  const getCompetencyByCode = (code: string): Competency | undefined => {
    return competencies.find(competency => competency.code === code);
  };

  const getCompetenciesByCategory = (category: string): Competency[] => {
    return competencies.filter(competency => competency.category === category);
  };

  const getCompetenciesByAssessmentType = (type: string): Competency[] => {
    return competencies.filter(competency => competency.assessment_type === type);
  };

  const getCategories = (): string[] => {
    return [...new Set(competencies.map(competency => competency.category))];
  };

  const getAssessmentTypes = (): string[] => {
    return [...new Set(competencies.map(competency => competency.assessment_type))];
  };

  return {
    competencies,
    loading,
    error,
    getCompetencyById,
    getCompetencyByCode,
    getCompetenciesByCategory,
    getCompetenciesByAssessmentType,
    getCategories,
    getAssessmentTypes
  };
}