import { LoadingState, LoadingSpinner } from './LoadingState';
import { ExperienceItem } from './ExperienceItem';
import { TextArea } from './TextArea';
import { supabase } from '../lib/supabase';
import { ApiDebug } from './ApiDebug';
import { 
   extractLinkedInUsername, 
   fetchLinkedInData, 
   getUserLinkedInUrl,
   testApiConnection
} from '../services/linkedinService';
import { useFeature } from '../context/ConfigContext';
import { formatDate } from '../utils/dateUtils';

export default function Memory() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const linkedInImportEnabled = useFeature('linkedInImport');
  
  const { 
    experiences, 
    loading: experiencesLoading,
    error: experiencesError,
    mutate: mutateExperiences
  } = useExperiences();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLinkedinLoading, setIsLinkedinLoading] = useState(false);
  const [importInProgress, setImportInProgress] = useState(false);
  
  if (authLoading) {
    return <LoadingState />;
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Work Experience</h1>
          
          <div className="flex flex-wrap gap-3">
            {linkedInImportEnabled && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={Linkedin}
                onClick={confirmImportFromLinkedIn}
                isLoading={isLinkedinLoading}
                disabled={importInProgress}
                className="text-white bg-blue-600 hover:bg-blue-700 border-blue-600 transition-all duration-200"
              >
                Import from LinkedIn
              </Button>
            )}
            
            <Button
              variant={showAddForm ? "secondary" : "outline"}
              size="sm"
              leftIcon={Plus}
              onClick={() => setShowAddForm(!showAddForm)}
            >
              Add Experience
            </Button>
          </div>
        </div>

        {experiencesLoading ? (
          <LoadingSpinner />
        ) : experiences?.length === 0 ? (
          <div className="text-center">
            <div className="max-w-2xl mx-auto">
              {!showAddForm && (
                <div className="text-center py-16 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="max-w-md mx-auto">
                    <div className="inline-block p-3 bg-[#FF8A00]/20 rounded-full mb-4">
                      <Briefcase className="h-8 w-8 text-[#FF8A00]" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No work experiences yet</h3>
                    <p className="text-gray-400 mb-6 px-4">
                      Add your work history {linkedInImportEnabled ? 'or import from LinkedIn ' : ''}to showcase your professional journey.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      {linkedInImportEnabled && (
                        <Button
                          onClick={confirmImportFromLinkedIn}
                          leftIcon={Linkedin}
                          className="bg-blue-600 hover:bg-blue-700 text-white order-first"
                        >
                          Import from LinkedIn
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => setShowAddForm(true)}
                        leftIcon={Plus}
                      >
                        Add Experience
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}