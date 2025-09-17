import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import pdf from "npm:pdf-parse";

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Initialize Supabase client
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Schema definitions for different product types
const getProductTypeSchema = (productType: string) => {
  const commonSections = {
    "customer": {
      "label": "Customer Details",
      "fields": [
        { "field": "CUSTOMER_NAME", "label": "Customer Name", "type": "string", "required": true },
        { "field": "CUSTOMER_ADDRESS", "label": "Customer Address", "type": "string" },
        { "field": "CUSTOMER_PHONE", "label": "Phone Number", "type": "string" },
        { "field": "CUSTOMER_EMAIL", "label": "Email", "type": "string" },
        { "field": "CUSTOMER_DOB", "label": "Date of Birth", "type": "date" },
        { "field": "DOCUMENT_TYPE", "label": "Document Type", "type": "string" },
        { "field": "DOCUMENT_NUMBER", "label": "Document Number", "type": "string" },
        { "field": "MARITAL_STATUS", "label": "Marital Status", "type": "select", "options": ["Single", "Married", "Divorced", "Widowed"] },
        { "field": "GENDER", "label": "Gender", "type": "select", "options": ["Male", "Female", "Other"] }
      ]
    },
    "insurance_provider": {
      "label": "Insurance Provider Details",
      "fields": [
        { "field": "PROVIDER_NAME", "label": "Provider Name", "type": "string" },
        { "field": "PROVIDER_UIN", "label": "UIN", "type": "string" },
        { "field": "PROVIDER_ADDRESS", "label": "Provider Address", "type": "string" },
        { "field": "PROVIDER_EMAIL", "label": "Contact Email", "type": "string" },
        { "field": "PROVIDER_PHONE", "label": "Contact Phone", "type": "string" },
        { "field": "PROVIDER_BRANCH", "label": "Branch", "type": "string" }
      ]
    },
    "business_details": {
      "label": "Business Details",
      "fields": [
        { "field": "CUSTOMER_TYPE", "label": "Customer Type", "type": "select", "options": ["Individual", "Corporate"] },
        { "field": "OCCUPATION_OR_BUSINESS_TYPE", "label": "Occupation/Business Type", "type": "string" },
        { "field": "GSTIN", "label": "GSTIN", "type": "string" },
        { "field": "SAC_CODE", "label": "SAC Code", "type": "string" },
        { "field": "BRANCH_CODE", "label": "Branch Code", "type": "string" }
      ]
    }
  };

  const policySection = {
    "policy": {
      "label": "Policy Details",
      "fields": [
        { "field": "POLICY_NUMBER", "label": "Policy Number", "type": "string", "required": true },
        { "field": "POLICY_START_DATE", "label": "Policy Start Date", "type": "date" },
        { "field": "POLICY_END_DATE", "label": "Policy End Date", "type": "date" },
        { "field": "POLICY_ISSUE_DATE", "label": "Policy Issue Date", "type": "date" },
        { "field": "GROSS_PREMIUM", "label": "Gross Premium", "type": "number" },
        { "field": "NET_PREMIUM", "label": "Net Premium", "type": "number" },
        { "field": "GST", "label": "GST", "type": "number" },
        { "field": "SUM_INSURED", "label": "Sum Insured", "type": "number" },
        { "field": "PRODUCT_TYPE", "label": "Product Type", "type": "string" },
        { "field": "POLICY_TYPE", "label": "Policy Type", "type": "string" },
        { "field": "PLAN_NAME", "label": "Plan Name", "type": "string" }
      ]
    }
  };

  // Add product-specific fields
  if (productType === 'health') {
    commonSections.customer.fields.push(
      { "field": "NOMINEE_NAME", "label": "Nominee Name", "type": "string" },
      { "field": "NOMINEE_DOB", "label": "Nominee DOB", "type": "date" },
      { "field": "NOMINEE_RELATION", "label": "Nominee Relation", "type": "string" }
    );
    
    policySection.policy.fields.push(
      { "field": "POLICY_TENURE", "label": "Policy Tenure (Years)", "type": "number" },
      { "field": "PREVIOUS_MEDICAL_CONDITION", "label": "Previous Medical Condition", "type": "string" },
      { "field": "MEMBER_COUNT", "label": "Member Count", "type": "number" },
      { "field": "INSURED_PERSONS", "label": "Insured Persons", "type": "array", "arrayType": "object", "schema": [
        { "field": "name", "label": "Full Name", "type": "string", "required": true },
        { "field": "dob", "label": "Date of Birth", "type": "date", "required": true },
        { "field": "gender", "label": "Gender", "type": "select", "options": ["Male", "Female", "Other"], "required": true },
        { "field": "age", "label": "Age", "type": "number" },
        { "field": "relationship_with_proposer", "label": "Relationship with Proposer", "type": "string", "required": true },
        { "field": "member_id", "label": "Member ID", "type": "string" },
        { "field": "pre_existing_diseases", "label": "Pre-existing Diseases", "type": "string" },
        { "field": "date_insured_since", "label": "Date Insured Since", "type": "date" }
      ]},
      { "field": "COVER_TILL_AGE", "label": "Cover Till Age", "type": "number" },
      { "field": "PREVIOUS_POLICY_COMPANY_NAME", "label": "Previous Policy Company", "type": "string" },
      { "field": "PREVIOUS_POLICY_NUMBER", "label": "Previous Policy Number", "type": "string" }
    );
  }
  
  if (productType === 'life') {
    commonSections.customer.fields.push(
      { "field": "NOMINEE_NAME", "label": "Nominee Name", "type": "string" },
      { "field": "NOMINEE_DOB", "label": "Nominee DOB", "type": "date" },
      { "field": "NOMINEE_RELATION", "label": "Nominee Relation", "type": "string" }
    );
    
    policySection.policy.fields.push(
      { "field": "POLICY_TENURE", "label": "Policy Tenure (Years)", "type": "number" },
      { "field": "COVER_TILL_AGE", "label": "Cover Till Age", "type": "number" },
      { "field": "POLICY_PAYMENT_TERM", "label": "Policy Payment Term", "type": "string" },
      { "field": "PAYMENT_TERM", "label": "Payment Term", "type": "string" },
      { "field": "PAYMENT_MODE", "label": "Payment Mode", "type": "string" }
    );
  }

  if (productType === 'motor') {
    policySection.policy.fields.push(
      { "field": "NCB", "label": "No Claim Bonus", "type": "number" },
      { "field": "THIRD_PARTY_PREMIUM", "label": "Third Party Premium", "type": "number" },
      { "field": "OWN_DAMAGE_PREMIUM", "label": "Own Damage Premium", "type": "number" },
      { "field": "IDV", "label": "Insured Declared Value", "type": "number" }
    );
  }

  const schema = { ...commonSections, ...policySection };

  // Add vehicle section for motor policies
  if (productType === 'motor') {
    schema["vehicle"] = {
      "label": "Vehicle Details",
      "fields": [
        { "field": "VEHICLE_NUMBER", "label": "Vehicle Number", "type": "string" },
        { "field": "VEHICLE_MAKE", "label": "Vehicle Make", "type": "string" },
        { "field": "VEHICLE_MODEL", "label": "Vehicle Model", "type": "string" },
        { "field": "VEHICLE_VARIANT", "label": "Vehicle Variant", "type": "string" },
        { "field": "FUEL_TYPE", "label": "Fuel Type", "type": "string" },
        { "field": "VEHICLE_CC", "label": "Vehicle CC", "type": "number" },
        { "field": "VEHICLE_ENGINE_NUMBER", "label": "Engine Number", "type": "string" },
        { "field": "VEHICLE_CHASSID", "label": "Chassis ID", "type": "string" },
        { "field": "MFG_DATE", "label": "Manufacturing Date", "type": "date" },
        { "field": "VEHICLE_REGISTRATION_DATE", "label": "Registration Date", "type": "date" },
        { "field": "RTO_LOCATION", "label": "RTO Location", "type": "string" }
      ]
    };
  }

  return schema;
};

// Helper function to create empty schema structure
function createEmptySchema(schema: any) {
  const emptyData: any = {};
  Object.keys(schema).forEach(sectionKey => {
    emptyData[sectionKey] = {};
    schema[sectionKey].fields.forEach((field: any) => {
      if (field.type === 'array') {
        emptyData[sectionKey][field.field] = [];
      } else {
        emptyData[sectionKey][field.field] = null;
      }
    });
  });
  return emptyData;
}

// Process large PDFs in chunks with improved error handling
function chunkText(text: string, maxLength: number = 35000): string[] {
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.slice(i, i + maxLength));
  }
  return chunks;
}

// Enhanced Gemini API call with better error handling
async function callGeminiAPI(prompt: string, chunkIndex: number): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          maxOutputTokens: 4000,
          temperature: 0.1,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error for chunk ${chunkIndex + 1}:`, errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    
    if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error(`Unexpected Gemini response structure for chunk ${chunkIndex + 1}`);
      return { success: false, error: 'Unexpected response structure' };
    }

    return { success: true, data: data.candidates[0].content.parts[0].text };

  } catch (error) {
    console.error(`Gemini API request failed for chunk ${chunkIndex + 1}:`, error);
    return { success: false, error: error.message };
  }
}

// Save corrected data for training
async function saveTrainingData(originalData: any, correctedData: any, policyId: string): Promise<void> {
  try {
    const trainingEntry = {
      policy_id: policyId,
      original_extraction: originalData,
      corrected_data: correctedData,
      timestamp: new Date().toISOString(),
      version: "1.0"
    };

    const fileName = `training_${policyId}_${Date.now()}.json`;
    
    await supabase.storage
      .from('policy_training')
      .upload(fileName, JSON.stringify(trainingEntry, null, 2), {
        contentType: 'application/json'
      });

    console.log('Training data saved successfully:', fileName);
  } catch (error) {
    console.error('Failed to save training data:', error);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!geminiApiKey) {
      console.error('Gemini API key not found');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Gemini API key not configured',
          extracted: {},
          warnings: ['API key missing']
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { filePath, fileText, schema, productType = 'general', saveTraining = false, policyId } = await req.json();

    let extractedText = fileText;
    let policySchema = schema || getProductTypeSchema(productType);
    const warnings: string[] = [];

    // If filePath is provided, download and extract text from file
    if (filePath && !fileText) {
      console.log('Downloading file from Supabase Storage:', filePath);
      
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('policies')
        .download(filePath);

      if (downloadError) {
        console.error('Failed to download file:', downloadError);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Failed to download file: ' + downloadError.message,
            extracted: {},
            warnings: ['File download failed']
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Extract text based on file type
      if (filePath.endsWith('.txt')) {
        extractedText = await fileData.text();
      } else if (filePath.endsWith('.pdf')) {
        console.log('Extracting text from PDF...');
        try {
          const buffer = await fileData.arrayBuffer();
          const pdfBuffer = new Uint8Array(buffer);
          const parsed = await pdf(pdfBuffer);
          extractedText = parsed.text;
          
          // If PDF parsing returned little or no text, warn about potential OCR need
          if (!extractedText || extractedText.trim().length < 100) {
            console.log('PDF text extraction yielded minimal content');
            warnings.push('PDF text extraction was minimal - document may be image-based');
          }
          
          console.log('PDF text extracted successfully, length:', extractedText.length);
        } catch (pdfError) {
          console.error('PDF parsing error:', pdfError);
          return new Response(
            JSON.stringify({ 
              success: false,
              error: 'Failed to parse PDF: ' + pdfError.message,
              extracted: {},
              warnings: ['PDF parsing failed']
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Unsupported file type. Only .txt and .pdf files are supported.',
            extracted: {},
            warnings: ['Unsupported file type']
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    if (!extractedText) {
      console.error('No text content provided');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No text content provided',
          extracted: {},
          warnings: ['No text content']
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Processing policy extraction request for product type:', productType);

    // Build dynamic prompt based on product type and schema
    let fieldsList = '';
    let specialInstructions = `
CRITICAL PRODUCT TYPE DETECTION:
- ALWAYS identify and extract the PRODUCT_TYPE field from the document
- Look for insurance type indicators like: "Health Insurance", "Life Insurance", "Motor Insurance", "Travel Insurance", etc.
- Common product types are: health, life, motor, travel, home, personal_accident, business, loan
- If product type is not explicitly mentioned, infer from context (e.g., vehicle details = motor, medical coverage = health, death benefit = life)
- Set PRODUCT_TYPE in the policy section - this is MANDATORY for all extractions
    `;
    
    if (productType === 'health') {
      specialInstructions += `
For health insurance policies, extract insured family members separately:
- Extract ALL insured persons into INSURED_PERSONS as an array of objects
- Each insured person should be a separate object with fields: name, dob, gender, age, relationship_with_proposer, member_id, pre_existing_diseases, date_insured_since
- Even if only one member, return it as a single-object array: [{"name": "...", "dob": "...", ...}]
- NEVER return insured persons as a single string - always use structured array format
- relationship_with_proposer is REQUIRED for each insured person
      `;
    }

    // Generate field list from schema
    Object.values(policySchema).forEach((section: any) => {
      if (section.fields) {
        section.fields.forEach((field: any) => {
          if (field.type === 'array' && field.field === 'INSURED_PERSONS') {
            fieldsList += `INSURED_PERSONS (array of objects with fields: ${field.schema.map((f: any) => f.field).join(', ')}), `;
          } else {
            fieldsList += `${field.field}, `;
          }
        });
      }
    });

    // Handle large documents by chunking with smaller chunk size for better processing
    const textChunks = extractedText.length > 40000 
      ? chunkText(extractedText, 35000)  // Smaller chunks for more reliable processing
      : [extractedText];

    console.log(`Processing document in ${textChunks.length} chunks`);

    // Provide a compact output skeleton to reduce prompt size and enforce shape
    const outputSkeleton = JSON.stringify(createEmptySchema(policySchema));

    let allExtractedData: any = {};
    const chunkWarnings: string[] = [];

    // Process each chunk with improved error handling
    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      console.log(`Processing chunk ${i + 1}/${textChunks.length}, length: ${chunk.length}`);

      const prompt = `
You are extracting structured policy data. Output must be pure JSON.

Product type: ${productType}

Output JSON MUST match exactly this skeleton (same keys/sections), filling values you find; leave as null or [] if not present:
${outputSkeleton}

Fields to extract (flat list): ${fieldsList}
      
CRITICAL INSTRUCTIONS:
- MANDATORY: Extract PRODUCT_TYPE field - identify the insurance type from document content
- Extract ONLY the fields defined in this schema for ${productType}. If a field is missing in the policy, return null (or [] for arrays)
- Return ONLY valid JSON, no markdown fences or extra prose
- Follow the PROVIDED KEYS AND SECTIONS EXACTLY (must match skeleton)
- Ensure all dates are in YYYY-MM-DD format
- Numbers should be numeric (strip currency symbols, commas)
- Do NOT add fields that are not in the schema
${specialInstructions}
      
Document text to extract from:
      
${chunk}`;

      const geminiResult = await callGeminiAPI(prompt, i);
      
      if (!geminiResult.success) {
        chunkWarnings.push(`Chunk ${i + 1} failed: ${geminiResult.error}`);
        console.error(`Failed to process chunk ${i + 1}:`, geminiResult.error);
        continue;
      }

      // Enhanced response cleaning
      let cleanedResponse = geminiResult.data.trim();
      
      // Remove markdown fences
      if (cleanedResponse.includes('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\s*/, '').replace(/\s*```$/, '');
      }
      if (cleanedResponse.includes('```')) {
        cleanedResponse = cleanedResponse.replace(/```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Remove any leading/trailing text that's not JSON
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
      }

      // Clean up problematic characters
      cleanedResponse = cleanedResponse
        .replace(/[\x00-\x1F\x7F]/g, ' ')  // Remove control characters
        .replace(/\s+/g, ' ')  // Normalize whitespace
        .trim();

      console.log(`Cleaned response for chunk ${i + 1}, length:`, cleanedResponse.length);

      // Parse and merge chunk data
      try {
        const chunkData = JSON.parse(cleanedResponse);
        
        // Merge chunk data with accumulated data
        Object.keys(chunkData).forEach(sectionKey => {
          if (!allExtractedData[sectionKey]) {
            allExtractedData[sectionKey] = {};
          }
          
          Object.keys(chunkData[sectionKey] || {}).forEach(fieldKey => {
            const value = chunkData[sectionKey][fieldKey];
            if (value !== null && value !== undefined && value !== '') {
              // For arrays, merge them intelligently
              if (Array.isArray(value) && Array.isArray(allExtractedData[sectionKey][fieldKey])) {
                // Merge arrays, avoiding duplicates for insured persons
                const existing = allExtractedData[sectionKey][fieldKey];
                const newItems = value.filter(newItem => {
                  return !existing.some(existingItem => 
                    existingItem.name === newItem.name && existingItem.dob === newItem.dob
                  );
                });
                allExtractedData[sectionKey][fieldKey] = [...existing, ...newItems];
              } else if (value !== null) {
                allExtractedData[sectionKey][fieldKey] = value;
              }
            }
          });
        });
        
        console.log(`Successfully processed chunk ${i + 1}`);
        
      } catch (parseError) {
        chunkWarnings.push(`Chunk ${i + 1} JSON parsing failed: ${parseError.message}`);
        console.error(`Failed to parse JSON for chunk ${i + 1}:`, parseError.message);
        console.log(`Problematic response preview:`, cleanedResponse.substring(0, 200));
        continue;
      }
    }

    // Add chunk warnings to overall warnings
    warnings.push(...chunkWarnings);

    // Ensure we have the basic structure even if extraction partially failed
    if (Object.keys(allExtractedData).length === 0) {
      console.log('No data extracted from any chunks, creating empty schema');
      allExtractedData = createEmptySchema(policySchema);
      warnings.push('No data could be extracted from any document chunks');
    }

    // Validate and structure final data
    const structuredData = createEmptySchema(policySchema);
    
    // Merge extracted data with empty schema
    Object.keys(structuredData).forEach(sectionKey => {
      if (allExtractedData[sectionKey]) {
        Object.keys(structuredData[sectionKey]).forEach(fieldKey => {
          if (allExtractedData[sectionKey][fieldKey] !== null && 
              allExtractedData[sectionKey][fieldKey] !== undefined) {
            structuredData[sectionKey][fieldKey] = allExtractedData[sectionKey][fieldKey];
          }
        });
      }
    });

    // Save training data if requested
    // Ensure product type is set when provided
    if (structuredData?.policy && productType && !structuredData.policy.PRODUCT_TYPE) {
      structuredData.policy.PRODUCT_TYPE = productType;
    }

    if (saveTraining && policyId) {
      await saveTrainingData(structuredData, structuredData, policyId);
    }

    console.log('Policy extraction completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        filePath: filePath || 'text-input',
        extracted: structuredData,
        warnings: warnings.length > 0 ? warnings : undefined,
        chunksProcessed: textChunks.length,
        chunksSuccessful: textChunks.length - chunkWarnings.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Unexpected error in policy extraction:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Unexpected error occurred',
        details: error.message,
        extracted: {},
        warnings: ['Unexpected system error']
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});