import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { corsHeaders } from '../_shared/cors.ts';

// Environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create Supabase client with service role for admin access
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);



// Request interface
interface DeleteUserRequest {
  userId: string;
}

serve(async (req) => {
  // Handle preflight CORS requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { 
        status: 405, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
  
  try {
    // Parse the request payload
    const payload: DeleteUserRequest = await req.json();
    
    // Validate payload
    if (!payload.userId) {
      throw new Error("User ID is required");
    }
    
    // Verify the requester is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Check if the user is an admin
    const { data: isAdmin, error: adminCheckError } = await supabaseAdmin.rpc('is_admin_user');
    
    if (adminCheckError || !isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized - Admin access required" }),
        { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Delete all user data in the following order:
    
    // 1. Delete user's projects
    const { error: projectsError } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('user_id', payload.userId);
      
    if (projectsError) {
      console.warn(`Error deleting user's projects: ${projectsError.message}`);
    }
    
    // 2. Delete user's experiences
    const { error: experiencesError } = await supabaseAdmin
      .from('experiences')
      .delete()
      .eq('user_id', payload.userId);
      
    if (experiencesError) {
      console.warn(`Error deleting user's experiences: ${experiencesError.message}`);
    }
    
    // 3. Delete user's mock interviews
    const { error: interviewsError } = await supabaseAdmin
      .from('mock_interviews')
      .delete()
      .eq('user_id', payload.userId);
      
    if (interviewsError) {
      console.warn(`Error deleting user's mock interviews: ${interviewsError.message}`);
    }
    
    // 4. Delete user's interviews
    const { error: realInterviewsError } = await supabaseAdmin
      .from('interviews')
      .delete()
      .eq('user_id', payload.userId);
      
    if (realInterviewsError) {
      console.warn(`Error deleting user's interviews: ${realInterviewsError.message}`);
    }
    
    // 5. Delete user's references
    const { error: referencesError } = await supabaseAdmin
      .from('references')
      .delete()
      .eq('user_id', payload.userId);
      
    if (referencesError) {
      console.warn(`Error deleting user's references: ${referencesError.message}`);
    }
    
    // 6. Delete user's profile
    const { error: profileError } = await supabaseAdmin
      .from('users_profile')
      .delete()
      .eq('user_id', payload.userId);
      
    if (profileError) {
      console.warn(`Error deleting user's profile: ${profileError.message}`);
    }
    
    // 7. Delete user's storage files
    try {
      // Delete resume files
      const { data: resumeFiles, error: listResumeError } = await supabaseAdmin
        .storage
        .from('resumes')
        .list(payload.userId);
        
      if (!listResumeError && resumeFiles && resumeFiles.length > 0) {
        const filePaths = resumeFiles.map(file => `${payload.userId}/${file.name}`);
        await supabaseAdmin.storage.from('resumes').remove(filePaths);
      }
      
      // Delete job description files
      const { data: jdFiles, error: listJdError } = await supabaseAdmin
        .storage
        .from('job-descriptions')
        .list(payload.userId);
        
      if (!listJdError && jdFiles && jdFiles.length > 0) {
        const filePaths = jdFiles.map(file => `${payload.userId}/${file.name}`);
        await supabaseAdmin.storage.from('job-descriptions').remove(filePaths);
      }
      
      // Delete interview recordings
      const { data: recordingFiles, error: listRecordingError } = await supabaseAdmin
        .storage
        .from('interview-recordings')
        .list(payload.userId);
        
      if (!listRecordingError && recordingFiles && recordingFiles.length > 0) {
        const filePaths = recordingFiles.map(file => `${payload.userId}/${file.name}`);
        await supabaseAdmin.storage.from('interview-recordings').remove(filePaths);
      }
    } catch (storageError) {
      console.warn(`Error deleting user's storage files: ${storageError instanceof Error ? storageError.message : 'Unknown error'}`);
    }
    
    // 8. Finally, delete the auth user
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
      payload.userId
    );
    
    if (authDeleteError) {
      throw new Error(`Failed to delete auth user: ${authDeleteError.message}`);
    }
    
    // Return success response
    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
    
  } catch (error) {
    console.error("Error deleting user:", error);
    
    // Return error response
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "An unexpected error occurred" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});