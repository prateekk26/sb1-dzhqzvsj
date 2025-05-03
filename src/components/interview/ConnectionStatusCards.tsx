import React from 'react';
import { Card } from '../Card';

interface ConnectionStatusCardsProps {
  connected: boolean;
  microphoneActive: boolean;
  speakerActive: boolean;
}

export function ConnectionStatusCards({ 
  connected, 
  microphoneActive, 
  speakerActive 
}: ConnectionStatusCardsProps) {
  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className={`border ${connected ? 'border-green-500 bg-green-900/10' : 'border-gray-700'}`}>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className={`h-3 w-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            <span className="text-sm font-medium">Connection</span>
          </div>
          <span className={connected ? 'text-green-400 text-sm' : 'text-gray-400 text-sm'}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </Card>
      
      <Card className={`border ${microphoneActive ? 'border-green-500 bg-green-900/10' : 'border-gray-700'}`}>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className={`h-3 w-3 rounded-full mr-2 ${microphoneActive ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            <span className="text-sm font-medium">Microphone</span>
          </div>
          <span className={microphoneActive ? 'text-green-400 text-sm' : 'text-gray-400 text-sm'}>
            {microphoneActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </Card>
      
      <Card className={`border ${speakerActive ? 'border-green-500 bg-green-900/10' : 'border-gray-700'}`}>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className={`h-3 w-3 rounded-full mr-2 ${speakerActive ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            <span className="text-sm font-medium">Speaker</span>
          </div>
          <span className={speakerActive ? 'text-green-400 text-sm' : 'text-gray-400 text-sm'}>
            {speakerActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </Card>
    </div>
  );
}