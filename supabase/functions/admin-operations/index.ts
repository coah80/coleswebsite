import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

const unauthorized = () =>
  new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: jsonHeaders,
  });

const hashPassword = async (password: string): Promise<string> => {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return new TextDecoder().decode(hexEncode(new Uint8Array(hash)));
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ADMIN_PASSWORD) {
      throw new Error('Missing server configuration');
    }

    const requestBody = await req.json();
    const { operation, token, password, submissionId, approved, projectData, projectId } = requestBody;

    const expectedToken = await hashPassword(ADMIN_PASSWORD);

    if (operation === 'login') {
      if (password !== ADMIN_PASSWORD) {
        return unauthorized();
      }
      return new Response(JSON.stringify({ success: true, token: expectedToken }), {
        headers: jsonHeaders,
      });
    }

    if (!token || token !== expectedToken) {
      return unauthorized();
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    switch (operation) {
      case 'fetchSubmissions': {
        const { data: submissions, error: fetchError } = await supabaseAdmin
          .from('submissions')
          .select('*')
          .order('submitted_at', { ascending: false });

        if (fetchError) throw fetchError;

        return new Response(JSON.stringify({ submissions }), {
          headers: jsonHeaders,
        });
      }

      case 'updateApproval': {
        const { error: updateError } = await supabaseAdmin
          .from('submissions')
          .update({ is_approved: approved })
          .eq('id', submissionId);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ success: true }), {
          headers: jsonHeaders,
        });
      }

      case 'deleteSubmission': {
        const { error: deleteError } = await supabaseAdmin
          .from('submissions')
          .delete()
          .eq('id', submissionId);

        if (deleteError) throw deleteError;

        return new Response(JSON.stringify({ success: true }), {
          headers: jsonHeaders,
        });
      }

      case 'fetchProjects': {
        const { data: projects, error: fetchProjectsError } = await supabaseAdmin
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchProjectsError) throw fetchProjectsError;

        return new Response(JSON.stringify({ projects }), {
          headers: jsonHeaders,
        });
      }

      case 'createProject': {
        const { data: newProject, error: createError } = await supabaseAdmin
          .from('projects')
          .insert([projectData])
          .select()
          .single();

        if (createError) throw createError;

        return new Response(JSON.stringify({ project: newProject }), {
          headers: jsonHeaders,
        });
      }

      case 'updateProject': {
        const { data: updatedProject, error: updateProjectError } = await supabaseAdmin
          .from('projects')
          .update(projectData)
          .eq('id', projectId)
          .select()
          .single();

        if (updateProjectError) throw updateProjectError;

        return new Response(JSON.stringify({ project: updatedProject }), {
          headers: jsonHeaders,
        });
      }

      case 'deleteProject': {
        const { error: deleteProjectError } = await supabaseAdmin
          .from('projects')
          .delete()
          .eq('id', projectId);

        if (deleteProjectError) throw deleteProjectError;

        return new Response(JSON.stringify({ success: true }), {
          headers: jsonHeaders,
        });
      }

      default:
        throw new Error(`Invalid operation: ${operation}`);
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});