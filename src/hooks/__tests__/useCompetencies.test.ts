import { renderHook, waitFor } from '@testing-library/react';
import { useCompetencies } from '../useCompetencies';
import { vi } from 'vitest';

// Mock the Supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation(callback => {
        return callback({
          data: [
            {
              id: '1',
              code: 'CST',
              name: 'Critical & Structured Thinking',
              assessment_type: 'Explicit',
              category: 'Intellectual',
              definition: 'Clearly analyzing and solving problems logically',
              level_1_description: 'Level 1',
              level_2_description: 'Level 2',
              level_3_description: 'Level 3',
              level_4_description: 'Level 4',
              level_5_description: 'Level 5',
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-01-01T00:00:00Z'
            },
            {
              id: '2',
              code: 'AC',
              name: 'Adaptive Communication',
              assessment_type: 'Overarching',
              category: 'Interpersonal',
              definition: 'Adjusting communication effectively to different situations',
              level_1_description: 'Level 1',
              level_2_description: 'Level 2',
              level_3_description: 'Level 3',
              level_4_description: 'Level 4',
              level_5_description: 'Level 5',
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-01-01T00:00:00Z'
            }
          ],
          error: null
        });
      })
    })
  }
}));

describe('useCompetencies Hook', () => {
  test('should fetch competencies on mount', async () => {
    const { result } = renderHook(() => useCompetencies());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.competencies).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  test('should return competency by ID', async () => {
    const { result } = renderHook(() => useCompetencies());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const competency = result.current.getCompetencyById('1');
    expect(competency).toBeDefined();
    expect(competency?.code).toBe('CST');
  });

  test('should return competency by code', async () => {
    const { result } = renderHook(() => useCompetencies());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const competency = result.current.getCompetencyByCode('AC');
    expect(competency).toBeDefined();
    expect(competency?.name).toBe('Adaptive Communication');
  });

  test('should return competencies by category', async () => {
    const { result } = renderHook(() => useCompetencies());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const competencies = result.current.getCompetenciesByCategory('Intellectual');
    expect(competencies).toHaveLength(1);
    expect(competencies[0].code).toBe('CST');
  });

  test('should return competencies by assessment type', async () => {
    const { result } = renderHook(() => useCompetencies());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const competencies = result.current.getCompetenciesByAssessmentType('Overarching');
    expect(competencies).toHaveLength(1);
    expect(competencies[0].code).toBe('AC');
  });

  test('should return unique categories', async () => {
    const { result } = renderHook(() => useCompetencies());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const categories = result.current.getCategories();
    expect(categories).toHaveLength(2);
    expect(categories).toContain('Intellectual');
    expect(categories).toContain('Interpersonal');
  });

  test('should return unique assessment types', async () => {
    const { result } = renderHook(() => useCompetencies());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const types = result.current.getAssessmentTypes();
    expect(types).toHaveLength(2);
    expect(types).toContain('Explicit');
    expect(types).toContain('Overarching');
  });
});