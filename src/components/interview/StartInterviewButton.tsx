import React from 'react';
import { Button } from '../Button';
import { Waves } from 'lucide-react';

interface StartInterviewButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export function StartInterviewButton({ onClick, isLoading }: StartInterviewButtonProps) {
  return (
    <div className="flex justify-center mt-8">
      <Button
        variant="primary"
        size="lg"
        leftIcon={Waves}
        onClick={onClick}
        isLoading={isLoading}
        disabled={isLoading}
        className="px-8 py-6"
      >
        {isLoading ? 'Connecting...' : 'Start Interview'}
      </Button>
    </div>
  );
}