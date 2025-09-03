import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Admin operations function started - version 2.0');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Environment check:', { 
      hasUrl: !!SUPABASE_URL, 
      hasKey: !!SUPABASE_SERVICE_ROLE_KEY 
    });
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const requestBody = await req.json();
    console.log('Request received:', requestBody);
    
    const { operation, submissionId, approved, projectData, projectId } = requestBody;
    
    console.log('Processing operation:', operation);

    switch (operation) {
      case 'fetchSubmissions':
        console.log('[SUBMISSIONS] Fetching all submissions');
        const { data: submissions, error: fetchError } = await supabaseAdmin
          .from('submissions')
          .select('*')
          .order('submitted_at', { ascending: false });

        if (fetchError) {
          console.error('[SUBMISSIONS] Error fetching submissions:', fetchError);
          throw fetchError;
        }

        console.log(`[SUBMISSIONS] Successfully fetched ${submissions?.length || 0} submissions`);
        return new Response(JSON.stringify({ submissions }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'updateApproval':
        console.log(`[SUBMISSIONS] Updating approval for submission ${submissionId} to ${approved}`);
        const { error: updateError } = await supabaseAdmin
          .from('submissions')
          .update({ is_approved: approved })
          .eq('id', submissionId);

        if (updateError) {
          console.error('[SUBMISSIONS] Error updating approval:', updateError);
          throw updateError;
        }

        console.log('[SUBMISSIONS] Successfully updated approval status');
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'deleteSubmission':
        console.log(`[SUBMISSIONS] Deleting submission ${submissionId}`);
        const { error: deleteError } = await supabaseAdmin
          .from('submissions')
          .delete()
          .eq('id', submissionId);

        if (deleteError) {
          console.error('[SUBMISSIONS] Error deleting submission:', deleteError);
          throw deleteError;
        }

        console.log('[SUBMISSIONS] Successfully deleted submission');
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'fetchProjects':
        console.log('[PROJECTS] Executing fetchProjects operation');
        try {
          const { data: projects, error: fetchProjectsError } = await supabaseAdmin
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

          if (fetchProjectsError) {
            console.error('[PROJECTS] Error fetching projects:', fetchProjectsError);
            throw fetchProjectsError;
          }

          console.log(`[PROJECTS] Successfully fetched ${projects?.length || 0} projects`);
          return new Response(JSON.stringify({ projects }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('[PROJECTS] Fetch projects error:', error);
          throw error;
        }

      case 'createProject':
        console.log('[PROJECTS] Executing createProject operation with data:', projectData);
        try {
          const { data: newProject, error: createError } = await supabaseAdmin
            .from('projects')
            .insert([projectData])
            .select()
            .single();

          if (createError) {
            console.error('[PROJECTS] Error creating project:', createError);
            throw createError;
          }

          console.log('[PROJECTS] Successfully created project:', newProject.id);
          return new Response(JSON.stringify({ project: newProject }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('[PROJECTS] Create project error:', error);
          throw error;
        }

      case 'updateProject':
        console.log(`[PROJECTS] Executing updateProject operation for ${projectId} with data:`, projectData);
        try {
          const { data: updatedProject, error: updateProjectError } = await supabaseAdmin
            .from('projects')
            .update(projectData)
            .eq('id', projectId)
            .select()
            .single();

          if (updateProjectError) {
            console.error('[PROJECTS] Error updating project:', updateProjectError);
            throw updateProjectError;
          }

          console.log('[PROJECTS] Successfully updated project');
          return new Response(JSON.stringify({ project: updatedProject }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('[PROJECTS] Update project error:', error);
          throw error;
        }

      case 'deleteProject':
        console.log(`[PROJECTS] Executing deleteProject operation for ${projectId}`);
        try {
          const { error: deleteProjectError } = await supabaseAdmin
            .from('projects')
            .delete()
            .eq('id', projectId);

          if (deleteProjectError) {
            console.error('[PROJECTS] Error deleting project:', deleteProjectError);
            throw deleteProjectError;
          }

          console.log('[PROJECTS] Successfully deleted project');
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('[PROJECTS] Delete project error:', error);
          throw error;
        }

      default:
        console.error('UNKNOWN OPERATION:', operation, 'Available operations:', [
          'fetchSubmissions', 'updateApproval', 'deleteSubmission', 
          'fetchProjects', 'createProject', 'updateProject', 'deleteProject'
        ]);
        throw new Error(`Invalid operation: ${operation}`);
    }

  } catch (error) {
    console.error('GLOBAL ERROR in admin operation:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});