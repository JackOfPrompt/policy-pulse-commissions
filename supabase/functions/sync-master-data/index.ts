import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { entityType, syncType } = await req.json()

    console.log(`Starting sync for entity: ${entityType}, type: ${syncType}`)

    let syncResults = { success: false, message: '', details: {} }

    switch (entityType) {
      case 'uin_codes':
        syncResults = await syncUINCodesWithProviders(supabaseClient)
        break
      case 'addons':
        syncResults = await syncAddonsWithProducts(supabaseClient)
        break
      case 'benefits':
        syncResults = await syncBenefitsWithProducts(supabaseClient)
        break
      case 'cities':
        syncResults = await syncCitiesWithBranches(supabaseClient)
        break
      default:
        syncResults = {
          success: false,
          message: `Sync not implemented for entity type: ${entityType}`,
          details: {}
        }
    }

    return new Response(
      JSON.stringify(syncResults),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: syncResults.success ? 200 : 400
      }
    )

  } catch (error) {
    console.error('Sync error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message,
        details: { error: error.toString() }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

async function syncUINCodesWithProviders(supabase: any) {
  try {
    console.log('Starting UIN codes sync with providers...')
    
    // Get all active UIN codes grouped by insurer
    const { data: uinCodes, error: uinError } = await supabase
      .from('master_uin_codes')
      .select('insurer_name, uin_code, product_name, line_of_business, status')
      .eq('is_active', true)
      .eq('status', 'active')

    if (uinError) throw uinError

    // Group by insurer
    const insurerGroups = uinCodes.reduce((acc: any, item: any) => {
      if (!acc[item.insurer_name]) {
        acc[item.insurer_name] = {
          uinCodes: [],
          products: [],
          lobs: new Set()
        }
      }
      acc[item.insurer_name].uinCodes.push(item.uin_code)
      acc[item.insurer_name].products.push(item.product_name)
      acc[item.insurer_name].lobs.add(item.line_of_business)
      return acc
    }, {})

    let synced = 0
    let created = 0
    let errors = 0

    for (const [insurerName, data] of Object.entries(insurerGroups)) {
      try {
        // Check if provider exists
        const { data: existingProvider, error: providerError } = await supabase
          .from('insurance_providers')
          .select('id, provider_name')
          .ilike('provider_name', `%${insurerName}%`)
          .single()

        if (providerError && providerError.code !== 'PGRST116') {
          throw providerError
        }

        if (existingProvider) {
          // Provider exists, log the mapping
          console.log(`Found existing provider: ${insurerName} with ${(data as any).uinCodes.length} UIN codes`)
          synced++
        } else {
          // Create new provider
          const { error: insertError } = await supabase
            .from('insurance_providers')
            .insert({
              provider_name: insurerName,
              status: 'Active',
              is_auto_created: true,
              contact_person: 'Auto-created from UIN data',
              support_email: `support@${insurerName.toLowerCase().replace(/\s+/g, '')}.com`
            })

          if (insertError) throw insertError
          created++
          console.log(`Created new provider: ${insurerName}`)
        }
      } catch (error) {
        console.error(`Error processing insurer ${insurerName}:`, error)
        errors++
      }
    }

    return {
      success: true,
      message: `UIN codes sync completed: ${synced} existing providers synced, ${created} new providers created`,
      details: {
        totalInsurers: Object.keys(insurerGroups).length,
        syncedExisting: synced,
        createdNew: created,
        errors: errors
      }
    }

  } catch (error) {
    throw new Error(`UIN sync failed: ${error.message}`)
  }
}

async function syncAddonsWithProducts(supabase: any) {
  try {
    console.log('Starting addons sync with products...')
    
    // Get all active addons
    const { data: addons, error: addonsError } = await supabase
      .from('master_addons')
      .select('*')
      .eq('is_active', true)

    if (addonsError) throw addonsError

    // Get all products that could use these addons
    const { data: products, error: productsError } = await supabase
      .from('insurance_products')
      .select('id, name, line_of_business_id, available_addons')
      .eq('status', 'Active')

    if (productsError) throw productsError

    let updated = 0

    // Map addons to products by line of business
    for (const product of products) {
      const relevantAddons = addons.filter(addon => 
        addon.line_of_business === product.line_of_business_id ||
        addon.line_of_business.toLowerCase() === product.line_of_business_id?.toLowerCase()
      )

      if (relevantAddons.length > 0) {
        const addonData = relevantAddons.map(addon => ({
          id: addon.id,
          name: addon.addon_name,
          code: addon.addon_code,
          type: addon.addon_type,
          basePremium: addon.base_premium,
          premiumPercentage: addon.premium_percentage,
          isMandatory: addon.is_mandatory
        }))

        const { error: updateError } = await supabase
          .from('insurance_products')
          .update({ available_addons: addonData })
          .eq('id', product.id)

        if (updateError) {
          console.error(`Error updating product ${product.name}:`, updateError)
        } else {
          updated++
        }
      }
    }

    return {
      success: true,
      message: `Addons sync completed: ${updated} products updated with addon mappings`,
      details: {
        totalAddons: addons.length,
        totalProducts: products.length,
        updatedProducts: updated
      }
    }

  } catch (error) {
    throw new Error(`Addons sync failed: ${error.message}`)
  }
}

async function syncBenefitsWithProducts(supabase: any) {
  try {
    console.log('Starting benefits sync with products...')
    
    // Similar to addons but for benefits
    const { data: benefits, error: benefitsError } = await supabase
      .from('master_benefits')
      .select('*')
      .eq('is_active', true)

    if (benefitsError) throw benefitsError

    const { data: products, error: productsError } = await supabase
      .from('insurance_products')
      .select('id, name, line_of_business_id, features')
      .eq('status', 'Active')

    if (productsError) throw productsError

    let updated = 0

    for (const product of products) {
      const relevantBenefits = benefits.filter(benefit => 
        benefit.line_of_business === product.line_of_business_id ||
        benefit.line_of_business.toLowerCase() === product.line_of_business_id?.toLowerCase()
      )

      if (relevantBenefits.length > 0) {
        const benefitFeatures = relevantBenefits.map(benefit => benefit.benefit_name)
        const existingFeatures = product.features || []
        const combinedFeatures = [...new Set([...existingFeatures, ...benefitFeatures])]

        const { error: updateError } = await supabase
          .from('insurance_products')
          .update({ features: combinedFeatures })
          .eq('id', product.id)

        if (!updateError) {
          updated++
        }
      }
    }

    return {
      success: true,
      message: `Benefits sync completed: ${updated} products updated with benefit features`,
      details: {
        totalBenefits: benefits.length,
        totalProducts: products.length,
        updatedProducts: updated
      }
    }

  } catch (error) {
    throw new Error(`Benefits sync failed: ${error.message}`)
  }
}

async function syncCitiesWithBranches(supabase: any) {
  try {
    console.log('Starting cities sync with branches...')
    
    // Get all active cities
    const { data: cities, error: citiesError } = await supabase
      .from('master_cities')
      .select('*')
      .eq('is_active', true)

    if (citiesError) throw citiesError

    // Get all branches
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('id, city, state, pincode')
      .eq('status', 'Active')

    if (branchesError) throw branchesError

    let matched = 0
    let suggestions = []

    // Match branches with cities for data validation
    for (const branch of branches) {
      const matchingCity = cities.find(city => 
        city.city_name.toLowerCase() === branch.city?.toLowerCase() &&
        city.state_name.toLowerCase() === branch.state?.toLowerCase()
      )

      if (matchingCity) {
        matched++
        // Validate pincode if both exist
        if (branch.pincode && matchingCity.pincode !== branch.pincode) {
          suggestions.push({
            branchId: branch.id,
            suggestion: `Pincode mismatch: Branch has ${branch.pincode}, master data has ${matchingCity.pincode}`,
            recommendedAction: 'Update branch pincode or verify master data'
          })
        }
      } else {
        suggestions.push({
          branchId: branch.id,
          suggestion: `City not found in master data: ${branch.city}, ${branch.state}`,
          recommendedAction: 'Add city to master data or verify branch location'
        })
      }
    }

    return {
      success: true,
      message: `Cities sync completed: ${matched} branches matched with master city data`,
      details: {
        totalCities: cities.length,
        totalBranches: branches.length,
        matchedBranches: matched,
        suggestions: suggestions.slice(0, 10) // Limit suggestions
      }
    }

  } catch (error) {
    throw new Error(`Cities sync failed: ${error.message}`)
  }
}