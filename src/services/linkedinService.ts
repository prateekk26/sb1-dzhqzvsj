import { ExperienceInput } from '../hooks/useExperiences';

interface LinkedInExperience {
  companyName: string;
  description?: string;
  title: string;
  dateRange: {
    start: string;
    end?: string;
  };
  location?: string;
}

interface LinkedInProfileResponse {
  experiences?: LinkedInExperience[];
  error?: string;
}

function parseLinkedInDate(dateStr?: string): string | null {
  if (!dateStr) return null;

  try {
    const parts = dateStr.split(' ');
    if (parts.length < 2) return null;

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const month = monthNames.indexOf(parts[0]) + 1;
    const year = parseInt(parts[1]);

    if (isNaN(year) || month < 1) return null;

    return `${year}-${month.toString().padStart(2, '0')}-01`;
  } catch (error) {
    console.error('Error parsing LinkedIn date:', error);
    return null;
  }
}

function formatDateFromParts(year: number, month: number, day: number = 1): string {
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function isCurrentPosition(year: number, month: number, day?: number): boolean {
  return year === 0 && month === 0 && (!day || day === 0);
}

// Sort experiences chronologically with most recent first
function sortExperiencesChronologically(experiences: ExperienceInput[]): ExperienceInput[] {
  return [...experiences].sort((a, b) => {
    // Use start_date for comparison
    const dateA = new Date(a.start_date).getTime();
    const dateB = new Date(b.start_date).getTime();
    
    // Sort in descending order (most recent first)
    return dateB - dateA;
  });
}

function extractExperiencesFromResponse(data: any): ExperienceInput[] {
  console.log('Extracting experiences from response data');
  const experiences: ExperienceInput[] = [];

  try {
    // Check for different possible structures in the API response
    let positionsArray: any[] = [];
    
    // Check for positions in the data object directly
    if (data.position && Array.isArray(data.position)) {
      console.log('Found position array in root data object with length:', data.position.length);
      positionsArray = data.position;
    } 
    // Check for positions in data.data object (common structure from RapidAPI)
    else if (data.data && data.data.position && Array.isArray(data.data.position)) {
      console.log('Found position array in data.data with length:', data.data.position.length);
      positionsArray = data.data.position;
    }
    // Check for positions in data.data.experience array (another possible structure)
    else if (data.data && data.data.experience && Array.isArray(data.data.experience)) {
      console.log('Found experience array in data.data with length:', data.data.experience.length);
      positionsArray = data.data.experience;
    }
    // Check for positions in data.experience array
    else if (data.experience && Array.isArray(data.experience)) {
      console.log('Found experience array in root data object with length:', data.experience.length);
      positionsArray = data.experience;
    }
    // Log all top-level keys to help debug
    else {
      console.log('Could not find position array in expected locations. Available top-level keys:', Object.keys(data));
      if (data.data) {
        console.log('Keys in data.data:', Object.keys(data.data));
      }
    }

    if (positionsArray.length > 0) {
      positionsArray.forEach((pos: any, index: number) => {
        if (!pos) return;
        
        // Extract company name with multiple fallbacks
        const companyName = pos.companyName || 
                           pos.company?.name || 
                           pos.companyName?.text || 
                           pos.company || 
                           "Unknown Company";
                           
        console.log(`Processing position ${index + 1}:`, companyName);

        // Extract role/title with fallbacks
        const role = pos.title || 
                    pos.role || 
                    pos.title?.text || 
                    pos.position || 
                    "Unknown Role";

        // Extract location with fallbacks
        const location = pos.location || 
                        pos.geoLocationName || 
                        pos.locationName || 
                        pos.location?.text || 
                        null;
                        
        // Extract description with fallbacks
        const description = pos.description || 
                           pos.description?.text || 
                           pos.summary || 
                           null;

        let startDate = null;
        let endDate = null;

        // Try to extract dates from different possible structures
        if (pos.start) {
          const startYear = pos.start.year;
          const startMonth = pos.start.month;
          const startDay = pos.start.day || 1;

          if (startYear && startMonth) {
            startDate = formatDateFromParts(startYear, startMonth, startDay);
            console.log(`Using direct startDate: ${startDate}`);
          }
        } else if (pos.dateRange && pos.dateRange.start) {
          // Handle the format from the example data
          const startYear = pos.dateRange.start.year;
          const startMonth = pos.dateRange.start.month;
          
          if (startYear && startMonth) {
            startDate = formatDateFromParts(startYear, startMonth);
            console.log(`Using dateRange.start format: ${startDate}`);
          }
        } else if (pos.timePeriod && pos.timePeriod.startDate) {
          // Another possible format
          const startYear = pos.timePeriod.startDate.year;
          const startMonth = pos.timePeriod.startDate.month;
          
          if (startYear && startMonth) {
            startDate = formatDateFromParts(startYear, startMonth);
            console.log(`Using timePeriod.startDate format: ${startDate}`);
          }
        }

        if (pos.end) {
          if (isCurrentPosition(pos.end.year, pos.end.month, pos.end.day)) {
            console.log('Current position detected (end date values are zero)');
            endDate = null;
          } else {
            const endYear = pos.end.year;
            const endMonth = pos.end.month;
            const endDay = pos.end.day || 1;

            if (endYear && endMonth) {
              endDate = formatDateFromParts(endYear, endMonth, endDay);
              console.log(`Using direct endDate: ${endDate}`);
            }
          }
        } else if (pos.dateRange && pos.dateRange.end) {
          // Handle the format from the example data
          const endYear = pos.dateRange.end.year;
          const endMonth = pos.dateRange.end.month;
          
          if (endYear && endMonth) {
            endDate = formatDateFromParts(endYear, endMonth);
            console.log(`Using dateRange.end format: ${endDate}`);
          } else {
            // If dateRange exists but no end, it's likely a current position
            console.log('Current position detected (no end date in dateRange)');
            endDate = null;
          }
        } else if (pos.timePeriod && pos.timePeriod.endDate) {
          // Another possible format
          const endYear = pos.timePeriod.endDate.year;
          const endMonth = pos.timePeriod.endDate.month;
          
          if (endYear && endMonth) {
            endDate = formatDateFromParts(endYear, endMonth);
            console.log(`Using timePeriod.endDate format: ${endDate}`);
          }
        } else {
          // If no end date structure is found, it's likely a current position
          console.log('No end date found, assuming current position');
          endDate = null;
        }

        if (!startDate) {
          console.warn('No valid start date found for position. Using current date.');
          startDate = new Date().toISOString().split('T')[0];
        }

        console.log(`Position at ${companyName}: ${startDate} to ${endDate || 'Present'}`);

        // Create a unique source_id based on company and role
        const sourceId = `linkedin-${companyName.replace(/\s+/g, '-').toLowerCase()}-${role.replace(/\s+/g, '-').toLowerCase()}`;

        experiences.push({
          company: companyName,
          role: role,
          location: location,
          description: description,
          start_date: startDate,
          end_date: endDate,
          source: 'linkedin',
          source_id: sourceId
        });
      });
    }
  } catch (error) {
    console.error('Error extracting experiences:', error);
    
    // Log more details about the data structure to help debug
    console.log('Data structure received:', typeof data);
    if (typeof data === 'object') {
      console.log('Top-level keys:', Object.keys(data));
      
      // If data.data exists, log its structure too
      if (data.data) {
        console.log('data.data keys:', Object.keys(data.data));
      }
    }
  }

  // Sort experiences by start date (most recent first)
  return sortExperiencesChronologically(experiences);
}

export async function fetchLinkedInData(linkedinUrl: string): Promise<{
  experiences: ExperienceInput[];
  error: string | null;
}> {
  try {
    console.log(`Sending request to API for LinkedIn data: ${linkedinUrl}`);

    // Call the Edge Function directly
    const { data, error } = await supabase.functions.invoke('fetch-linkedin', {
      body: { profileUrl: linkedinUrl }
    });
    
    if (error) {
      console.error('Edge function error:', error);
      throw new Error(`Failed to fetch LinkedIn data: ${error.message || 'Unknown error'}`);
    }
    
    if (!data) {
      throw new Error('No data returned from LinkedIn API');
    }
    
    const topLevelKeys = Object.keys(data);
    console.log('Response top-level properties:', topLevelKeys.join(', '));
    
    const extractedExperiences = extractExperiencesFromResponse(data);
    
    if (extractedExperiences.length === 0) {
      console.error('No experiences found in LinkedIn profile data. This could be due to:');
      console.error('1. The profile has no experience sections');
      console.error('2. The API response structure is different than expected');
      console.error('3. The profile is private or has restricted access');
      
      // Log a sample of the data to help debug
      console.log('Response data excerpt:', JSON.stringify(data).substring(0, 1000) + '...');
      
      // Try to extract profile info to confirm we got a valid response
      let profileInfo = '';
      if (data.data && data.data.firstName && data.data.lastName) {
        profileInfo = `Profile found for: ${data.data.firstName} ${data.data.lastName}`;
      } else if (data.firstName && data.lastName) {
        profileInfo = `Profile found for: ${data.firstName} ${data.lastName}`;
      }
      
      if (profileInfo) {
        console.log(profileInfo);
        return {
          experiences: [],
          error: `${profileInfo}, but no work experience data could be extracted. The profile may not have any public work experience listed.`
        };
      }
      
      return {
        experiences: [],
        error: 'No experiences found in LinkedIn profile data'
      };
    }
    
    console.log('Successfully extracted experiences:', extractedExperiences.length);
    extractedExperiences.forEach((exp, index) => {
      console.log(`Experience ${index + 1}: ${exp.company} - ${exp.role} (${exp.start_date} to ${exp.end_date || 'Present'})`);
    });
    
    return {
      experiences: extractedExperiences,
      error: null
    };
  } catch (error) {
    console.error('Error fetching LinkedIn data:', error);
    return {
      experiences: [],
      error: error instanceof Error ? error.message : 'Failed to fetch LinkedIn data'
    };
  }
}

export function extractLinkedInUsername(url: string): string | null {
  try {
    if (!url.includes('linkedin.com/in/')) {
      return null;
    }
    
    const regex = /linkedin\.com\/in\/([^\/\?#]+)/;
    const match = url.match(regex);
    
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function testApiConnection(): Promise<{ success: boolean; message: string }> {
  try {
    // Test connection to Supabase
    const { data, error } = await supabase.functions.invoke('fetch-linkedin', {
      body: { test: true }
    });
    
    if (error) {
      return {
        success: false,
        message: `Connection error: ${error.message || 'Unknown error'}`
      };
    }
    
    return {
      success: true,
      message: 'Connection successful'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to connect to server'
    };
  }
}

export async function getUserLinkedInUrl(supabase: any, userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('users_profile')
      .select('linkedin_url')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    return data?.linkedin_url || null;
  } catch (error) {
    console.error('Error fetching LinkedIn URL:', error);
    return null;
  }
}