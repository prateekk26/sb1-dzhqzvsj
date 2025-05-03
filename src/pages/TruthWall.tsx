import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { TruthWallForm } from '../components/TruthWallForm';
import { TruthWallStats } from '../components/TruthWallStats';
import { TruthWallReviews } from '../components/TruthWallReviews';
import { Button } from '../components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Alert } from '../components/Alert';
import { useState, useCallback } from 'react';
import { useFeature } from '../context/ConfigContext';

// Truth Wall logo image
const truthWallLogo = "https://images.pexels.com/photos/3760778/pexels-photo-3760778.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";

export default function TruthWall() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const truthWallEnabled = useFeature('truthWall');
  
  const handleSubmitSuccess = useCallback(() => {
    setIsSubmitted(true);
    // Scroll to top after submission
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Reset after a delay
    setTimeout(() => {
      setIsSubmitted(false);
    }, 5000);
  }, []);

  if (!truthWallEnabled) {
    return (
      <div className="min-h-screen bg-[#0F121A] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border border-gray-700">
          <CardHeader>
            <CardTitle>Feature Unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">
              The Truth Wall feature is currently disabled. Please check back later.
            </p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F121A]">
      <header className="bg-gray-900/90 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-[#FF8A00] text-4xl md:text-5xl font-bold flex items-center">
            <Link to="/" className="flex items-center text-4xl md:text-5xl">
              <span className="animate-pulse-custom">❯</span>
              <span className="animate-pulse-custom" style={{ animationDelay: '0.2s' }}>❯</span>
              <span className="animate-pulse-custom" style={{ animationDelay: '0.4s' }}>❯</span>
              <span className="ml-2">HIRE<span className="text-white">IQ</span></span>
            </Link>
          </div>
          <Link to="/">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={ArrowLeft}
              className="text-gray-400 hover:text-white"
            >
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <div className="mb-6">
              <img 
                src={truthWallLogo} 
                alt="Truth Wall Logo" 
                className="mx-auto h-32 md:h-40 rounded-lg shadow-lg border-2 border-[#FF8A00]/30"
              />
            </div>
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
              The Interview Truth Wall
            </h1>
            <p className="text-2xl md:text-3xl text-gray-400 max-w-4xl mx-auto">
              Real experiences. Real feedback. No filters.
            </p>
          </div>
          
          {isSubmitted && (
            <div className="mb-10">
              <Alert
                variant="success"
                message="Thank you for sharing your experience! Your submission is pending moderation and will appear on the Truth Wall once approved."
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
            {/* Left Column: Form */}
            <div>
              <Card className="border border-gray-700 bg-gray-800/50 backdrop-blur-sm h-full shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center text-3xl">
                    <MessageCircle className="h-6 w-6 mr-3 text-[#FF8A00]" />
                    Speak Your Truth – Share Your Interview Experience Anonymously
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <TruthWallForm onSubmitSuccess={handleSubmitSuccess} />
                </CardContent>
              </Card>
            </div>
            
            {/* Right Column: Visualizations */}
            <div className="space-y-6">
              <TruthWallStats />
            </div>
          </div>
          
          {/* Reviews Section */}
          <div className="mt-20">
            <TruthWallReviews />
          </div>
        </div>
      </main>
    </div>
  );
}