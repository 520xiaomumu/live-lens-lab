import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate random slug
function generateSlug(length = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { htmlContent, fileName, category = 'default', notes = null } = await req.json()

    if (!htmlContent || !fileName) {
      return new Response(
        JSON.stringify({ error: 'Missing htmlContent or fileName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Generate unique slug
    let slug = generateSlug()
    let attempts = 0
    const maxAttempts = 10

    // Check for slug collision
    while (attempts < maxAttempts) {
      const { data: existing } = await supabase
        .from('deployments')
        .select('slug')
        .eq('slug', slug)
        .maybeSingle()

      if (!existing) break
      slug = generateSlug()
      attempts++
    }

    if (attempts >= maxAttempts) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate unique slug' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Upload HTML file to storage
    const filePath = `${slug}/index.html`
    const { error: uploadError } = await supabase.storage
      .from('html-pages')
      .upload(filePath, htmlContent, {
        contentType: 'text/html',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Failed to upload file', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('html-pages')
      .getPublicUrl(filePath)

    // Save deployment record
    const { error: insertError } = await supabase
      .from('deployments')
      .insert({
        slug,
        file_name: fileName,
        file_path: filePath,
        public_url: publicUrl,
        category,
        status: 'active',
        notes,
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      // Clean up uploaded file
      await supabase.storage.from('html-pages').remove([filePath])
      return new Response(
        JSON.stringify({ error: 'Failed to save deployment record', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        slug,
        publicUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Deploy error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
