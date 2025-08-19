import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  report_type: string;
  tenant_id: string;
  from_date?: string;
  to_date?: string;
  export?: 'csv' | 'excel' | 'pdf';
  filters?: {
    productId?: string;
    agentId?: string;
    branchId?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { report_type, tenant_id, from_date, to_date, export: exportType, filters }: RequestBody = await req.json();

    // Validate report type
    const validReportTypes = ['revenue_gwp', 'commission', 'renewals', 'payouts', 'settlements', 'overview'];
    if (!validReportTypes.includes(report_type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid report_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate mock data based on report type
    const generateMockData = (type: string) => {
      const baseData = [];
      const recordCount = Math.floor(Math.random() * 50) + 20;

      for (let i = 0; i < recordCount; i++) {
        switch (type) {
          case 'revenue_gwp':
            baseData.push({
              policy_number: `POL-${1000 + i}`,
              holder_name: `Customer ${i + 1}`,
              product_name: ['Life Insurance', 'Health Insurance', 'Motor Insurance', 'Travel Insurance'][Math.floor(Math.random() * 4)],
              issue_date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
              premium_amount: Math.floor(Math.random() * 100000) + 10000,
              revenue_amount: Math.floor(Math.random() * 50000) + 5000,
              tenant_id
            });
            break;

          case 'commission':
            baseData.push({
              policy_number: `POL-${1000 + i}`,
              agent_name: `Agent ${i + 1}`,
              commission_type: ['Base', 'Renewal', 'Bonus'][Math.floor(Math.random() * 3)],
              commission_value: (Math.random() * 10 + 2).toFixed(2) + '%',
              commission_amount: Math.floor(Math.random() * 20000) + 1000,
              date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
              tenant_id
            });
            break;

          case 'renewals':
            baseData.push({
              policy_number: `POL-${1000 + i}`,
              holder_name: `Customer ${i + 1}`,
              old_expiry_date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
              new_expiry_date: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
              renewal_premium: Math.floor(Math.random() * 80000) + 15000,
              status: ['Renewed', 'Pending', 'Lapsed'][Math.floor(Math.random() * 3)],
              month: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`,
              renewal_count: Math.floor(Math.random() * 100) + 10,
              tenant_id
            });
            break;

          case 'payouts':
            baseData.push({
              policy_number: `POL-${1000 + i}`,
              agent_name: `Agent ${i + 1}`,
              payout_amount: Math.floor(Math.random() * 30000) + 2000,
              payout_date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
              status: ['Paid', 'Pending', 'Processing'][Math.floor(Math.random() * 3)],
              tenant_id
            });
            break;

          case 'settlements':
            baseData.push({
              policy_number: `POL-${1000 + i}`,
              claim_number: `CLM-${2000 + i}`,
              settlement_amount: Math.floor(Math.random() * 200000) + 10000,
              settlement_date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
              status: ['Settled', 'Pending', 'Under Review'][Math.floor(Math.random() * 3)],
              tenant_id
            });
            break;

          case 'overview':
            baseData.push({
              lob: ['Life', 'Health', 'Motor', 'Travel'][Math.floor(Math.random() * 4)],
              total_policies: Math.floor(Math.random() * 1000) + 100,
              total_premium: Math.floor(Math.random() * 5000000) + 500000,
              total_commission: Math.floor(Math.random() * 500000) + 50000,
              total_revenue: Math.floor(Math.random() * 1000000) + 100000,
              renewals_count: Math.floor(Math.random() * 200) + 20,
              month: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`,
              tenant_id
            });
            break;
        }
      }
      return baseData;
    };

    const data = generateMockData(report_type);

    // Handle export requests
    if (exportType) {
      let content: string;
      let contentType: string;
      let filename: string;

      switch (exportType) {
        case 'csv':
          const headers = Object.keys(data[0] || {});
          const csvRows = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
          ];
          content = csvRows.join('\n');
          contentType = 'text/csv';
          filename = `${report_type}.csv`;
          break;

        case 'excel':
          // For Excel, we'll use a simple tab-separated format
          const excelHeaders = Object.keys(data[0] || {});
          const excelRows = [
            excelHeaders.join('\t'),
            ...data.map(row => excelHeaders.map(header => row[header]).join('\t'))
          ];
          content = excelRows.join('\n');
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          filename = `${report_type}.xlsx`;
          break;

        case 'pdf':
          // Simple PDF-like text format
          content = `Report: ${report_type}\nGenerated: ${new Date().toISOString()}\n\n`;
          if (data.length > 0) {
            const pdfHeaders = Object.keys(data[0]);
            content += pdfHeaders.join(' | ') + '\n';
            content += '-'.repeat(pdfHeaders.length * 20) + '\n';
            data.forEach(row => {
              content += pdfHeaders.map(header => row[header]).join(' | ') + '\n';
            });
          }
          contentType = 'application/pdf';
          filename = `${report_type}.pdf`;
          break;

        default:
          throw new Error('Unsupported export format');
      }

      return new Response(content, {
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Return JSON data for UI
    return new Response(
      JSON.stringify({ report_type, data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in policy-reports function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});