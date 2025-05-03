import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { corsHeaders } from '../_shared/cors.ts';

// Environment variables
const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

// Create Supabase client
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Request interface
interface LinkedInRequest {
  profileUrl?: string;
  keyword?: string;
}

// Serve HTTP requests
serve(async (req) => {
  // Handle OPTIONS request for CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    // Parse request payload
    const payload: LinkedInRequest = await req.json();
    
    // Validate payload
    if (!payload.profileUrl && !payload.keyword) {
      return new Response(
        JSON.stringify({ error: "Missing profile URL or keyword" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Verify API key is available
    if (!RAPIDAPI_KEY) {
      console.error("RAPIDAPI_KEY is not defined in environment variables");
      return new Response(
        JSON.stringify({ error: "API configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle company search
    if (payload.keyword) {
      console.log(`Searching LinkedIn companies with keyword: ${payload.keyword}`);
      
      // Call the companies search endpoint
      const response = await fetch(
        `https://linkedin-data-api.p.rapidapi.com/companies/search`,
        {
          method: 'POST',
          headers: {
            'x-rapidapi-host': 'linkedin-data-api.p.rapidapi.com',
            'x-rapidapi-key': RAPIDAPI_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            keyword: payload.keyword,
            page: 1
          })
        }
      );
      
      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: `API responded with status: ${response.status}` }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const data = await response.json();
      
      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle profile URL fetch
    console.log(`Fetching LinkedIn data for profile URL: ${payload.profileUrl}`);

    // Call LinkedIn Data API from RapidAPI
    const encodedUrl = encodeURIComponent(payload.profileUrl!);
    
    // Add timeout and retry logic
    const axiosConfig = {
      headers: {
        'x-rapidapi-host': 'linkedin-data-api.p.rapidapi.com',
        'x-rapidapi-key': RAPIDAPI_KEY,
      },
      timeout: 30000, // 30 second timeout
    };
    
    console.log(`Making request to: https://linkedin-data-api.p.rapidapi.com/get-profile-data-by-url?url=${encodedUrl}`);
    
    const response = await fetch(
      `https://linkedin-data-api.p.rapidapi.com/get-profile-data-by-url?url=${encodedUrl}`,
      {
        headers: {
          'x-rapidapi-host': 'linkedin-data-api.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY,
        },
      }
    );

    // Log the raw response for debugging
    console.log('LinkedIn API response status:', response.status);
    
    // Check for 4xx errors
    if (response.status >= 400 && response.status < 500) {
      return new Response(
        JSON.stringify({ error: `API responded with status: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get the response data
    const data = await response.json();
    
    // Make sure we have a valid response
    if (typeof data !== 'object') {
      throw new Error(`Invalid response from LinkedIn API: ${typeof data}`);
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('LinkedIn API Error:', error);
    
    // Format error response
    let errorMessage = 'Failed to fetch LinkedIn data';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Specific error handling
      if (error.message.includes('timeout') || error.message.includes('aborted')) {
        errorMessage = 'Request timeout: The API took too long to respond';
        statusCode = 504;
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error: Unable to connect to the API';
        statusCode = 503;
      }
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: statusCode, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});