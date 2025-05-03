import React from 'react';
import { CheckCircle, ArrowRight, Sparkles, FileText, MessageSquare, BarChart, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';
import { Button } from './Button';
import { AuthForm } from './AuthForm';

export function LandingSignupPrompt() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border border-gray-700 mb-8">
        <CardHeader className="bg-gradient-to-r from-[#FF8A00]/10 to-transparent">
          <CardTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-[#FF8A00]" />
            You've Only Experienced 10% of What HireIQ Offers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 py-6">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-white font-medium text-lg mb-4">Sign up now to unlock the full platform:</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <div className="bg-[#FF8A00]/20 p-2 rounded-lg mr-3 flex-shrink-0">
                  <MessageSquare className="h-5 w-5 text-[#FF8A00]" />
                </div>
                <div>
                  <h4 className="text-white font-medium">Complete Mock Interviews</h4>
                  <p className="text-gray-300 text-sm">Practice with full-length interviews tailored to your target roles.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-[#FF8A00]/20 p-2 rounded-lg mr-3 flex-shrink-0">
                  <FileText className="h-5 w-5 text-[#FF8A00]" />
                </div>
                <div>
                  <h4 className="text-white font-medium">AI Resume Analysis</h4>
                  <p className="text-gray-300 text-sm">Get detailed feedback and improvement suggestions for your resume.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-[#FF8A00]/20 p-2 rounded-lg mr-3 flex-shrink-0">
                  <BarChart className="h-5 w-5 text-[#FF8A00]" />
                </div>
                <div>
                  <h4 className="text-white font-medium">Performance Tracking</h4>
                  <p className="text-gray-300 text-sm">Monitor your progress and identify areas for improvement.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-[#FF8A00]/20 p-2 rounded-lg mr-3 flex-shrink-0">
                  <Users className="h-5 w-5 text-[#FF8A00]" />
                </div>
                <div>
                  <h4 className="text-white font-medium">Reference Management</h4>
                  <p className="text-gray-300 text-sm">Collect and manage professional references to strengthen your applications.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-900/20 border border-green-700/30 p-4 rounded-lg">
            <h3 className="text-green-400 font-medium flex items-center mb-2">
              <CheckCircle className="h-5 w-5 mr-2" />
              Users who practice with HireIQ are 3x more likely to succeed in interviews
            </h3>
            <p className="text-gray-300 text-sm">
              Our AI-powered platform has helped thousands of job seekers land their dream jobs by providing personalized feedback and targeted practice.
            </p>
          </div>
        </CardContent>
        <CardFooter className="border-t border-gray-700 pt-4 flex justify-center">
          <Button
            variant="primary"
            size="lg"
            rightIcon={ArrowRight}
            onClick={() => {
              const authForm = document.getElementById('auth-form');
              if (authForm) {
                authForm.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="px-8"
          >
            Sign Up Now - It's Free
          </Button>
        </CardFooter>
      </Card>
      
      <div id="auth-form-container" className="relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF8A00] to-[#FF8A00]/30 rounded-lg blur opacity-50 animate-pulse-custom"></div>
        <AuthForm />
      </div>
    </div>
  );
}