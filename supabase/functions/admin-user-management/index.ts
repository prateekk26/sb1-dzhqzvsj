import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';

// Enable debug logging
const DEBUG = true;

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Create Supabase client with service role for admin access
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);


// Request interface
interface AdminUserRequest {
  action: 'delete' | 'list' | 'get';
  userId?: string;
}

serve(async (req) => {
  // Handle preflight CORS requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    if (DEBUG) {
      console.log('Received request to admin-user-management');
      console.log(
        'Request headers:',
        Object.fromEntries(req.headers.entries())
      );
    }

    // Parse the request payload
    const payload: AdminUserRequest = await req.json();

    // Validate payload
    if (!payload.action) {
      throw new Error('Action is required');
    }

    if (DEBUG) {
      console.log('Request payload:', payload);
    }

    // Verify the requester is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (DEBUG) console.log('Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // First, verify the token is valid
    if (DEBUG) console.log('Verifying token...');
    const { data: userData, error: authError } =
      await supabaseAdmin.auth.getUser(token);

    if (authError || !userData.user) {
      if (DEBUG) console.log('Auth error or no user:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const user = userData.user;
    if (DEBUG) console.log('User authenticated:', user.id);

    // Check if the user is an admin
    // Create a client with the user's token to check admin status
    const supabaseClient = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    if (DEBUG) console.log('Checking if user is admin...');

    // Direct check if the user's email is in the admin list
    const isAdmin = user.email === 'prateek.kurkanji@gmail.com';

    if (!isAdmin) {
      if (DEBUG) console.log('User is not an admin:', user.email);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized - Admin access required',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (DEBUG)
      console.log('User is admin, proceeding with action:', payload.action);

    // Handle different actions
    switch (payload.action) {
      case 'list':
        return await handleListUsers();
      case 'delete':
        if (!payload.userId) {
          throw new Error('User ID is required for delete action');
        }
        return await handleDeleteUser(payload.userId, user.id);
      case 'get':
        if (!payload.userId) {
          throw new Error('User ID is required for get action');
        }
        return await handleGetUser(payload.userId);
      default:
        throw new Error(`Unsupported action: ${payload.action}`);
    }
  } catch (error) {
    console.error('Error in admin-user-management:', error);

    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Handle listing all users
 */
async function handleListUsers(): Promise<Response> {
  try {
    console.log('Handling list users request');

    // Get all users from auth.users
    const { data: authUsers, error: authError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('Error listing users:', authError);
      throw new Error(`Failed to fetch users: ${authError.message}`);
    }

    // Get all user profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('users_profile')
      .select('*');

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
      throw new Error(
        `Failed to fetch user profiles: ${profilesError.message}`
      );
    }

    // Merge the data
    const mergedUsers = authUsers.users.map((authUser) => {
      const profile = profiles.find((p) => p.user_id === authUser.id);
      return {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        app_metadata: authUser.app_metadata,
        user_metadata: authUser.user_metadata,
        profile: profile || null,
      };
    });

    console.log(`Successfully fetched ${mergedUsers.length} users`);

    return new Response(JSON.stringify({ success: true, users: mergedUsers }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Handle getting a single user
 */
async function handleGetUser(userId: string): Promise<Response> {
  try {
    // Get user from auth.users
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (authError) {
      throw new Error(`Failed to fetch user: ${authError.message}`);
    }

    if (!authUser.user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users_profile')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      // Ignore not found error
      throw new Error(`Failed to fetch user profile: ${profileError.message}`);
    }

    // Return merged data
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authUser.user.id,
          email: authUser.user.email,
          created_at: authUser.user.created_at,
          last_sign_in_at: authUser.user.last_sign_in_at,
          app_metadata: authUser.user.app_metadata,
          user_metadata: authUser.user.user_metadata,
          profile: profile || null,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw error;
  }
}

/**
 * Handle deleting a user
 */
async function handleDeleteUser(
  userId: string,
  currentUserId: string
): Promise<Response> {
  try {
    // Prevent admins from deleting themselves
    if (userId === currentUserId) {
      throw new Error('Administrators cannot delete their own accounts');
    }

    // Delete all user data in the following order:

    // 1. Delete user's projects
    const { error: projectsError } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('user_id', userId);

    if (projectsError) {
      console.warn(`Error deleting user's projects: ${projectsError.message}`);
    }

    // 2. Delete user's experiences
    const { error: experiencesError } = await supabaseAdmin
      .from('experiences')
      .delete()
      .eq('user_id', userId);

    if (experiencesError) {
      console.warn(
        `Error deleting user's experiences: ${experiencesError.message}`
      );
    }

    // 3. Delete user's mock interviews
    const { error: interviewsError } = await supabaseAdmin
      .from('mock_interviews')
      .delete()
      .eq('user_id', userId);

    if (interviewsError) {
      console.warn(
        `Error deleting user's mock interviews: ${interviewsError.message}`
      );
    }

    // 4. Delete user's interviews
    const { error: realInterviewsError } = await supabaseAdmin
      .from('interviews')
      .delete()
      .eq('user_id', userId);

    if (realInterviewsError) {
      console.warn(
        `Error deleting user's interviews: ${realInterviewsError.message}`
      );
    }

    // 5. Delete user's references
    const { error: referencesError } = await supabaseAdmin
      .from('references')
      .delete()
      .eq('user_id', userId);

    if (referencesError) {
      console.warn(
        `Error deleting user's references: ${referencesError.message}`
      );
    }

    // 6. Delete user's profile
    const { error: profileError } = await supabaseAdmin
      .from('users_profile')
      .delete()
      .eq('user_id', userId);

    if (profileError) {
      console.warn(`Error deleting user's profile: ${profileError.message}`);
    }

    // 7. Delete user's storage files
    try {
      // Delete resume files
      const { data: resumeFiles, error: listResumeError } =
        await supabaseAdmin.storage.from('resumes').list(userId);

      if (!listResumeError && resumeFiles && resumeFiles.length > 0) {
        const filePaths = resumeFiles.map((file) => `${userId}/${file.name}`);
        await supabaseAdmin.storage.from('resumes').remove(filePaths);
      }

      // Delete job description files
      const { data: jdFiles, error: listJdError } = await supabaseAdmin.storage
        .from('job-descriptions')
        .list(userId);

      if (!listJdError && jdFiles && jdFiles.length > 0) {
        const filePaths = jdFiles.map((file) => `${userId}/${file.name}`);
        await supabaseAdmin.storage.from('job-descriptions').remove(filePaths);
      }

      // Delete interview recordings
      const { data: recordingFiles, error: listRecordingError } =
        await supabaseAdmin.storage.from('interview-recordings').list(userId);

      if (!listRecordingError && recordingFiles && recordingFiles.length > 0) {
        const filePaths = recordingFiles.map(
          (file) => `${userId}/${file.name}`
        );
        await supabaseAdmin.storage
          .from('interview-recordings')
          .remove(filePaths);
      }
    } catch (storageError) {
      console.warn(
        `Error deleting user's storage files: ${
          storageError instanceof Error ? storageError.message : 'Unknown error'
        }`
      );
    }

    // 8. Finally, delete the auth user
    const { error: authDeleteError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      throw new Error(`Failed to delete auth user: ${authDeleteError.message}`);
    }

    // Return success response
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    throw error;
  }
}
