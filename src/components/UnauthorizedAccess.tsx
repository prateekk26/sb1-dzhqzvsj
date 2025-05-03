import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Button } from './Button';
import { Card, CardHeader, CardTitle, CardContent } from './Card';

export function UnauthorizedAccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0F121A] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border border-red-500/30">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShieldAlert className="h-5 w-5 mr-2 text-red-500" />
            Unauthorized Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center text-center p-4">
            <ShieldAlert className="h-16 w-16 text-red-500/70 mb-6" />
            <h2 className="text-xl font-bold text-white mb-4">Admin Access Required</h2>
            <p className="text-gray-300 mb-4">
              This area is restricted to administrators only. If you believe you should have access, please contact your system administrator.
            </p>
            <Button
              leftIcon={ArrowLeft}
              onClick={() => navigate('/dashboard')}
              className="mt-4"
            >
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}