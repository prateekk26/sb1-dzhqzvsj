import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { LoadingState } from '../components/LoadingState';
import { Footer } from '../components/Footer';

const TermsOfService = () => {
  const navigate = useNavigate();
  const { loading } = useAuth();
  
  // Show loading state while auth is initializing
  if (loading) {
    return <LoadingState text="Loading terms of service..." />;
  }

  return (
    <div className="min-h-screen bg-[#0F121A]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button 
          variant="ghost"
          size="sm"
          leftIcon={ArrowLeft}
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white mb-6"
        >
          Back
        </Button>
        
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-6">Terms of Service</h1>
          
          <p className="text-gray-300 mb-4">
            <strong className="text-white">Effective Date:</strong> April 7, 2025
          </p>
          
          <p className="text-gray-300 mb-6">
            These Terms of Service ("Terms") govern your use of the HireIQ platform and services provided by Vie Technologies Private Limited, a company incorporated in India ("HireIQ", "we", "us", or "our"). By using our website and services ("Services"), you agree to be legally bound by these Terms.
          </p>
          
          <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Eligibility</h2>
          <p className="text-gray-300 mb-6">
            You must be at least 16 years of age to use HireIQ. By using our Services, you represent and warrant that you meet this requirement and that all information you provide is accurate and truthful.
          </p>
          
          <h2 className="text-xl font-bold text-white mt-8 mb-4">2. Account Registration and Responsibilities</h2>
          <p className="text-gray-300 mb-6">
            To access certain features, you must create an account. You are solely responsible for:
            <br /><br />
            Maintaining the confidentiality of your login credentials;
            <br /><br />
            Ensuring that all information associated with your account remains accurate;
            <br /><br />
            All activity under your account.
            <br /><br />
            You must notify us immediately of any unauthorized access or security breach.
          </p>
          
          <h2 className="text-xl font-bold text-white mt-8 mb-4">3. Intended Use</h2>
          <p className="text-gray-300 mb-6">
            You agree to use HireIQ strictly for its intended purposes: resume enhancement, mock interview practice, and job-seeking preparation. You shall not:
            <br /><br />
            Use the Services for commercial, competitive, malicious, or unlawful purposes;
            <br /><br />
            Attempt to scrape, extract, or reuse content or data not explicitly intended for user access;
            <br /><br />
            Circumvent any access or usage restrictions imposed by the platform;
            <br /><br />
            Exploit or disrupt the platform's performance, integrity, or security.
          </p>
          
          <h2 className="text-xl font-bold text-white mt-8 mb-4">4. User-Generated Content</h2>
          <p className="text-gray-300 mb-6">
            You retain ownership of the content you submit to HireIQ, including resumes, interview audio, and professional data. You grant HireIQ a worldwide, non-exclusive, royalty-free license to use this content solely to:
            <br /><br />
            Deliver and improve Services;
            <br /><br />
            Provide personalized feedback and analytics;
            <br /><br />
            Fulfill legal and compliance obligations.
          </p>
          
          <h2 className="text-xl font-bold text-white mt-8 mb-4">5. AI-Powered Features</h2>
          <p className="text-gray-300 mb-6">
            HireIQ utilizes artificial intelligence to provide suggestions and feedback on resumes, projects, and interview performance. These outputs are informational only and do not guarantee employment outcomes. Users should exercise discretion when applying or relying on AI-generated content.
          </p>
          
          <h2 className="text-xl font-bold text-white mt-8 mb-4">6. Premium Services and Fees</h2>
          <p className="text-gray-300 mb-6">
            Some features may require payment or a premium subscription. By purchasing such services, you agree to:
            <br /><br />
            Pay all applicable fees;
            <br /><br />
            Provide accurate and complete billing information;
            <br /><br />
            Comply with Stripe's terms and conditions.
            <br /><br />
            Prices and features are subject to change with prior notice.
          </p>
          
          <h2 className="text-xl font-bold text-white mt-8 mb-4">7. Intellectual Property</h2>
          <p className="text-gray-300 mb-6">
            All content, branding, and materials on HireIQ (excluding user submissions) are the exclusive property of Vie Technologies Private Limited. Unauthorized use, reproduction, or redistribution is strictly prohibited.
          </p>
          
          <h2 className="text-xl font-bold text-white mt-8 mb-4">8. Suspension and Termination</h2>
          <p className="text-gray-300 mb-6">
            We may suspend or terminate access to your account if you violate these Terms or use the Services inappropriately. Users may also request account deletion by contacting support@thehireiq.com.
          </p>
          
          <h2 className="text-xl font-bold text-white mt-8 mb-4">9. Disclaimers</h2>
          <p className="text-gray-300 mb-6">
            Our Services are provided on an "as is" and "as available" basis without warranties of any kind. We do not guarantee:
            <br /><br />
            Continuous, error-free operation of the platform;
            <br /><br />
            That outputs generated by AI models are accurate, complete, or suitable for a specific purpose.
          </p>
          
          <h2 className="text-xl font-bold text-white mt-8 mb-4">10. Limitation of Liability</h2>
          <p className="text-gray-300 mb-6">
            To the maximum extent permitted by law, HireIQ shall not be liable for:
            <br /><br />
            Any indirect, incidental, punitive, or consequential damages;
            <br /><br />
            Loss of data, profits, or business opportunities;
            <br /><br />
            Damages resulting from reliance on AI-generated content.
            <br /><br />
            Our total liability for any claim shall not exceed the total fees paid by you in the twelve (12) months prior to the event giving rise to the claim.
          </p>
          
          <h2 className="text-xl font-bold text-white mt-8 mb-4">11. Governing Law and Jurisdiction</h2>
          <p className="text-gray-300 mb-6">
            These Terms shall be governed by and construed in accordance with the laws of India. All disputes shall be subject to the exclusive jurisdiction of the competent courts located in Delhi, India.
          </p>
          
          <h2 className="text-xl font-bold text-white mt-8 mb-4">12. Changes to These Terms</h2>
          <p className="text-gray-300 mb-6">
            We reserve the right to modify these Terms at any time. Significant changes will be notified via email or posted prominently on our platform. Continued use of the Services after changes become effective constitutes your acceptance.
          </p>
          
          <h2 className="text-xl font-bold text-white mt-8 mb-4">13. Contact Us</h2>
          <p className="text-gray-300 mb-6">
            If you have any questions about these Terms or our Services, you may contact us at:
            <br /><br />
            support@thehireiq.com
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsOfService;