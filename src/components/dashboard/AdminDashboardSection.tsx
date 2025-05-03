import React, { memo } from 'react';
import { ShieldAlert, ListChecks, HelpCircle, UserCheck, Users, MessageCircle, Building } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../Card';
import { Button } from '../Button';
import { useNavigate } from 'react-router-dom';

// Memoize the AdminDashboardSection component to prevent unnecessary re-renders
export const AdminDashboardSection = memo(function AdminDashboardSection() {
  const navigate = useNavigate();

  return (
    <div className="border-t border-gray-700 mb-6 pt-6">
      <h2 className="text-xl font-bold text-blue-400 mb-4 flex items-center">
        <ShieldAlert className="h-5 w-5 mr-2" />
        Administrator Tools
      </h2>
      <p className="text-gray-400 mb-6">
        These tools are only available to administrators for managing system data.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-gray-700 hover:border-blue-500/30 transition-all duration-200 hover:shadow-md hover:shadow-blue-900/10">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-400">
              <ListChecks className="h-5 w-5 mr-2" />
              Competencies
            </CardTitle>
            <CardDescription>
              Manage the competency framework
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">
              View and edit the competency framework used for assessments and evaluations.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate('/competencies')}
              className="w-full"
            >
              Manage Competencies
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-gray-700 hover:border-blue-500/30 transition-all duration-200 hover:shadow-md hover:shadow-blue-900/10">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-400">
              <HelpCircle className="h-5 w-5 mr-2" />
              Interview Questions
            </CardTitle>
            <CardDescription>
              Manage the question bank
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">
              Create, edit, and organize interview questions used in mock interviews.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate('/interview-questions')}
              className="w-full"
            >
              Manage Questions
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-gray-700 hover:border-blue-500/30 transition-all duration-200 hover:shadow-md hover:shadow-blue-900/10">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-400">
              <UserCheck className="h-5 w-5 mr-2" />
              References
            </CardTitle>
            <CardDescription>
              Manage reference requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">
              Review and manage professional reference requests from users.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/references')}
              className="w-full"
            >
              Manage References
            </Button>
          </CardContent>
        </Card>

       <Card className="border border-gray-700 hover:border-blue-500/30 transition-all duration-200 hover:shadow-md hover:shadow-blue-900/10">
         <CardHeader>
           <CardTitle className="flex items-center text-blue-400">
             <Users className="h-5 w-5 mr-2" />
             User Management
           </CardTitle>
           <CardDescription>
             Manage user accounts
           </CardDescription>
         </CardHeader>
         <CardContent>
           <p className="text-gray-300 mb-4">
             View and delete user accounts and their associated data.
           </p>
           <Button
             variant="outline"
             onClick={() => navigate('/admin/users')}
             className="w-full"
           >
             Manage Users
           </Button>
         </CardContent>
       </Card>

       <Card className="border border-gray-700 hover:border-blue-500/30 transition-all duration-200 hover:shadow-md hover:shadow-blue-900/10">
         <CardHeader>
           <CardTitle className="flex items-center text-blue-400">
             <MessageCircle className="h-5 w-5 mr-2" />
             Truth Wall
           </CardTitle>
           <CardDescription>
             Manage interview reviews
           </CardDescription>
         </CardHeader>
         <CardContent>
           <p className="text-gray-300 mb-4">
             Review and moderate anonymous interview experiences shared by users.
           </p>
           <Button
             variant="outline"
             onClick={() => navigate('/admin/truth-wall')}
             className="w-full"
           >
             Manage Reviews
           </Button>
         </CardContent>
       </Card>

       <Card className="border border-gray-700 hover:border-blue-500/30 transition-all duration-200 hover:shadow-md hover:shadow-blue-900/10">
         <CardHeader>
           <CardTitle className="flex items-center text-blue-400">
             <Building className="h-5 w-5 mr-2" />
             Companies
           </CardTitle>
           <CardDescription>
             Manage company database
           </CardDescription>
         </CardHeader>
         <CardContent>
           <p className="text-gray-300 mb-4">
             Add, edit, and delete companies for the Truth Wall dropdown selection.
           </p>
           <Button
             variant="outline"
             onClick={() => navigate('/admin/companies')}
             className="w-full"
           >
             Manage Companies
           </Button>
         </CardContent>
       </Card>
      </div>
    </div>
  );
});