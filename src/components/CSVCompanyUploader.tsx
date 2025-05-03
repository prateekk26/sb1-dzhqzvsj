import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, X, FileText } from 'lucide-react';
import Papa from 'papaparse';
import { Button } from './Button';
import { Alert } from './Alert';
import { LoadingSpinner } from './LoadingState';

interface CSVCompanyUploaderProps {
  onUpload: (companies: string[]) => Promise<void>;
  onCancel?: () => void;
}

export function CSVCompanyUploader({ onUpload, onCancel }: CSVCompanyUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  
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
    
    Papa.parse(file, {
      complete: (results) => {
        try {
          // Extract company names from CSV
          const companies: string[] = [];
          
          // Check if the CSV has headers
          const hasHeaders = results.data.length > 0 && 
                            (results.data[0] as any[]).some(header => 
                              typeof header === 'string' && 
                              ['company', 'name', 'company_name', 'companyname'].includes(header.toLowerCase()));
          
          // Start from index 1 if has headers, otherwise from 0
          const startIndex = hasHeaders ? 1 : 0;
          
          // Find the company name column index
          let nameColumnIndex = 0;
          if (hasHeaders) {
            const headers = results.data[0] as string[];
            const possibleHeaderNames = ['company', 'name', 'company_name', 'companyname'];
            
            for (let i = 0; i < headers.length; i++) {
              if (possibleHeaderNames.includes(headers[i].toLowerCase())) {
                nameColumnIndex = i;
                break;
              }
            }
          }
          
          // Extract company names
          for (let i = startIndex; i < results.data.length; i++) {
            const row = results.data[i] as any[];
            if (row && row.length > nameColumnIndex) {
              const companyName = row[nameColumnIndex]?.toString().trim();
              if (companyName && companyName.length > 0) {
                companies.push(companyName);
              }
            }
          }
          
          // Remove duplicates
          const uniqueCompanies = [...new Set(companies)];
          
          setPreview(uniqueCompanies);
          setShowPreview(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error parsing CSV file');
        } finally {
          setLoading(false);
        }
      },
      error: (error) => {
        setError(`Error parsing CSV: ${error.message}`);
        setLoading(false);
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
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error uploading companies');
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
              <div className="flex items-center justify-center space-x-2">
                <LoadingSpinner />
                <span className="text-gray-300">Processing CSV file...</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-white font-medium mb-2">Preview ({preview.length} companies)</h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {preview.map((company, i) => (
                <div key={i} className="bg-gray-700 p-2 rounded">
                  <p className="text-white">{company}</p>
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
              Upload {preview.length} Companies
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
        message="CSV file should have a column named 'company' or 'name' containing company names. If no header is found, the first column will be used."
      />
    </div>
  );
}