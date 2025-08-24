import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuditRequest {
  auditId: string;
  responses: Record<string, any>;
  reportPreferences?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { auditId, responses, reportPreferences = [] }: AuditRequest = await req.json();
    
    console.log('Processing audit report generation for:', auditId);

    // Update audit status to generating
    await supabaseClient
      .from('audits')
      .update({ status: 'generating' })
      .eq('id', auditId);

    // Get current user
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Prepare the prompt for Claude
    const prompt = `You are an expert AI consultant conducting a comprehensive AI readiness audit. Based on the following survey responses, generate a detailed, professional audit report.

Survey Responses:
${JSON.stringify(responses, null, 2)}

Report Preferences:
${reportPreferences.length > 0 ? reportPreferences.join(', ') : 'Standard comprehensive report'}

Generate a comprehensive AI readiness audit report with the following sections:

# AI Readiness Audit Report

## Executive Summary
High-level overview and key recommendations

## Current State Assessment
Analysis of organization's current AI maturity

## Gap Analysis
Identification of areas needing improvement

## Risk Assessment
Potential risks and mitigation strategies

## Strategic Recommendations
Prioritized action items

## Implementation Roadmap
90-day action plan with phases

## ROI Projections
Expected return on investment

## Technology Requirements
Infrastructure and tool recommendations

## Skill Development Plan
Training and hiring recommendations

## Governance Framework
Policies and procedures needed

Make the report professional, actionable, and tailored to the organization's specific responses. Use clear headings, bullet points, and practical recommendations. The tone should be consultative and confident. Format as clean markdown.`;

    // Call Claude API
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_completion_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!claudeResponse.ok) {
      const error = await claudeResponse.text();
      console.error('Claude API error:', error);
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    const reportContent = claudeData.content[0].text;

    // Save the generated report to the audit record
    const { data: updatedAudit, error: updateError } = await supabaseClient
      .from('audits')
      .update({ 
        status: 'completed',
        report_content: reportContent,
        responses: responses
      })
      .eq('id', auditId)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    console.log('Audit report generated successfully for:', auditId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        auditId,
        reportContent,
        audit: updatedAudit
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-audit-report function:', error);
    
    // Update audit status to failed if auditId exists
    try {
      const { auditId } = await req.json();
      if (auditId) {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        );
        await supabaseClient
          .from('audits')
          .update({ status: 'failed' })
          .eq('id', auditId);
      }
    } catch (e) {
      console.error('Failed to update audit status to failed:', e);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});