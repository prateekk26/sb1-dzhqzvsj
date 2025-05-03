/**
 * Utility functions for handling CSV imports
 */

import type { QuestionInput } from '../hooks/useInterviewQuestions';

// Expected column names in the CSV file
export const EXPECTED_CSV_HEADERS = [
  'question_id', 
  'primary_competency_code',
  'type', 
  'difficulty', 
  'question', 
  'primary_competency', 
  'secondary_competency'
];

// Maps competency names to their codes
const COMPETENCY_NAME_TO_CODE: Record<string, string> = {
  'Critical & Structured Thinking': 'CST',
  'Adaptive Communication': 'AC',
  'Proactive Ownership & Initiative': 'POI',
  'Collaborative Influence': 'CI',
  'Growth Mindset & Curiosity': 'GMC',
  'Leadership & Strategic Vision': 'LSV',
  'Emotional Intelligence & Self-Awareness': 'EISA',
  'Execution Excellence': 'EE',
  'Verbal & Written Comprehension': 'VWC',
  'Resilience & Adaptability': 'RA',
  'Motivation & Role Alignment': 'MRA',
  'Introductory Communication': 'INT',
  'Concluding Questions': 'CON',
  'Self-Awareness & Growth Mindset': 'GMC',  // Alias
  'Emotional Intelligence': 'EISA',  // Alias
  'Leadership & Strategic Vision (senior roles only)': 'LSV',  // Alias
};

/**
 * Maps from a competency name to its code
 * @param competencyName The full competency name (e.g., "Execution Excellence")
 * @returns The corresponding competency code (e.g., "EE")
 */
export function mapCompetencyNameToCode(competencyName?: string): string | null {
  if (!competencyName) return null;
  
  // Check if we have an exact match in our mapping
  if (competencyName in COMPETENCY_NAME_TO_CODE) {
    return COMPETENCY_NAME_TO_CODE[competencyName];
  }
  
  // Check if it's a partial match (name might have additional context)
  for (const [name, code] of Object.entries(COMPETENCY_NAME_TO_CODE)) {
    if (competencyName.includes(name)) {
      return code;
    }
  }
  
  // If it's already a code format (2-4 uppercase letters), just return it
  if (/^[A-Z]{2,4}$/.test(competencyName)) {
    return competencyName;
  }
  
  return null;
}

/**
 * Validates CSV headers against expected columns
 * @param headers The headers from the CSV file
 * @returns Object with validation results
 */
export function validateCsvHeaders(headers: string[]): {
  valid: boolean;
  missingColumns: string[];
  extraColumns: string[];
} {
  const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
  const normalizedExpected = EXPECTED_CSV_HEADERS.map(h => h.toLowerCase());
  
  const missingColumns = normalizedExpected.filter(expected => 
    !normalizedHeaders.some(header => header === expected)
  );
  
  const extraColumns = normalizedHeaders.filter(header => 
    !normalizedExpected.some(expected => expected === header)
  );
  
  return {
    valid: missingColumns.length === 0,
    missingColumns,
    extraColumns
  };
}

/**
 * Parse a CSV row into an interview question object
 * @param row The CSV row data
 * @returns Interview question object with mapped fields
 */
export function parseCsvRowToInterviewQuestion(row: any[]): QuestionInput | null {
  if (!row || row.length < 5 || !row[4]) {
    return null; // Skip rows without question text
  }
  
  const primaryCompetencyCode = row[1] || null;
  
  // Convert secondary competency name to code if it's provided
  const secondaryCompetencyName = row[6] || '';
  const secondaryCompetencyCode = mapCompetencyNameToCode(secondaryCompetencyName);
  
  return {
    question_id: row[0] || null,                    // ID column
    primary_competency_code: primaryCompetencyCode, // Primary competency code
    type: row[2]?.toLowerCase() || null,            // Type column (Situational, Behavioral)
    difficulty: row[3]?.toLowerCase() || null,      // Difficulty column
    question: row[4] || '',                         // Question text
    secondary_competency_code: secondaryCompetencyCode, // Secondary competency code
    answer: null,                                   // No answer in CSV
    tags: [],                                       // No tags in CSV
    category: null                                  // No category in CSV
  };
}