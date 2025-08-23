import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  auditId: string;
  message: string;
  auditData: {
    report: string;
    responses: any;
    title: string;
  };
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { auditId, message, auditData, conversationHistory }: ChatRequest = await req.json();
    
    console.log(`Processing chat message for audit: ${auditId}`);

    // Build context from audit data
    const auditContext = `
AUDIT REPORT CONTEXT:
Title: ${auditData.title}

AUDIT RESPONSES SUMMARY:
${JSON.stringify(auditData.responses, null, 2)}

GENERATED REPORT CONTENT:
${auditData.report}

CONVERSATION HISTORY:
${conversationHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}
`;

    const systemPrompt = `You are an expert AI consultant helping a user understand and implement their AI audit report. You have access to their complete audit data and report.

INSTRUCTIONS:
- Provide specific, actionable advice based on their audit results
- Reference specific parts of their report when relevant  
- Explain technical concepts in accessible language
- Prioritize recommendations based on their organizational context
- Offer step-by-step implementation guidance when asked
- Stay focused on AI strategy, governance, and implementation topics
- Be concise but thorough in your explanations

USER CONTEXT: ${auditContext}

Current user question: ${message}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: systemPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API Error:', errorText);
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const assistantResponse = data.content[0].text;

    console.log(`Chat response generated for audit: ${auditId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        response: assistantResponse,
        auditId 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in audit chat:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process chat message',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});