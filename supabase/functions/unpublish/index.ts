import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Restrict CORS to specific domains
const ALLOWED_ORIGINS = [
  'https://live-lens-lab.lovable.app',
  'https://id-preview--461fe5b9-9683-4ff4-98b7-a020ea79326b.lovable.app'
]

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { deploymentId } = await req.json()

    // Validate required field
    if (!deploymentId || typeof deploymentId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid deploymentId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(deploymentId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid deploymentId format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if deployment exists and is active
    const { data: deployment, error: fetchError } = await supabase
      .from('deployments')
      .select('id, status, slug')
      .eq('id', deploymentId)
      .maybeSingle()

    if (fetchError) {
      console.error('Fetch error:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch deployment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!deployment) {
      return new Response(
        JSON.stringify({ error: 'Deployment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (deployment.status === 'unpublished') {
      return new Response(
        JSON.stringify({ error: 'Deployment is already unpublished' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update status to unpublished
    const { error: updateError } = await supabase
      .from('deployments')
      .update({ status: 'unpublished' })
      .eq('id', deploymentId)

    if (updateError) {
      console.error('Update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to unpublish deployment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '页面已下架',
        slug: deployment.slug,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unpublish error:', error)
    const corsHeaders = getCorsHeaders(req)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
