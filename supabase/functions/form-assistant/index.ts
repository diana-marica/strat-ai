import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssistantRequest {
  message: string;
  selectedText?: string;
  context?: string;
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
    const { message, selectedText, context, conversationHistory }: AssistantRequest = await req.json();
    
    console.log('Processing form assistant request');

    const contextInfo = selectedText 
      ? `User selected text: "${selectedText}"\nContext: ${context || 'AI Audit Form'}`
      : `Context: ${context || 'AI Audit Form'}`;

    const conversationContext = conversationHistory.length > 0
      ? `Previous conversation:\n${conversationHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}\n\n`
      : '';

    const systemPrompt = `You are an AI audit specialist helping users understand and complete an AI readiness assessment form. Your role is to:

1. Explain audit questions and terminology in plain language
2. Provide context for why certain information is important for AI readiness
3. Help users understand how to evaluate their organization's capabilities
4. Offer examples of what good/poor answers might look like
5. Clarify technical concepts without being overly technical

${contextInfo}

${conversationContext}Current user question: ${message}

Provide a helpful, concise explanation that helps them better understand and complete the audit form.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 800,
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

    console.log('Form assistant response generated');

    return new Response(
      JSON.stringify({ 
        success: true, 
        response: assistantResponse
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in form assistant:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process assistant request',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});