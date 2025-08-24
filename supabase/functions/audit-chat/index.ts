import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  auditId: string;
  message: string;
  conversationId?: string;
  auditData?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(authHeader);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { auditId, message, conversationId, auditData } = await req.json() as ChatRequest;
    
    if (!auditId || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get or create conversation
    let currentConversationId = conversationId;
    
    if (!currentConversationId) {
      // Create new conversation
      const { data: newConversation, error: conversationError } = await supabase
        .from('chat_conversations')
        .insert({
          audit_id: auditId,
          user_id: user.id,
          title: message.length > 50 ? message.substring(0, 50) + '...' : message
        })
        .select()
        .single();
        
      if (conversationError) {
        console.error('Error creating conversation:', conversationError);
        return new Response(JSON.stringify({ error: 'Failed to create conversation' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      currentConversationId = newConversation.id;
    }

    // Save user message
    const { error: userMessageError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: currentConversationId,
        role: 'user',
        content: message
      });

    if (userMessageError) {
      console.error('Error saving user message:', userMessageError);
    }

    // Get conversation history for context
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('conversation_id', currentConversationId)
      .order('created_at', { ascending: true });

    const conversationHistory = messages?.map(msg => ({
      role: msg.role,
      content: msg.content
    })) || [];

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create context from audit data and conversation history
    const auditContext = `
    Audit Report: ${auditData?.report_content || 'No report available'}
    
    Audit Responses: ${JSON.stringify(auditData?.responses || {}, null, 2)}
    
    Previous Conversation:
    ${conversationHistory.slice(0, -1).map(msg => `${msg.role}: ${msg.content}`).join('\n') || 'No previous conversation'}
    `;

    const systemPrompt = `You are an AI audit assistant helping users understand their AI readiness audit results. 

    Context about this audit:
    ${auditContext}

    Current user question: ${message}

    Please provide helpful, specific insights about their audit results. Be concise and actionable in your responses.`;

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
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

    const data = await anthropicResponse.json();
    
    if (!anthropicResponse.ok) {
      console.error('Anthropic API error:', data);
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiMessage = data.content[0].text;

    // Save AI response
    const { error: aiMessageError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: currentConversationId,
        role: 'assistant',
        content: aiMessage
      });

    if (aiMessageError) {
      console.error('Error saving AI message:', aiMessageError);
    }

    // Update conversation timestamp
    await supabase
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', currentConversationId);

    return new Response(JSON.stringify({ 
      message: aiMessage,
      conversationId: currentConversationId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in audit chat:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to process chat message'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});