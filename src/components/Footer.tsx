import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Mail, Heart, ChevronRight, ArrowRight } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 border-t border-gray-800 relative">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0F121A]/30"></div>
      
      <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-xl font-bold uppercase text-[#FF8A00] mb-4 flex items-center">
              <span className="text-[#FF8A00] mr-1">❯</span>
              <span className="text-[#FF8A00] mr-1">❯</span>
              <span className="text-[#FF8A00] mr-2">❯</span>
              HIRE IQ
            </h3>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              Your all-in-one platform for mastering the interview process and landing your dream job.
            </p>
            <div className="flex space-x-5">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#FF8A00] transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#FF8A00] transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#FF8A00] transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-white font-semibold mb-5">Quick Links</h3>
            <ul className="space-y-3">
              <li className="group">
                <Link to="/dashboard" className="text-gray-400 group-hover:text-[#FF8A00] transition-colors text-sm flex items-center">
                  <ChevronRight className="h-3 w-3 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Dashboard
                </Link>
              </li>
              <li className="group">
                <Link to="/resume-review" className="text-gray-400 group-hover:text-[#FF8A00] transition-colors text-sm flex items-center">
                  <ChevronRight className="h-3 w-3 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Resume Review
                </Link>
              </li>
              <li className="group">
                <Link to="/mock-interview" className="text-gray-400 group-hover:text-[#FF8A00] transition-colors text-sm flex items-center">
                  <ChevronRight className="h-3 w-3 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Mock Interviews
                </Link>
              </li>
              <li className="group">
                <Link to="/references" className="text-gray-400 group-hover:text-[#FF8A00] transition-colors text-sm flex items-center">
                  <ChevronRight className="h-3 w-3 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  References
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="col-span-1">
            <h3 className="text-white font-semibold mb-5">Legal</h3>
            <ul className="space-y-3">
              <li className="group">
                <Link to="/terms" className="text-gray-400 group-hover:text-[#FF8A00] transition-colors text-sm flex items-center">
                  <ChevronRight className="h-3 w-3 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Terms of Service
                </Link>
              </li>
              <li className="group">
                <Link to="/privacy" className="text-gray-400 group-hover:text-[#FF8A00] transition-colors text-sm flex items-center">
                  <ChevronRight className="h-3 w-3 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Privacy Policy
                </Link>
              </li>
              <li className="group">
                <a href="#" className="text-gray-400 group-hover:text-[#FF8A00] transition-colors text-sm flex items-center">
                  <ChevronRight className="h-3 w-3 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-1">
            <h3 className="text-white font-semibold mb-5">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center text-gray-400 text-sm group">
                <Mail className="h-4 w-4 mr-2 text-[#FF8A00]/70" />
                <a href="mailto:support@thehireiq.com" className="group-hover:text-[#FF8A00] transition-colors">
                  support@thehireiq.com
                </a>
              </li>
              <li className="mt-6">
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <h4 className="text-white text-sm font-medium mb-2">Subscribe to our newsletter</h4>
                  <div className="flex">
                    <input 
                      type="email" 
                      placeholder="Your email" 
                      className="bg-gray-700 text-white px-3 py-2 rounded-l-md text-sm focus:outline-none focus:ring-1 focus:ring-[#FF8A00] w-full"
                    />
                    <button className="bg-[#FF8A00] hover:bg-[#E67A00] text-white px-3 py-2 rounded-r-md transition-colors">
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm font-light">
            &copy; {currentYear} Vie Technologies Private Limited. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm mt-4 md:mt-0 flex items-center">
            Made with <Heart className="h-3 w-3 mx-1 text-red-500 animate-pulse" /> in India
          </p>
        </div>
      </div>
    </footer>
  );
}