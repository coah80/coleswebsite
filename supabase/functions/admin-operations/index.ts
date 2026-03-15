import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// CORS — only allow your actual domain (and localhost for dev)
// ---------------------------------------------------------------------------
const ALLOWED_ORIGINS = [
  'https://coah80.com',
  'https://www.coah80.com',
  'http://localhost:5173',
  'http://localhost:8080',
];

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get('origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
};

// ---------------------------------------------------------------------------
// Rate limiting (in-memory, per-function instance)
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const isRateLimited = (key: string, maxRequests: number, windowMs: number): boolean => {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count += 1;
  return entry.count > maxRequests;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const hashPassword = async (password: string): Promise<string> => {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
};

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  const unauthorized = () =>
    new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: jsonHeaders,
    });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ADMIN_PASSWORD) {
      throw new Error('Missing server configuration');
    }

    const requestBody = await req.json();
    const { operation } = requestBody;

    // -----------------------------------------------------------------------
    // Rate limit login attempts: 5 per minute per IP
    // -----------------------------------------------------------------------
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('cf-connecting-ip')
      ?? 'unknown';

    if (operation === 'login') {
      if (isRateLimited(`login:${clientIp}`, 5, 60_000)) {
        return new Response(JSON.stringify({ error: 'Too many login attempts. Try again later.' }), {
          status: 429,
          headers: jsonHeaders,
        });
      }

      const { password } = requestBody;

      if (!password || typeof password !== 'string') {
        return unauthorized();
      }

      // Constant-time-ish comparison via hashing both sides
      const inputHash = await hashPassword(password);
      const expectedHash = await hashPassword(ADMIN_PASSWORD);

      if (inputHash !== expectedHash) {
        return unauthorized();
      }

      // Return a token that is hash(password + daily salt) so it rotates daily
      const today = new Date().toISOString().slice(0, 10);
      const token = await hashPassword(`${ADMIN_PASSWORD}:${today}`);

      return new Response(JSON.stringify({ success: true, token }), {
        headers: jsonHeaders,
      });
    }

    // -----------------------------------------------------------------------
    // All other operations require a valid token
    // -----------------------------------------------------------------------
    const { token } = requestBody;
    const today = new Date().toISOString().slice(0, 10);
    const expectedToken = await hashPassword(`${ADMIN_PASSWORD}:${today}`);

    if (!token || typeof token !== 'string' || token !== expectedToken) {
      return unauthorized();
    }

    // Rate limit admin operations: 60 per minute
    if (isRateLimited(`admin:${clientIp}`, 60, 60_000)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: jsonHeaders,
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // -----------------------------------------------------------------------
    // Operations
    // -----------------------------------------------------------------------
    switch (operation) {
      // === SUBMISSIONS ===
      case 'fetchSubmissions': {
        const { data: submissions, error } = await supabaseAdmin
          .from('submissions')
          .select('*')
          .order('submitted_at', { ascending: false });

        if (error) throw error;
        return new Response(JSON.stringify({ submissions }), { headers: jsonHeaders });
      }

      case 'updateApproval': {
        const { submissionId, approved } = requestBody;
        if (!submissionId || typeof approved !== 'boolean') {
          return new Response(JSON.stringify({ error: 'Invalid parameters' }), {
            status: 400, headers: jsonHeaders,
          });
        }

        const { error } = await supabaseAdmin
          .from('submissions')
          .update({ is_approved: approved })
          .eq('id', submissionId);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
      }

      case 'deleteSubmission': {
        const { submissionId } = requestBody;
        if (!submissionId) {
          return new Response(JSON.stringify({ error: 'Missing submissionId' }), {
            status: 400, headers: jsonHeaders,
          });
        }

        const { error } = await supabaseAdmin
          .from('submissions')
          .delete()
          .eq('id', submissionId);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
      }

      // === PROJECTS ===
      case 'fetchProjects': {
        const { data: projects, error } = await supabaseAdmin
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return new Response(JSON.stringify({ projects }), { headers: jsonHeaders });
      }

      case 'createProject': {
        const { projectData } = requestBody;
        if (!projectData?.title) {
          return new Response(JSON.stringify({ error: 'Project title is required' }), {
            status: 400, headers: jsonHeaders,
          });
        }

        const { data: newProject, error } = await supabaseAdmin
          .from('projects')
          .insert([projectData])
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ project: newProject }), { headers: jsonHeaders });
      }

      case 'updateProject': {
        const { projectId, projectData } = requestBody;
        if (!projectId || !projectData) {
          return new Response(JSON.stringify({ error: 'Missing projectId or projectData' }), {
            status: 400, headers: jsonHeaders,
          });
        }

        const { data: updatedProject, error } = await supabaseAdmin
          .from('projects')
          .update(projectData)
          .eq('id', projectId)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ project: updatedProject }), { headers: jsonHeaders });
      }

      case 'deleteProject': {
        const { projectId } = requestBody;
        if (!projectId) {
          return new Response(JSON.stringify({ error: 'Missing projectId' }), {
            status: 400, headers: jsonHeaders,
          });
        }

        const { error } = await supabaseAdmin
          .from('projects')
          .delete()
          .eq('id', projectId);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
      }

      // === SOCIAL LINKS ===
      case 'fetchSocialLinks': {
        const { data: socialLinks, error } = await supabaseAdmin
          .from('social_links')
          .select('*')
          .order('display_order', { ascending: true });

        if (error) throw error;
        return new Response(JSON.stringify({ socialLinks }), { headers: jsonHeaders });
      }

      case 'createSocialLink': {
        const { linkData } = requestBody;
        if (!linkData?.name || !linkData?.handle || !linkData?.url) {
          return new Response(JSON.stringify({ error: 'name, handle, and url are required' }), {
            status: 400, headers: jsonHeaders,
          });
        }

        const { data: newLink, error } = await supabaseAdmin
          .from('social_links')
          .insert([linkData])
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ socialLink: newLink }), { headers: jsonHeaders });
      }

      case 'updateSocialLink': {
        const { linkId, linkData } = requestBody;
        if (!linkId || !linkData) {
          return new Response(JSON.stringify({ error: 'Missing linkId or linkData' }), {
            status: 400, headers: jsonHeaders,
          });
        }

        const { data: updatedLink, error } = await supabaseAdmin
          .from('social_links')
          .update(linkData)
          .eq('id', linkId)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ socialLink: updatedLink }), { headers: jsonHeaders });
      }

      case 'deleteSocialLink': {
        const { linkId } = requestBody;
        if (!linkId) {
          return new Response(JSON.stringify({ error: 'Missing linkId' }), {
            status: 400, headers: jsonHeaders,
          });
        }

        const { error } = await supabaseAdmin
          .from('social_links')
          .delete()
          .eq('id', linkId);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
      }

      case 'reorderSocialLinks': {
        const { updates } = requestBody;
        if (!Array.isArray(updates)) {
          return new Response(JSON.stringify({ error: 'updates must be an array' }), {
            status: 400, headers: jsonHeaders,
          });
        }

        for (const { id, display_order } of updates) {
          const { error } = await supabaseAdmin
            .from('social_links')
            .update({ display_order })
            .eq('id', id);
          if (error) throw error;
        }

        return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
      }

      // === IMAGE UPLOAD ===
      case 'uploadImage': {
        const { fileName, fileBase64, contentType } = requestBody;
        if (!fileName || !fileBase64 || !contentType) {
          return new Response(JSON.stringify({ error: 'Missing upload parameters' }), {
            status: 400, headers: jsonHeaders,
          });
        }

        // Validate content type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(contentType)) {
          return new Response(JSON.stringify({ error: 'Invalid file type' }), {
            status: 400, headers: jsonHeaders,
          });
        }

        // Decode base64
        const binaryString = atob(fileBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const { error: uploadError } = await supabaseAdmin.storage
          .from('portfolio')
          .upload(fileName, bytes, { contentType });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('portfolio')
          .getPublicUrl(fileName);

        return new Response(JSON.stringify({ publicUrl }), { headers: jsonHeaders });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid operation' }), {
          status: 400, headers: jsonHeaders,
        });
    }
  } catch (error) {
    console.error('Admin operation error:', error?.message);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
