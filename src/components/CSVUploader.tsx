import React, { useState } from 'react';
import { FileText, Upload, AlertCircle, Info, Check, AlertTriangle } from 'lucide-react';
import Papa from 'papaparse';
import { Button } from './Button';
import { Alert } from './Alert';
import { LoadingSpinner, FileLoading } from './LoadingState';
import { ProcessingIndicator } from './LoadingIndicator';
import { QuestionInput } from '../hooks/useInterviewQuestions';

interface CSVUploaderProps {
  onUpload: (questions: QuestionInput[]) => Promise<void>;
  onCancel?: () => void;
}

export function CSVUploader({ onUpload, onCancel }: CSVUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<QuestionInput[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const processingSteps = [
    { name: 'Parsing CSV file', description: 'Reading and validating the file format' },
    { name: 'Processing questions', description: 'Converting data to question format' },
    { name: 'Preparing preview', description: 'Generating preview of questions' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setError(null);
    parseCSV(selectedFile);
  };

  const parseCSV = (file: File) => {
    setLoading(true);
    setError(null);
    setProcessingStep(0);
    
    // Simulate step progression
    const stepInterval = setInterval(() => {
      setProcessingStep(prev => {
        if (prev >= processingSteps.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);

    Papa.parse(file, {
      complete: (results) => {
        try {
          // Skip header row and validate data
          const questions: QuestionInput[] = results.data.slice(1).map((row: any) => {
            if (!row[4]) {
              throw new Error('Missing required question text');
            }

            return {
              question: row[4],
              primary_competency_code: row[1] || null,
              secondary_competency_code: null,
              difficulty: row[3]?.toLowerCase() || null,
              question_id: row[0] || null,
              type: row[2]?.toLowerCase() || null
            };
          }).filter(Boolean);

          setPreview(questions);
          setShowPreview(true);
          setLoading(false);
          clearInterval(stepInterval);
          setProcessingStep(processingSteps.length - 1);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error parsing CSV file');
          setLoading(false);
          clearInterval(stepInterval);
        }
      },
      error: (error) => {
        setError(`Error parsing CSV: ${error.message}`);
        setLoading(false);
        clearInterval(stepInterval);
      }
    });
  };

  const handleUpload = async () => {
    if (!preview.length) return;

    setLoading(true);
    try {
      await onUpload(preview);
      setFile(null);
      setPreview([]);
      setShowPreview(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error uploading questions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!showPreview ? (
        <>
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label 
              htmlFor="csv-upload"
              className="flex flex-col items-center cursor-pointer"
            >
              <FileText className="h-12 w-12 text-gray-500 mb-4" />
              <span className="text-lg font-medium text-white mb-2">
                Choose a CSV file
              </span>
              <span className="text-sm text-gray-400">
                or drag and drop it here
              </span>
            </label>
          </div>
          
          {loading && (
            <div className="mt-4 animate-fadeIn">
              <ProcessingIndicator
                title="Processing CSV File"
                steps={processingSteps}
                currentStep={processingStep}
                error={error || undefined}
                onRetry={error ? () => parseCSV(file!) : undefined}
                className="border border-gray-700"
              />
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-white font-medium mb-2">Preview ({preview.length} questions)</h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {preview.map((q, i) => (
                <div key={i} className="bg-gray-700 p-2 rounded">
                  <p className="text-white text-sm">{q.question}</p>
                  <div className="flex gap-2 mt-1">
                    {q.question_id && (
                      <span className="text-xs bg-gray-600 text-gray-300 px-1.5 py-0.5 rounded">
                        {q.question_id}
                      </span>
                    )}
                    {q.primary_competency_code && (
                      <span className="text-xs bg-[#FF8A00]/20 text-[#FF8A00] px-1.5 py-0.5 rounded">
                        {q.primary_competency_code}
                      </span>
                    )}
                    {q.type && (
                      <span className="text-xs bg-gray-600 text-gray-300 px-1.5 py-0.5 rounded">
                        {q.type}
                      </span>
                    )}
                    {q.difficulty && (
                      <span className="text-xs bg-gray-600 text-gray-300 px-1.5 py-0.5 rounded">
                        {q.difficulty}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setFile(null);
                setPreview([]);
                setShowPreview(false);
                if (onCancel) onCancel();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              isLoading={loading}
              leftIcon={Upload}
            >
              Upload {preview.length} Questions
            </Button>
          </div>
        </div>
      )}

      {error && (
        <Alert
          variant="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      <Alert
        variant="info"
        message="CSV file should have these columns: id, competency_id, type, difficulty, text, primary_competency, secondary_competency"
      />
    </div>
  );
}