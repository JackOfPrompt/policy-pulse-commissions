import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessingRequest {
  filePath: string;
  dataType: string;
  uploadId: string;
}

interface CityRow {
  city_name?: string;
  state_name?: string;
  state_code?: string;
  pincode?: string;
  district?: string;
  region?: string;
  country?: string;
  latitude?: string;
  longitude?: string;
  zone?: string;
  is_capital?: boolean;
  is_metro?: boolean;
  population?: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

async function parseCSVContent(content: string): Promise<CityRow[]> {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  const rows: CityRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    if (values.length < headers.length) continue;
    
    const row: CityRow = {};
    headers.forEach((header, index) => {
      const value = values[index];
      
      // Map common CSV headers to our database columns
      switch (header) {
        case 'city':
        case 'city_name':
        case 'cityname':
          row.city_name = value;
          break;
        case 'state':
        case 'state_name':
        case 'statename':
          row.state_name = value;
          break;
        case 'state_code':
        case 'statecode':
          row.state_code = value;
          break;
        case 'pincode':
        case 'pin':
        case 'postal_code':
          row.pincode = value;
          break;
        case 'district':
          row.district = value;
          break;
        case 'region':
          row.region = value;
          break;
        case 'country':
          row.country = value || 'India';
          break;
        case 'latitude':
        case 'lat':
          row.latitude = value;
          break;
        case 'longitude':
        case 'lng':
        case 'long':
          row.longitude = value;
          break;
        case 'zone':
          row.zone = value;
          break;
        case 'is_capital':
        case 'capital':
          row.is_capital = value?.toLowerCase() === 'true' || value === '1';
          break;
        case 'is_metro':
        case 'metro':
          row.is_metro = value?.toLowerCase() === 'true' || value === '1';
          break;
        case 'population':
          row.population = value;
          break;
      }
    });
    
    // Only add rows with at least city name and state
    if (row.city_name && row.state_name) {
      rows.push(row);
    }
  }
  
  return rows;
}

async function processCitiesData(filePath: string, uploadId: string) {
  console.log(`Processing cities data from: ${filePath}`);
  
  try {
    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('master-data-files')
      .download(filePath);
    
    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }
    
    const content = await fileData.text();
    const cities = await parseCSVContent(content);
    
    console.log(`Parsed ${cities.length} city records`);
    
    // Update upload status
    await supabase
      .from('master_data_file_uploads')
      .update({
        upload_status: 'processing',
        total_records: cities.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', uploadId);
    
    let processedCount = 0;
    let failedCount = 0;
    const batchSize = 100;
    
    // Process in batches
    for (let i = 0; i < cities.length; i += batchSize) {
      const batch = cities.slice(i, i + batchSize);
      
      const insertData = batch.map(city => ({
        city_name: city.city_name,
        state_name: city.state_name,
        state_code: city.state_code,
        pincode: city.pincode,
        district: city.district,
        region: city.region,
        country: city.country || 'India',
        latitude: city.latitude ? parseFloat(city.latitude) : null,
        longitude: city.longitude ? parseFloat(city.longitude) : null,
        zone: city.zone,
        is_capital: city.is_capital || false,
        is_metro: city.is_metro || false,
        population: city.population ? parseInt(city.population) : null,
        is_active: true,
        is_verified: false,
        version: 1,
        source_file_name: filePath.split('/').pop(),
        created_by: null, // Will be set by RLS if needed
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      const { error: insertError } = await supabase
        .from('master_cities')
        .insert(insertData);
      
      if (insertError) {
        console.error(`Batch insert error:`, insertError);
        failedCount += batch.length;
      } else {
        processedCount += batch.length;
      }
      
      // Update progress
      await supabase
        .from('master_data_file_uploads')
        .update({
          processed_records: processedCount,
          failed_records: failedCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', uploadId);
    }
    
    // Final status update
    const finalStatus = failedCount === 0 ? 'completed' : 'completed_with_errors';
    await supabase
      .from('master_data_file_uploads')
      .update({
        upload_status: finalStatus,
        processed_records: processedCount,
        failed_records: failedCount,
        updated_at: new Date().toISOString(),
        error_details: failedCount > 0 ? { 
          message: `${failedCount} records failed to process`,
          processed: processedCount,
          failed: failedCount
        } : null
      })
      .eq('id', uploadId);
    
    console.log(`Processing completed: ${processedCount} processed, ${failedCount} failed`);
    
    return {
      success: true,
      processed: processedCount,
      failed: failedCount,
      total: cities.length
    };
    
  } catch (error) {
    console.error(`Processing failed:`, error);
    
    // Update upload status to failed
    await supabase
      .from('master_data_file_uploads')
      .update({
        upload_status: 'failed',
        error_details: { 
          message: error.message,
          stack: error.stack
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', uploadId);
    
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { filePath, dataType, uploadId }: ProcessingRequest = await req.json();
    
    console.log(`Processing request: ${dataType} file at ${filePath}`);
    
    if (!filePath || !dataType || !uploadId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    let result;
    
    switch (dataType) {
      case 'cities':
        result = await processCitiesData(filePath, uploadId);
        break;
      
      default:
        throw new Error(`Unsupported data type: ${dataType}`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'File processed successfully',
        ...result
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('Processing error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});