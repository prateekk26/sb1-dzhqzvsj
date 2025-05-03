import React from 'react';
import { LinkedInImportPreview, LinkedInExperienceData } from './LinkedInImportPreview';

// Example data for demonstration purposes
const exampleData: LinkedInExperienceData[] = [
  {
    companyName: "Acme Corporation",
    title: "Senior Software Engineer",
    location: "San Francisco, CA",
    employmentType: "Full-time",
    description: "Led development of cloud-based platform serving over 1M users.\n\n• Architected and implemented microservices infrastructure using Node.js and Docker\n• Reduced server costs by 35% through optimization of database queries\n• Mentored junior developers and established coding standards",
    dateRange: {
      start: {
        year: 2020,
        month: 3
      },
      end: {
        year: 2023,
        month: 6
      }
    },
    companyLogo: "https://images.unsplash.com/photo-1549924231-f129b911e442?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80"
  },
  {
    companyName: "TechStart Inc.",
    title: "Frontend Developer",
    location: "Remote",
    employmentType: "Contract",
    description: "Developed responsive web applications for various clients using React, Redux and TypeScript.",
    dateRange: {
      start: {
        year: 2018,
        month: 9
      },
      end: {
        year: 2020,
        month: 2
      }
    },
    companyLogo: "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80"
  },
  {
    companyName: "InnovateLabs",
    title: "Junior Developer",
    location: "Boston, MA",
    employmentType: "Full-time",
    description: "Worked on internal tools and participated in the development of the company's main product.",
    dateRange: {
      start: {
        year: 2017,
        month: 6
      },
      end: {
        year: 2018,
        month: 8
      }
    }
  },
  {
    companyName: "Global Tech Solutions",
    title: "Software Engineer Intern",
    location: "New York, NY",
    employmentType: "Internship",
    description: "Summer internship where I assisted in developing new features for the company's mobile application.",
    dateRange: {
      start: {
        year: 2016,
        month: 5
      },
      end: {
        year: 2016,
        month: 8
      }
    },
    companyLogo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80"
  },
  {
    companyName: "Current Company",
    title: "Lead Developer",
    location: "Austin, TX",
    employmentType: "Full-time",
    description: "Currently leading development of next-generation software platform.",
    dateRange: {
      start: {
        year: 2023,
        month: 7
      }
    },
    companyLogo: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80"
  }
];

const ExampleLinkedInPreview: React.FC = () => {
  const handleImport = (selectedExperiences: LinkedInExperienceData[]) => {
    console.log('Importing experiences:', selectedExperiences);
    alert(`Selected ${selectedExperiences.length} experiences for import`);
  };

  const handleCancel = () => {
    console.log('Import canceled');
    alert('Import canceled');
  };

  return (
    <div className="min-h-screen bg-[#0F121A] p-4 flex items-center justify-center">
      <LinkedInImportPreview 
        data={exampleData} 
        onImport={handleImport}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default ExampleLinkedInPreview;