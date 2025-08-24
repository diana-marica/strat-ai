import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, MessageSquare, Bot, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface Audit {
  id: string;
  title: string;
  report_content?: string;
  responses: any;
  created_at: string;
}

const AuditChat = () => {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(
    searchParams.get('conversationId')
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  const loadAudit = async () => {
    if (!auditId) return;
    
    try {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('id', auditId)
        .single();
      
      if (error) throw error;
      
      setAudit(data);
    } catch (error) {
      console.error('Error loading audit:', error);
      toast({
        title: "Error",
        description: "Could not load audit data. Redirecting to dashboard.",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  };

  const loadConversations = async () => {
    if (!auditId) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('audit_id', auditId)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      setConversations(data || []);
      
      // If no current conversation selected and conversations exist, select the most recent
      if (!currentConversationId && data && data.length > 0) {
        setCurrentConversationId(data[0].id);
        setSearchParams({ conversationId: data[0].id });
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async () => {
    if (!currentConversationId) {
      // No conversation selected, show welcome message
      setMessages([{
        role: 'assistant',
        content: `Hello! I'm here to help you understand your "${audit?.title}" audit results. What would you like to know about your AI readiness assessment?`,
        timestamp: new Date()
      }]);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', currentConversationId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      const formattedMessages = data?.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at)
      })) || [];
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !audit || isSending) return;
    
    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsSending(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('audit-chat', {
        body: {
          auditId: audit.id,
          message: userMessage.content,
          conversationId: currentConversationId,
          auditData: audit
        }
      });
      
      if (error) throw error;
      
      const aiMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Update conversation ID if this was a new conversation
      if (data.conversationId && data.conversationId !== currentConversationId) {
        setCurrentConversationId(data.conversationId);
        setSearchParams({ conversationId: data.conversationId });
        loadConversations(); // Refresh conversations list
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      
      // Remove the user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  };

  const createNewConversation = () => {
    setCurrentConversationId(null);
    setSearchParams({});
    setMessages([{
      role: 'assistant',
      content: `Hello! I'm here to help you understand your "${audit?.title}" audit results. What would you like to know about your AI readiness assessment?`,
      timestamp: new Date()
    }]);
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId);
      
      if (error) throw error;
      
      // If we deleted the current conversation, clear it
      if (conversationId === currentConversationId) {
        setCurrentConversationId(null);
        setSearchParams({});
      }
      
      loadConversations(); // Refresh conversations list
      
      toast({
        title: "Success",
        description: "Conversation deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    loadAudit();
    loadConversations();
  }, [auditId]);

  useEffect(() => {
    setIsLoading(false);
    loadMessages();
  }, [currentConversationId, audit]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-4xl mx-auto h-[calc(100vh-2rem)]">
        <CardHeader className="flex flex-row items-center gap-2 pb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <CardTitle className="text-lg flex-1">
            {audit ? `Chat about "${audit.title}"` : 'Loading...'}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {conversations.length > 0 && (
              <Select
                value={currentConversationId || ""}
                onValueChange={(value) => {
                  setCurrentConversationId(value);
                  setSearchParams({ conversationId: value });
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select conversation" />
                </SelectTrigger>
                <SelectContent>
                  {conversations.map((conv) => (
                    <SelectItem key={conv.id} value={conv.id}>
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{conv.title}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                          }}
                          className="ml-2 p-1 h-6 w-6"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={createNewConversation}
            >
              <Plus className="w-4 h-4 mr-1" />
              New Chat
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex flex-col h-[calc(100%-5rem)] p-0">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`flex gap-3 max-w-[80%] ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                    }`}>
                      {message.role === 'user' ? (
                        <MessageSquare className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </div>
                      {message.timestamp && (
                        <div className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isSending && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-current rounded-full animate-pulse delay-75" />
                      <div className="w-2 h-2 bg-current rounded-full animate-pulse delay-150" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about your audit results..."
                className="min-h-[60px] resize-none"
                disabled={isSending}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isSending}
                size="sm"
                className="self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditChat;