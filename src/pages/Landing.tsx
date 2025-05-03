import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isProfileComplete } from '../utils/isProfileComplete';
import { Button } from '../components/Button';
import { AuthForm } from '../components/AuthForm';
import { LandingMockInterview } from '../components/LandingMockInterview';
import { InfoCard } from '../components/InfoCard';
import { Footer } from '../components/Footer';
import { ChevronDown, Briefcase, FileText, Users, MessageSquare, Target, BarChart, MessageCircle, X, ArrowRight } from 'lucide-react';

export default function Landing() {
  const { user, profile, initialized } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [showMockInterview, setShowMockInterview] = useState(false);

  useEffect(() => {
  if (!initialized) return; // Don't do anything until auth finishes

  if (user && profile) {
    if (isProfileComplete(profile)) {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/complete-profile', { replace: true });
    }
  }
  // ✅ If no user — stay on Landing page and do nothing
}, [initialized, user, profile, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);

    setTimeout(() => setFadeIn(true), 100);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToMockInterview = () => {
    const section = document.getElementById('mock-interview-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen relative bg-[#0F121A] overflow-hidden font-sans">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[10%] left-[20%] w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]"
          style={{ background: 'radial-gradient(circle at center, rgba(255,138,0,0.8) 0%, rgba(20,20,30,0) 70%)' }}
        />
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full opacity-15 blur-[100px]"
          style={{ background: 'radial-gradient(circle at center, rgba(255,138,0,0.6) 0%, rgba(20,20,30,0) 70%)' }}
        />
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,138,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,138,0,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            backgroundPosition: '-1px -1px'
          }}
        />
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent, rgba(255,138,0,0.05) 50%, transparent)',
            backgroundSize: '100% 8px',
            animation: 'scanline 8s linear infinite',
          }}
        />
      </div>

      {/* Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-gray-900/90 backdrop-blur-md shadow-md' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-[#FF8A00] text-3xl font-bold flex items-center">
            <Link to="/" className="flex items-center text-4xl md:text-5xl">
              <span className="animate-pulse-custom">❯</span>
              <span className="animate-pulse-custom" style={{ animationDelay: '0.2s' }}>❯</span>
              <span className="animate-pulse-custom" style={{ animationDelay: '0.4s' }}>❯</span>
              <span className="ml-2">HIRE<span className="text-white">IQ</span></span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className={`relative z-10 min-h-screen flex flex-col transition-opacity duration-700 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex-grow flex flex-col lg:flex-row px-8 pt-24 pb-16">
          {/* Left Branding */}
          <div className="lg:w-3/5 flex flex-col justify-center mb-12 lg:mb-0 lg:pr-12 pt-12">
            <div className="text-[#FF8A00] font-semibold uppercase tracking-wide text-lg mb-4">
              STOP WINGING, START WINNING
            </div>

            <div className="space-y-6 mb-8">
              <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
                Prep <span className="text-[#FF8A00]">Smarter</span>.<br/>
                Interview <span className="text-[#FF8A00]">Better</span>.<br/>
                Convert <span className="text-[#FF8A00]">Faster</span>.
              </h1>
              <p className="text-gray-300 text-xl max-w-2xl leading-relaxed">
                Your all-in-one platform for mastering the interview process and landing your dream job.
              </p>

              <Button 
                variant="primary" 
                size="lg" 
                rightIcon={ArrowRight}
                className="bg-[#FF8A00] hover:bg-[#E67A00] text-white py-4 px-8 text-lg shadow-lg transition-all duration-300 mr-4"
                onClick={() => setShowMockInterview(true)}
              >
                Try Mock Interview
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-white py-4 px-8 text-lg shadow-lg transition-all duration-300"
                onClick={scrollToMockInterview}
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Right Auth Form */}
          <div className="lg:w-2/5 flex items-center justify-center">
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF8A00] to-[#FF8A00]/30 rounded-lg blur opacity-50 animate-pulse-custom"></div>
              <AuthForm />
            </div>
          </div>
        </div>

        {/* Floating Chevron (scroll guide) */}
        <div className="absolute bottom-6 w-full flex justify-center">
          <button 
            onClick={scrollToMockInterview} 
            className="animate-bounce text-[#FF8A00]"
            aria-label="Scroll down to learn more"
          >
            <ChevronDown size={40} />
          </button>
        </div>
      </div>

      {/* Your Path to Success Section */}
      <div id="features-section" className="py-24 relative">
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              Your Path to Success
            </h2>
            <p className="text-gray-300 text-lg">
              Follow our proven framework to land your dream job confidently.
            </p>
          </div>

          {/* Tabbed Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            <InfoCard
              icon={Briefcase}
              stepNumber={1}
              title="Own Your Career Story"
              description="Transform your work history into compelling narratives."
              extendedDescription="Use STAR format to make your experiences measurable, memorable, and impactful."
            />
            <InfoCard
              icon={FileText}
              stepNumber={2}
              title="Your Resume, But Better"
              description="AI-optimized resume suggestions that get noticed."
              extendedDescription="Get better wording, metrics, and layout tips automatically."
            />
            <InfoCard
              icon={Users}
              stepNumber={3}
              title="Leverage Your Network"
              description="Professional references made easy."
              extendedDescription="Request, store, and present powerful references effortlessly."
            />
            <InfoCard
              icon={MessageSquare}
              stepNumber={4}
              title="Nail Every Interview"
              description="Practice with AI, improve with real feedback."
              extendedDescription="Mock interviews plus instant analysis of answers, tone, and confidence."
            />
            <InfoCard
              icon={Target}
              stepNumber={5}
              title="Turn Insights Into Offers"
              description="Actionable insights after every interview."
              extendedDescription="Get coaching-style advice automatically to close your skill gaps."
            />
            <InfoCard
              icon={BarChart}
              stepNumber={6}
              title="Track, Improve, Win"
              description="Analytics on your job hunt to keep improving."
              extendedDescription="Stay organized across applications, interviews, and offer stages."
            />
          </div>
        </div>
      </div>
      

      {/* Footer */}
      <div>
        <Footer />
        
        {/* Sticky CTA Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm border-t border-gray-800 py-3 px-4 z-40">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center">
            <p className="text-white mb-3 sm:mb-0">
              Interviewed recently? Got ghosted or lowballed? 🔥 Speak up. Your story might help someone else.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/truth-wall')}
              rightIcon={ArrowRight}
            >
              Share Your Experience
            </Button>
          </div>
        </div>
      </div>

      {/* Mock Interview Modal */}
      {showMockInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80">
          <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full border border-[#FF8A00]/30 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">AI Mock Interview</h2>
              <button 
                onClick={() => setShowMockInterview(false)}
                className="text-gray-400 hover:text-white p-1 rounded-full"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <LandingMockInterview />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
}