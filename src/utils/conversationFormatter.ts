/**
 * Utility functions for formatting conversation history
 */

export interface QAPair {
  id: string;
  questionType: 'main' | 'follow-up';
  questionText: string;
  responseText: string;
  feedbackText?: string;
  timestamp: Date;
}

/**
 * Formats QA pairs into a structured conversation history string
 * @param qaPairs Array of QA pairs from the interview
 * @returns Formatted conversation string
 */
export function formatConversationHistory(qaPairs: QAPair[]): string {
  if (!qaPairs || qaPairs.length === 0) return '';
  
  return qaPairs.map((pair, index) => {
    const questionPrefix = pair.questionType === 'main' 
      ? '[Primary Question]' 
      : '[Follow-up Question]';
    
    let output = `${questionPrefix} ${pair.questionText}\n\n`;
    
    if (pair.responseText) {
      output += `[Response] ${pair.responseText}\n\n`;
    }
    
    if (pair.feedbackText) {
      output += `[Feedback] ${pair.feedbackText}\n\n`;
    }
    
    return output;
  }).join('---\n\n');
}