import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Restrict CORS to specific domains
const PRIMARY_ORIGIN = 'https://live-lens-lab.lovable.app'
const PREVIEW_PROJECT_ID = '461fe5b9-9683-4ff4-98b7-a020ea79326b'

function isAllowedOrigin(origin: string) {
  if (!origin) return false
  if (origin === PRIMARY_ORIGIN) return true

  // Allow this project's preview domains (both lovable.app and lovableproject.com)
  if (!origin.includes(PREVIEW_PROJECT_ID)) return false
  return origin.endsWith('.lovable.app') || origin.endsWith('.lovableproject.com')
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || ''
  const allowedOrigin = isAllowedOrigin(origin) ? origin : PRIMARY_ORIGIN

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

// Validation constants
const MAX_HTML_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_FILENAME_LENGTH = 255
const MAX_NOTES_LENGTH = 1000
const ALLOWED_CATEGORIES = ['default', 'test', 'demo', 'game', 'tool', 'app']

// Convert filename to URL-safe slug (ASCII only for storage compatibility)
function fileNameToSlug(fileName: string): string {
  // Remove .html or .htm extension
  let slug = fileName.replace(/\.(html|htm)$/i, '')
  
  // Convert to lowercase and replace non-ASCII chars with hyphens
  // Note: Chinese/non-ASCII characters are not supported by Supabase Storage
  slug = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-') // Only keep ASCII alphanumeric and hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  
  // If slug is empty (e.g., all Chinese chars), generate a unique slug
  if (!slug) {
    // Use a short random string for readability
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let randomPart = ''
    for (let i = 0; i < 8; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    slug = 'page-' + randomPart
  }
  
  return slug
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { htmlContent, fileName, category = 'default', notes = null } = await req.json()

    // Validate required fields exist
    if (!htmlContent || !fileName) {
      return new Response(
        JSON.stringify({ error: 'Missing htmlContent or fileName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate HTML content size
    if (typeof htmlContent !== 'string' || htmlContent.length > MAX_HTML_SIZE) {
      return new Response(
        JSON.stringify({ error: 'HTML content exceeds maximum size of 5MB' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate fileName format and length
    if (typeof fileName !== 'string' || fileName.length > MAX_FILENAME_LENGTH) {
      return new Response(
        JSON.stringify({ error: `File name exceeds maximum length of ${MAX_FILENAME_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate fileName has valid extension
    if (!/\.(html|htm)$/i.test(fileName)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file name. Must have .html or .htm extension' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate category
    if (category && !ALLOWED_CATEGORIES.includes(category)) {
      return new Response(
        JSON.stringify({ error: 'Invalid category' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate notes length
    if (notes && (typeof notes !== 'string' || notes.length > MAX_NOTES_LENGTH)) {
      return new Response(
        JSON.stringify({ error: `Notes exceed maximum length of ${MAX_NOTES_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Basic HTML validation - ensure it contains some HTML-like content
    if (!/<[a-z][\s\S]*>/i.test(htmlContent)) {
      return new Response(
        JSON.stringify({ error: 'Content does not appear to be valid HTML' }),
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
    const corsHeaders = getCorsHeaders(req)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
