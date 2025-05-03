import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { LoadingState } from '../components/LoadingState';
import { Footer } from '../components/Footer';

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const { loading } = useAuth();
  
  // Show loading state while auth is initializing
  if (loading) {
    return <LoadingState text="Loading privacy policy..." />;
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
          <h1 className="text-3xl font-bold text-white mb-6">Privacy Policy</h1>
          
          <p className="text-gray-300 mb-4">
            <strong className="text-white">Effective Date:</strong> April 7, 2025
          </p>
          
          <p className="text-gray-300 mb-6">
            This Privacy Policy describes how HireIQ, operated by Vie Technologies Private Limited, collects, uses, shares, and protects personal data. We are committed to ensuring that your privacy is protected and that your data is handled in accordance with the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).
          </p>
          
          <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Information We Collect</h2>
          <p className="text-gray-300 mb-6">
            We collect the following types of data:
            <br /><br />
            Personal Identifiers: Name, email address, and login credentials.
            <br /><br />
            Professional Information: Resume content, LinkedIn URL, work experience, and project descriptions.
            <br /><br />
            Interview Data: Audio recordings, transcripts, evaluation results.
            <br /><br />
            Device and Usage Information: IP address, browser type, and session behavior (to be collected via Google Analytics in the future).
          </p>
          
          <h2 className="text-xl font-bold text-white mt-8 mb-4">2. How We Use Your Data</h2>
          <p className="text-gray-300 mb-6">
            We use your data to:
            <br /><br />
            Provide and personalize our Services.
            <br /><br />
            Enhance resumes, evaluate interviews, and deliver feedback.
            <br /><br />
            Improve platform performance and conduct internal research.
            <br /><br />
            Communicate platform updates, alerts, and offers (if consented).
            <br /><br />
            Fulfill legal obligations and protect against fraud.
          </p>
          
          <h2 className="text-xl font-bold text-white mt-8 mb-4">3. Legal Basis for Processing (GDPR)</h2>
          <p className="text-gray-300 mb-6">
            Our data processing is supported by the following legal bases:
            <br /><br />
            Consent: When you voluntarily provide your information or agree to optional communications.
            <br /><br />
            Contractual necessity: To fulfill services under the user agreement.
            <br /><br />
            Legitimate interest: For service improvement, fraud prevention, and analytics.
            <br /><br />
            Legal obligation: To comply with applicable legal and regulatory requirements.
          </p>
          
          <h2 className="text-xl font-bold text-white mt-8 mb-4">4. Data Storage and Transfers</h2>
          <p className="text-gray-300 mb-6">
            All data is securely stored on servers located in India. Third-party services such as Supabase, OpenAI, and Stripe may process data internationally under standard contractual clauses or equivalent safeguards to ensure data protection.
          </p>
          
          <h2 className="text-xl font-bold text-white mt-8 mb-4">5. Sharing Your Data</h2>
          <p className="text-gray-300 mb-6">
            We do not sell your personal data.
            <br /><br />
            We may share your data in the following circumstances:
            <br /><br />
            Trusted service providers: Such as OpenAI, Supabase, and Stripe, who are bound by data protection agreements.
            <br /><br />
            Recruiters and employers: Only with your explicit opt-in.
            <br /><br />
            Legal authorities: If legally required for compliance, investigations, or proceedings.
            <br /><br />
            Aggregate insights (non-personal data): We may analyze anonymized and aggregated data — including work experience details, interview patterns, resume features, and competency benchmarks — to generate industry trends, skill maps, and performance benchmarks. These insights may be used for internal research, published in anonymized reports, or sold to third parties (e.g., employers, educators, or workforce platforms) without including any personally identifiable information (PII) or information that can be traced back to you.
          </p>
          
          <h2 className="text-xl font-bold text-white mt-8 mb-4">6. Cookies and Analytics</h2>
          <p className="text-gray-300 mb-6">
            We plan to use the following in the future:
            <br /><br />
            Google Analytics: To collect anonymized usage statistics.
            <br /><br />
            CookieYes: To manage cookie consent banners and user preferences.
            <br /><br />
            You will be able to manage your cookie preferences when these tools are deployed.
          </p>
          
          <h2 className="text-xl font-bold text-white mt-8 mb-4">7. Your Rights</h2>
          <p className="text-gray-300 mb-6">
            Depending on your jurisdiction, you have the right to:
            <br /><br />
            Access, rectify, or delete your personal data.
            <br /><br />
            Object to or restrict certain data uses.
            <br /><br />
            Withdraw consent at any time without affecting past processing.
            <br /><br />
            Request a portable copy of your data.
            <br /><br />
            You can exercise these rights by contacting support@thehireiq.com.
          </p>
          
          <h2 className="text-xl font-bold text-white mt-8 mb-4">8. Data Retention</h2>
          <p className="text-gray-300 mb-6">
            We retain your data as follows:
            <br /><br />
            Resume and professional history data: As long as your account remains active.
            <br /><br />
            Interview recordings: 30 days for free-tier users, indefinitely for premium users (unless deletion is requested).
            <br /><br />
            We may retain anonymized data for analytical purposes.
          </p>
          
          <h2 className="text-xl font-bold text-white mt-8 mb-4">9. Security</h2>
          <p className="text-gray-300 mb-6">
            We employ industry-standard measures to protect your data, including encryption, secure APIs, and regular audits. However, no system is entirely immune to risk.
          </p>
          
          <h2 className="text-xl font-bold text-white mt-8 mb-4">10. Children's Privacy</h2>
          <p className="text-gray-300 mb-6">
            HireIQ is not intended for individuals under 16 years of age. We do not knowingly collect data from children.
          </p>
          
          <h2 className="text-xl font-bold text-white mt-8 mb-4">11. Policy Updates</h2>
          <p className="text-gray-300 mb-6">
            This Privacy Policy may be updated periodically. We will notify you of material changes via email or in-app notices. Continued use of the platform after changes indicates acceptance.
          </p>
          
          <h2 className="text-xl font-bold text-white mt-8 mb-4">12. Contact Us</h2>
          <p className="text-gray-300 mb-6">
            For questions or to make a data request, contact:
            <br /><br />
            support@thehireiq.com
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;