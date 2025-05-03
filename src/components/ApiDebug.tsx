import React, { useState } from 'react';
import { Button } from './Button';
import { FormInput } from './FormInput';
import { Link, Sparkles } from 'lucide-react';
import { Alert } from './Alert';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { TextArea } from './TextArea';
import { supabase } from '../lib/supabase';
import { enhanceProjectClientSide } from '../services/aiService';
import { useCompetencies } from '../hooks/useCompetencies';

interface ApiDebugProps {
  title: string;
}

export function ApiDebug({ title }: ApiDebugProps) {
  const [profileUrl, setProfileUrl] = useState('https://www.linkedin.com/in/prateek-kurkanji/');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<{ ok: boolean; status: number } | null>(null);
  const [responseKeys, setResponseKeys] = useState<string[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  
  // AI Enhancement Debug
  const [aiDebugExpanded, setAiDebugExpanded] = useState(true);
  const [projectText, setProjectText] = useState('I led a team that redesigned our customer dashboard, improving user engagement by 30% and reducing support tickets by 25%.');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiRawResponse, setAiRawResponse] = useState<string | null>(null);
  const [aiNetworkStatus, setAiNetworkStatus] = useState<{ ok: boolean; status: number } | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const { competencies } = useCompetencies();

  const testLinkedInApi = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setRawResponse(null);
    setNetworkStatus(null);
    setResponseKeys([]);
    setSelectedSection(null);
    
    try {
      console.log('Testing LinkedIn API with URL:', profileUrl);
      // Call the Edge Function directly
      const { data, error } = await supabase.functions.invoke('fetch-linkedin', {
        body: { profileUrl }
      });
      
      // Store network status information
      setNetworkStatus({ ok: !error, status: error ? 500 : 200 });
      
      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Edge function error: ${error.message || 'Unknown error'}`);
      }
      
      // Store the raw response for debugging
      const rawText = JSON.stringify(data);
      setRawResponse(rawText);
      
      // Extract top-level keys for navigation
      if (data && typeof data === 'object') {
        setResponseKeys(Object.keys(data));
      }
      
      console.log('Raw API response:', data);
      setResponse(data);
    } catch (err) {
      console.error('API Test Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const testAiEnhancement = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiResponse(null);
    setAiRawResponse(null);
    setAiNetworkStatus(null);
    setUsingFallback(false);
    
    try {
      console.log('Testing AI enhancement with text:', projectText);
      
      // Try to use the Edge Function first
      try {
        console.log('Calling Supabase Edge Function enhance-project...');
        
        const startTime = performance.now();
        const { data, error } = await supabase.functions.invoke('enhance-project', {
          body: { rawText: projectText, projectId: 'debug-test-id' },
        });
        const endTime = performance.now();
        
        const requestTime = Math.round(endTime - startTime);
        console.log(`Edge function response received in ${requestTime}ms:`, { data, error });
        
        if (error) {
          console.error('Edge function returned error:', error);
          throw new Error(error.message || 'Failed to enhance project with Edge Function');
        }
        
        if (!data) {
          console.error('No data returned from Edge Function');
          throw new Error('No data returned from the API');
        }
        
        // Store the raw response for debugging
        setAiRawResponse(JSON.stringify(data));
        setAiResponse(data);
        setAiNetworkStatus({ ok: true, status: 200 });
      } catch (edgeFunctionError) {
        console.warn('Edge Function failed, falling back to client-side processing:', edgeFunctionError);
        setUsingFallback(true);
        setAiError(`Edge Function error: ${edgeFunctionError.message}. Using client-side fallback.`);
        
        // Fall back to client-side processing
        const startTime = performance.now();
        const result = await enhanceProjectClientSide(projectText, competencies);
        const endTime = performance.now();
        
        const processTime = Math.round(endTime - startTime);
        console.log(`Client-side enhancement completed in ${processTime}ms:`, result);
        
        setAiRawResponse(JSON.stringify(result));
        setAiResponse(result);
        setAiNetworkStatus({ ok: true, status: 0 });
      }
    } catch (err) {
      console.error('AI Enhancement Error:', err);
      setAiError(err instanceof Error ? err.message : 'Unknown error occurred');
      setAiNetworkStatus({ ok: false, status: 500 });
    } finally {
      setAiLoading(false);
    }
  };

  const renderDataSection = (data: any, sectionKey: string) => {
    if (!data || !data[sectionKey]) return <p className="text-red-400">Section not found</p>;
    
    const sectionData = data[sectionKey];
    
    if (Array.isArray(sectionData)) {
      return (
        <div>
          <p className="text-green-400 mb-2">Array with {sectionData.length} items</p>
          <div className="space-y-2">
            {sectionData.map((item, idx) => (
              <div key={idx} className="border border-gray-700 rounded p-2 overflow-auto">
                <p className="text-yellow-400 font-semibold mb-1">Item {idx + 1}</p>
                <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                  {JSON.stringify(item, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <pre className="text-gray-300 text-xs whitespace-pre-wrap">
        {JSON.stringify(sectionData, null, 2)}
      </pre>
    );
  };

  return (
    <div className="space-y-8">
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{title}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Hide' : 'Show'}
            </Button>
          </CardTitle>
        </CardHeader>
        
        {expanded && (
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4 flex-col md:flex-row">
                <div className="flex-1">
                  <FormInput
                    name="profileUrl"
                    value={profileUrl}
                    onChange={(e) => setProfileUrl(e.target.value)}
                    label="LinkedIn Profile URL"
                    placeholder="e.g. https://www.linkedin.com/in/username/"
                    icon={Link}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={testLinkedInApi}
                    isLoading={loading}
                  >
                    Test API
                  </Button>
                </div>
              </div>
              
              {error && (
                <Alert 
                  variant="error" 
                  message={error} 
                  onClose={() => setError(null)}
                />
              )}
              
              {networkStatus && (
                <div className="bg-gray-700 p-3 rounded-lg text-sm">
                  <span className="font-medium text-white">Network status:</span>
                  <span className={`ml-2 ${networkStatus.ok ? 'text-green-400' : 'text-red-400'}`}>
                    {networkStatus.status} {networkStatus.ok ? 'OK' : 'Error'}
                  </span>
                </div>
              )}
              
              {responseKeys.length > 0 && response && (
                <div className="bg-gray-700 p-3 rounded-lg">
                  <p className="font-medium text-white mb-2">Response sections:</p>
                  <div className="flex flex-wrap gap-2">
                    {responseKeys.map(key => (
                      <button
                        key={key}
                        onClick={() => setSelectedSection(key)}
                        className={`px-2 py-1 text-xs rounded ${
                          selectedSection === key 
                            ? 'bg-[#FF8A00] text-white' 
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                      >
                        {key}
                        {Array.isArray(response[key]) && ` (${response[key].length})`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedSection && response && (
                <div className="bg-gray-800 p-4 rounded-lg overflow-auto max-h-96">
                  <h4 className="text-white text-sm font-semibold mb-2">Section: {selectedSection}</h4>
                  {renderDataSection(response, selectedSection)}
                </div>
              )}
              
              {rawResponse && !response && (
                <div className="bg-gray-800 p-4 rounded-lg overflow-auto max-h-96">
                  <h4 className="text-white text-sm font-semibold mb-2">Raw Response (could not parse as JSON):</h4>
                  <pre className="text-gray-300 text-xs whitespace-pre-wrap">
                    {rawResponse.length > 1000 
                      ? rawResponse.substring(0, 1000) + '... (truncated)'
                      : rawResponse
                    }
                  </pre>
                </div>
              )}
              
              {response && !selectedSection && (
                <div className="bg-gray-800 p-4 rounded-lg overflow-auto max-h-96">
                  <h4 className="text-white text-sm font-semibold mb-2">Full API Response:</h4>
                  <pre className="text-gray-300 text-xs whitespace-pre-wrap">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* AI Enhancement Debug Card */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-[#FF8A00]" />
              AI Enhancement Debug
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setAiDebugExpanded(!aiDebugExpanded)}
            >
              {aiDebugExpanded ? 'Hide' : 'Show'}
            </Button>
          </CardTitle>
        </CardHeader>
        
        {aiDebugExpanded && (
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-4">
                <TextArea
                  name="projectText"
                  value={projectText}
                  onChange={(e) => setProjectText(e.target.value)}
                  label="Project Text to Enhance"
                  placeholder="Enter a project description to test AI enhancement..."
                  rows={3}
                />
                
                <div className="flex justify-end">
                  <Button
                    onClick={testAiEnhancement}
                    isLoading={aiLoading}
                    leftIcon={Sparkles}
                  >
                    Test AI Enhancement
                  </Button>
                </div>
              </div>
              
              {aiError && (
                <Alert 
                  variant="error" 
                  message={aiError} 
                  onClose={() => setAiError(null)}
                />
              )}
              
              {aiNetworkStatus && (
                <div className="bg-gray-700 p-3 rounded-lg text-sm flex items-center justify-between">
                  <div>
                    <span className="font-medium text-white">Status:</span>
                    <span className={`ml-2 ${aiNetworkStatus.ok ? 'text-green-400' : 'text-red-400'}`}>
                      {aiNetworkStatus.status > 0 
                        ? `${aiNetworkStatus.status} ${aiNetworkStatus.ok ? 'OK' : 'Error'}` 
                        : 'Using client-side processing'}
                    </span>
                  </div>
                  {usingFallback && (
                    <span className="bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded-full text-xs">
                      Client-side fallback active
                    </span>
                  )}
                </div>
              )}
              
              {aiResponse && (
                <div className="space-y-4">
                  {/* Enhanced Text */}
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h4 className="text-white text-sm font-semibold mb-2 flex items-center">
                      <Sparkles className="h-4 w-4 mr-2 text-[#FF8A00]" />
                      Enhanced Text:
                    </h4>
                    <pre className="text-gray-300 text-sm whitespace-pre-wrap bg-gray-700/50 p-3 rounded">
                      {aiResponse.enhancedText}
                    </pre>
                  </div>
                  
                  {/* Competencies */}
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h4 className="text-white text-sm font-semibold mb-2">Detected Competencies:</h4>
                    {aiResponse.competencies && aiResponse.competencies.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {aiResponse.competencies.map((code: string, i: number) => (
                          <span 
                            key={i} 
                            className="bg-[#FF8A00]/20 text-[#FF8A00] px-2 py-1 rounded text-xs font-mono"
                          >
                            {code}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400">No competencies detected</p>
                    )}
                  </div>
                  
                  {/* Suggestions */}
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h4 className="text-white text-sm font-semibold mb-2">Improvement Suggestions:</h4>
                    {aiResponse.suggestions && aiResponse.suggestions.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {aiResponse.suggestions.map((suggestion: string, i: number) => (
                          <li key={i} className="text-gray-300 text-sm">{suggestion}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-400">No suggestions provided</p>
                    )}
                  </div>
                  
                  {/* Raw Response */}
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h4 className="text-white text-sm font-semibold mb-2 flex justify-between items-center">
                      <span>Raw API Response:</span>
                    </h4>
                    <pre className="text-gray-300 text-xs whitespace-pre-wrap overflow-auto max-h-60 bg-gray-900/50 p-2 rounded">
                      {aiRawResponse}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}