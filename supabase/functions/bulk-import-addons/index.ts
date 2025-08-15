import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BulkImportRow {
  addon_code: string;
  addon_name: string;
  addon_category?: string;
  description?: string;
  premium_type?: string;
  premium_basis?: string;
  calc_value?: number;
  min_amount?: number;
  max_amount?: number;
  waiting_period_months?: number;
  is_mandatory?: boolean;
  is_active?: boolean;
  eligibility_json?: string;
}

interface ImportResult {
  row: number;
  data?: BulkImportRow;
  error?: string;
  success: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, message: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, message: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return new Response(
        JSON.stringify({ success: false, message: 'File must be a CSV' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return new Response(
        JSON.stringify({ success: false, message: 'CSV must contain header and at least one data row' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const results: ImportResult[] = []
    let successCount = 0
    let errorCount = 0

    console.log('Processing CSV with headers:', headers)

    // Validate required headers
    const requiredHeaders = ['addon_code', 'addon_name']
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    
    if (missingHeaders.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Missing required headers: ${missingHeaders.join(', ')}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      const rowNumber = i + 1
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      
      try {
        if (values.length !== headers.length) {
          throw new Error(`Row ${rowNumber}: Column count mismatch. Expected ${headers.length}, got ${values.length}`)
        }

        const row: BulkImportRow = {
          addon_code: '',
          addon_name: ''
        }

        // Map CSV values to row object
        headers.forEach((header, index) => {
          const value = values[index]
          
          switch (header) {
            case 'addon_code':
              row.addon_code = value
              break
            case 'addon_name':
              row.addon_name = value
              break
            case 'addon_category':
              row.addon_category = value || 'Add-on'
              break
            case 'description':
              row.description = value || undefined
              break
            case 'premium_type':
              row.premium_type = value || 'Flat'
              break
            case 'premium_basis':
              row.premium_basis = value || 'PerPolicy'
              break
            case 'calc_value':
              row.calc_value = value ? parseFloat(value) : undefined
              break
            case 'min_amount':
              row.min_amount = value ? parseFloat(value) : undefined
              break
            case 'max_amount':
              row.max_amount = value ? parseFloat(value) : undefined
              break
            case 'waiting_period_months':
              row.waiting_period_months = value ? parseInt(value) : undefined
              break
            case 'is_mandatory':
              row.is_mandatory = value?.toLowerCase() === 'true' || value === '1'
              break
            case 'is_active':
              row.is_active = value ? (value.toLowerCase() === 'true' || value === '1') : true
              break
            case 'eligibility_json':
              if (value) {
                try {
                  JSON.parse(value)
                  row.eligibility_json = value
                } catch {
                  throw new Error(`Invalid JSON in eligibility_json: ${value}`)
                }
              }
              break
          }
        })

        // Validate required fields
        if (!row.addon_code) {
          throw new Error('addon_code is required')
        }
        if (!row.addon_name) {
          throw new Error('addon_name is required')
        }

        // Validate enum values
        const validAddonCategories = ['Rider', 'Add-on']
        if (row.addon_category && !validAddonCategories.includes(row.addon_category)) {
          throw new Error(`Invalid addon_category. Must be one of: ${validAddonCategories.join(', ')}`)
        }

        const validPremiumTypes = ['Flat', 'PercentOfBase', 'AgeBand', 'Slab']
        if (row.premium_type && !validPremiumTypes.includes(row.premium_type)) {
          throw new Error(`Invalid premium_type. Must be one of: ${validPremiumTypes.join(', ')}`)
        }

        const validPremiumBasis = ['PerPolicy', 'PerMember']
        if (row.premium_basis && !validPremiumBasis.includes(row.premium_basis)) {
          throw new Error(`Invalid premium_basis. Must be one of: ${validPremiumBasis.join(', ')}`)
        }

        // Check for duplicate addon_code
        const { data: existing } = await supabase
          .from('master_addon')
          .select('addon_id')
          .eq('addon_code', row.addon_code)
          .single()

        if (existing) {
          throw new Error(`Addon code '${row.addon_code}' already exists`)
        }

        // Insert the addon
        const insertData: any = {
          addon_code: row.addon_code,
          addon_name: row.addon_name,
          addon_category: row.addon_category || 'Add-on',
          description: row.description,
          premium_type: row.premium_type || 'Flat',
          premium_basis: row.premium_basis || 'PerPolicy',
          calc_value: row.calc_value,
          min_amount: row.min_amount,
          max_amount: row.max_amount,
          waiting_period_months: row.waiting_period_months,
          is_mandatory: row.is_mandatory || false,
          is_active: row.is_active !== undefined ? row.is_active : true,
          eligibility_json: row.eligibility_json ? JSON.parse(row.eligibility_json) : null
        }

        const { error } = await supabase
          .from('master_addon')
          .insert(insertData)

        if (error) {
          throw new Error(error.message)
        }

        results.push({
          row: rowNumber,
          data: row,
          success: true
        })
        successCount++

      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error)
        results.push({
          row: rowNumber,
          error: error.message,
          success: false
        })
        errorCount++
      }
    }

    // Generate error report if there are errors
    let errorReportUrl = null
    if (errorCount > 0) {
      const errorRows = results.filter(r => !r.success)
      const errorCsv = [
        'Row,Error',
        ...errorRows.map(r => `${r.row},"${r.error}"`)
      ].join('\n')

      // Store error report in storage (you might want to implement this)
      console.log('Error report generated:', errorCsv)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Import completed. ${successCount} successful, ${errorCount} failed.`,
        data: {
          total: results.length,
          successful: successCount,
          failed: errorCount,
          results: results,
          errorReportUrl
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Bulk import error:', error)
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})