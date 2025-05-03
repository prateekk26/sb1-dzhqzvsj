import { enhanceProjectClientSide, formatToSTAR } from '../aiService';
import { vi } from 'vitest';

// Mock the competencies data
const mockCompetencies = [
  {
    id: '1',
    code: 'CST',
    name: 'Critical & Structured Thinking',
    definition: 'Clearly analyzing and solving problems logically',
    level_1_description: 'Basic level',
    level_2_description: 'Intermediate level',
    level_3_description: 'Advanced level',
    level_4_description: 'Expert level',
    level_5_description: 'Master level',
    assessment_type: 'Explicit',
    category: 'Intellectual'
  },
  {
    id: '2',
    code: 'POI',
    name: 'Proactive Ownership & Initiative',
    definition: 'Taking responsibility and initiating improvements without being prompted',
    level_1_description: 'Basic level',
    level_2_description: 'Intermediate level',
    level_3_description: 'Advanced level',
    level_4_description: 'Expert level',
    level_5_description: 'Master level',
    assessment_type: 'Explicit',
    category: 'Operational'
  }
];

// Mock the OpenAI API call
vi.mock('../aiService', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getCompetencyRecommendationsWithOpenAI: vi.fn().mockRejectedValue(new Error('API unavailable')),
  };
});

describe('AI Service', () => {
  describe('enhanceProjectClientSide', () => {
    test('should enhance project description with fallback methods when API fails', async () => {
      const rawText = 'I led a team that redesigned our customer dashboard, improving user engagement by 30% and reducing support tickets by 25%.';
      
      const result = await enhanceProjectClientSide(rawText, mockCompetencies);
      
      // Verify the structure of the response
      expect(result).toHaveProperty('enhancedText');
      expect(result).toHaveProperty('competencies');
      expect(result).toHaveProperty('suggestions');
      expect(result).toHaveProperty('competencyRationales');
      
      // Verify the enhanced text contains STAR format
      expect(result.enhancedText).toContain('Situation:');
      expect(result.enhancedText).toContain('Task:');
      expect(result.enhancedText).toContain('Action:');
      expect(result.enhancedText).toContain('Result:');
      
      // Verify competencies were identified
      expect(result.competencies.length).toBeGreaterThan(0);
      
      // Verify suggestions were generated
      expect(result.suggestions.length).toBeGreaterThan(0);
      
      // Verify rationales were provided for competencies
      expect(Object.keys(result.competencyRationales || {}).length).toBeGreaterThan(0);
    });

    test('should throw error when no text is provided', async () => {
      await expect(enhanceProjectClientSide('', mockCompetencies))
        .rejects
        .toThrow('Project text is required');
    });
  });

  describe('formatToSTAR', () => {
    test('should format text into STAR format', () => {
      const rawText = 'I led a team at Acme Corp to redesign the customer dashboard. We improved user engagement by 30% and reduced support tickets.';
      
      const result = formatToSTAR(rawText);
      
      expect(result).toContain('Situation:');
      expect(result).toContain('Task:');
      expect(result).toContain('Action:');
      expect(result).toContain('Result:');
    });

    test('should handle short inputs', () => {
      const rawText = 'Fixed a bug in the login system.';
      
      const result = formatToSTAR(rawText);
      
      expect(result).toContain('Situation:');
      expect(result).toContain('Task:');
      expect(result).toContain('Action:');
      expect(result).toContain('Result:');
    });

    test('should preserve metrics and numbers', () => {
      const rawText = 'Improved performance by 45% and reduced costs by $10,000.';
      
      const result = formatToSTAR(rawText);
      
      expect(result).toContain('45%');
      expect(result).toContain('$10,000');
    });
  });
});