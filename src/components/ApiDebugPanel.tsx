import React, { useState, useRef } from 'react';
import { Code, Copy, Check, ChevronUp, ChevronDown, Trash2, ExternalLink, RefreshCw, Clock, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Button } from './Button';
import { Alert } from './Alert';

interface ApiResponse {
  timestamp?: string;
  duration?: number;
  endpoint?: string;
  status?: number;
  method?: string;
  request?: any;
  response: any;
  error?: string;
}

interface ApiDebugPanelProps {
  title?: string;
  response?: ApiResponse;
  className?: string;
  onClear?: () => void;
}

export function ApiDebugPanel({ title = 'API Debug', response, className = '', onClear }: ApiDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showFullResponse, setShowFullResponse] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'response' | 'request'>('response');
  const responseRef = useRef<HTMLPreElement>(null);

  const toggleOpen = () => setIsOpen(!isOpen);
  
  const handleCopy = () => {
    if (!response) return;
    
    const textToCopy = JSON.stringify(response.response, null, 2);
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Failed to copy response:', err));
  };
  
  const handleDownload = () => {
    if (!response) return;
    
    const dataStr = JSON.stringify(response.response, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataUri);
    downloadAnchorNode.setAttribute('download', `api-response-${new Date().toISOString().slice(0, 19)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };
  
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green-600/40 text-green-200';
    if (status >= 400 && status < 500) return 'bg-yellow-600/40 text-yellow-200';
    if (status >= 500) return 'bg-red-600/40 text-red-200';
    return 'bg-gray-600/40 text-gray-200';
  };
  
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)} ms`;
    return `${(ms / 1000).toFixed(1)} s`;
  };

  return (
    <Card className={`border border-gray-700 ${className}`}>
      <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-700 p-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center">
            <Code className="h-4 w-4 mr-2 text-[#FF8A00]" />
            {title}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {onClear && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0"
                onClick={onClear}
              >
                <Trash2 className="h-4 w-4 text-gray-400" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0"
              onClick={toggleOpen}
            >
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isOpen && (
        <CardContent className="p-3 space-y-3">
          {!response ? (
            <Alert 
              variant="info" 
              message="No API response data available. Make a request to see details here."
            />
          ) : (
            <>
              <div className="bg-gray-900/60 rounded-md p-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Endpoint:</span>
                    <span className="text-gray-200 font-mono truncate max-w-[200px]" title={response.endpoint}>
                      {response.endpoint || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Method:</span>
                    <span className="text-white font-medium">{response.method || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    {response.status ? (
                      <span className={`px-2 py-0.5 rounded-full font-medium ${getStatusColor(response.status)}`}>
                        {response.status}
                      </span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Time:</span>
                    <span className="text-gray-200">
                      {response.timestamp ? new Date(response.timestamp).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Duration:</span>
                    {response.duration ? (
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-blue-400" />
                        <span className="text-blue-300">{formatDuration(response.duration)}</span>
                      </span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </div>
                  {response.error && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Error:</span>
                      <span className="text-red-400 truncate max-w-[200px]" title={response.error}>
                        {response.error}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-3 border-b border-gray-700">
                    <button
                      className={`px-3 py-1.5 text-xs font-medium -mb-px ${
                        activeTab === 'response' 
                          ? 'text-[#FF8A00] border-b-2 border-[#FF8A00]' 
                          : 'text-gray-400 hover:text-gray-300'
                      }`}
                      onClick={() => setActiveTab('response')}
                    >
                      Response
                    </button>
                    {response.request && (
                      <button
                        className={`px-3 py-1.5 text-xs font-medium -mb-px ${
                          activeTab === 'request' 
                            ? 'text-[#FF8A00] border-b-2 border-[#FF8A00]' 
                            : 'text-gray-400 hover:text-gray-300'
                        }`}
                        onClick={() => setActiveTab('request')}
                      >
                        Request
                      </button>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 py-0 text-xs"
                      onClick={() => setShowFullResponse(!showFullResponse)}
                    >
                      {showFullResponse ? 'Collapse' : 'Expand'}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={handleDownload}
                    >
                      <Download className="h-4 w-4 text-gray-400 hover:text-blue-400" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-400 hover:text-blue-400" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="bg-gray-900 rounded-md border border-gray-700 overflow-hidden">
                  <div className={`overflow-auto transition-all ${showFullResponse ? 'max-h-[500px]' : 'max-h-[200px]'}`}>
                    <pre 
                      ref={responseRef} 
                      className="p-3 text-xs font-mono text-gray-300 whitespace-pre"
                    >
                      {activeTab === 'response' 
                        ? JSON.stringify(response.response, null, 2)
                        : JSON.stringify(response.request, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}