import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Convert filename to URL-safe slug
function fileNameToSlug(fileName: string): string {
  // Remove .html or .htm extension
  let slug = fileName.replace(/\.(html|htm)$/i, '')
  
  // Convert to lowercase and replace spaces/special chars with hyphens
  slug = slug
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, '-') // Keep alphanumeric, Chinese chars, and hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  
  // Ensure slug is not empty
  if (!slug) {
    slug = 'page-' + Date.now()
  }
  
  return slug
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

    // Generate slug from filename
    const slug = fileNameToSlug(fileName)

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('deployments')
      .select('slug, file_name, status')
      .eq('slug', slug)
      .eq('status', 'active')
      .maybeSingle()

    if (existing) {
      return new Response(
        JSON.stringify({ 
          error: 'SLUG_EXISTS',
          message: `域名后缀 "${slug}" 已被使用（文件：${existing.file_name}）。请修改文件名后重试，或先下架原有部署。`,
          existingSlug: slug,
          existingFileName: existing.file_name
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
