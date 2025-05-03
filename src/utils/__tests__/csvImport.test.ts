import { mapCompetencyNameToCode, parseCsvRowToInterviewQuestion } from '../csvImport';

describe('CSV Import Utilities', () => {
  describe('mapCompetencyNameToCode', () => {
    test('should map exact competency names to their codes', () => {
      expect(mapCompetencyNameToCode('Critical & Structured Thinking')).toBe('CST');
      expect(mapCompetencyNameToCode('Adaptive Communication')).toBe('AC');
      expect(mapCompetencyNameToCode('Execution Excellence')).toBe('EE');
    });

    test('should handle null or undefined input', () => {
      expect(mapCompetencyNameToCode(undefined)).toBeNull();
      expect(mapCompetencyNameToCode(null as unknown as string)).toBeNull();
      expect(mapCompetencyNameToCode('')).toBeNull();
    });

    test('should handle aliases', () => {
      expect(mapCompetencyNameToCode('Emotional Intelligence')).toBe('EISA');
      expect(mapCompetencyNameToCode('Self-Awareness & Growth Mindset')).toBe('GMC');
    });

    test('should return the input if it looks like a code already', () => {
      expect(mapCompetencyNameToCode('CST')).toBe('CST');
      expect(mapCompetencyNameToCode('AC')).toBe('AC');
      expect(mapCompetencyNameToCode('EE')).toBe('EE');
    });

    test('should handle partial matches', () => {
      expect(mapCompetencyNameToCode('Critical & Structured Thinking for software development')).toBe('CST');
    });
  });

  describe('parseCsvRowToInterviewQuestion', () => {
    test('should properly parse a complete CSV row', () => {
      const row = ['CST-1', 'CST', 'Situational', 'Easy', 'Sample question text', 'Critical & Structured Thinking', 'Execution Excellence'];
      
      const result = parseCsvRowToInterviewQuestion(row);
      
      expect(result).toEqual({
        question_id: 'CST-1',
        primary_competency_code: 'CST',
        type: 'situational',
        difficulty: 'easy',
        question: 'Sample question text',
        secondary_competency_code: 'EE',
        answer: null,
        tags: [],
        category: null
      });
    });

    test('should handle missing values', () => {
      const row = ['CST-2', 'CST', '', '', 'Another sample question', '', ''];
      
      const result = parseCsvRowToInterviewQuestion(row);
      
      expect(result).toEqual({
        question_id: 'CST-2',
        primary_competency_code: 'CST',
        type: null,
        difficulty: null,
        question: 'Another sample question',
        secondary_competency_code: null,
        answer: null,
        tags: [],
        category: null
      });
    });

    test('should return null for rows without question text', () => {
      const row = ['CST-3', 'CST', 'Behavioral', 'Medium', '', 'Critical Thinking', ''];
      
      const result = parseCsvRowToInterviewQuestion(row);
      
      expect(result).toBeNull();
    });

    test('should handle rows with fewer columns', () => {
      const row = ['CST-4', 'CST', 'Situational'];
      
      const result = parseCsvRowToInterviewQuestion(row);
      
      expect(result).toBeNull();
    });
  });
});