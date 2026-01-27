'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, MessageCircle, ArrowRight, CheckCircle, Clock, Brain, User } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ConversationMessage {
  id: string;
  role: 'mack' | 'user';
  content: string;
  timestamp: Date;
}

interface ConsultationSession {
  session_id: string;
  status: 'active' | 'completed' | 'abandoned' | 'error';
  current_step: string;
  mack_message?: string;
  is_consultation_complete?: boolean;
}

interface BusinessContextUpdate {
  target_company?: {
    company_name?: string;
    industry?: string;
  };
  sales_context?: {
    primary_pain_point?: string;
    solution_category?: string;
  };
}

interface OptimizedUserInput {
  companyName: string;
  companyUrl: string;
  linkedinUrl: string;
  industry: string;
  primaryPainPoint: string;
  vendorName: string;
  productName: string;
  organizationFocus: string;
  locationOfInterest: string;
  contextLinks: string[];
  additionalContext: string;
  consultation_derived_context: string;
  mack_briefing_summary: string;
}

interface MackConsultationProps {
  onConsultationComplete?: (optimizedInput: OptimizedUserInput) => void;
  onFallbackToForm?: () => void;
}

export const MackConsultation: React.FC<MackConsultationProps> = ({
  onConsultationComplete,
  onFallbackToForm
}) => {
  const [session, setSession] = useState<ConsultationSession | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [businessContext, setBusinessContext] = useState<BusinessContextUpdate>({});
  const [isTyping, setIsTyping] = useState(false);
  const [completionScore, setCompletionScore] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    startConsultation();
  }, []);

  // Start new consultation session with Mack
  const startConsultation = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/v1/consultation/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        console.log('🎭 Mack consultation started:', data.data);
        
        setSession({
          session_id: data.data.session_id,
          status: data.data.status,
          current_step: data.data.conversation_step,
          mack_message: data.data.mack_message
        });
        
        // Add Mack's initial greeting
        addMackMessage(data.data.mack_message);
      } else {
        console.error('❌ Failed to start consultation:', data.error);
        if (onFallbackToForm) onFallbackToForm();
      }
    } catch (error) {
      console.error('❌ Error starting consultation:', error);
      if (onFallbackToForm) onFallbackToForm();
    } finally {
      setIsLoading(false);
    }
  };

  // Send user response to Mack
  const sendMessage = async () => {
    if (!currentMessage.trim() || !session || isLoading) return;

    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/v1/consultation/${session.session_id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_input: currentMessage
        })
      });

      const data = await response.json();
      if (data.success) {
        console.log('🎭 Mack response:', data.data);
        
        // Update session state
        setSession(prev => prev ? {
          ...prev,
          current_step: data.data.next_step,
          is_consultation_complete: data.data.is_consultation_complete
        } : null);

        // Update business context
        if (data.data.business_context_update) {
          setBusinessContext(prev => ({
            ...prev,
            ...data.data.business_context_update
          }));
        }

        // Add Mack's response
        addMackMessage(data.data.mack_response);

        // Calculate completion based on context
        const contextKeys = Object.keys(data.data.business_context_update || {});
        setCompletionScore(prev => Math.min(1, prev + (contextKeys.length * 0.15)));

        // Check if consultation is complete
        if (data.data.is_consultation_complete) {
          setTimeout(() => {
            handleConsultationComplete();
          }, 1500);
        }
      } else {
        console.error('❌ Failed to send message:', data.error);
        addMackMessage("Sorry, I'm having some technical difficulties. Let me try that again.");
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      addMackMessage("I'm experiencing some connectivity issues. Can you repeat that?");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle completed consultation and get research plan
  const handleConsultationComplete = async () => {
    if (!session) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/v1/consultation/${session.session_id}/research-plan`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success && onConsultationComplete) {
        console.log('🎭 Research plan generated:', data.data);
        
        addMackMessage("Perfect! I'm handing this off to my team now. You'll see them work through the investigation in real-time.");
        
        // Pass optimized input to parent component to trigger Intelligence Theater
        setTimeout(() => {
          onConsultationComplete(data.data.optimized_input);
        }, 2000);
      } else {
        // Fallback if research plan API fails
        console.log('🎭 Using fallback research plan');
        addMackMessage("Let me get my team briefed and we'll start the investigation.");
        
        if (onConsultationComplete) {
          setTimeout(() => {
            onConsultationComplete({
              companyName: businessContext.target_company?.company_name || 'Target Company',
              companyUrl: '',
              linkedinUrl: '',
              industry: businessContext.target_company?.industry || 'Technology',
              primaryPainPoint: businessContext.sales_context?.primary_pain_point || 'Market challenges',
              vendorName: 'Your Solution',
              productName: businessContext.sales_context?.solution_category || 'Technology Solution',
              organizationFocus: 'Strategic intelligence gathering',
              locationOfInterest: '',
              contextLinks: [],
              additionalContext: 'Generated from Mack consultation',
              consultation_derived_context: 'Consultation completed with Mack - investigation ready',
              mack_briefing_summary: 'Mack has identified key strategic priorities and briefed the intelligence team'
            });
          }, 2000);
        }
      }
    } catch (error) {
      console.error('❌ Error getting research plan:', error);
      addMackMessage("I've briefed my team on your situation. They're starting the investigation now.");
      
      // Always provide fallback to keep user experience smooth
      if (onConsultationComplete) {
        setTimeout(() => {
          onConsultationComplete({
            companyName: businessContext.target_company?.company_name || 'Target Company',
            companyUrl: '',
            linkedinUrl: '',
            industry: businessContext.target_company?.industry || 'Technology',
            primaryPainPoint: businessContext.sales_context?.primary_pain_point || 'Strategic opportunity',
            vendorName: 'Your Solution',
            productName: businessContext.sales_context?.solution_category || 'Solution',
            organizationFocus: 'Consultation-driven intelligence',
            locationOfInterest: '',
            contextLinks: [],
            additionalContext: 'Mack consultation insights applied',
            consultation_derived_context: 'Mack identified strategic research priorities',
            mack_briefing_summary: 'Professional consultation completed - investigation priorities established'
          });
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStageDisplay = () => {
    if (!session) return { text: 'Connecting to Mack...', color: 'bg-gray-100 text-gray-700' };
    
    switch (session.current_step) {
      case 'greeting':
        return { text: 'Getting acquainted', color: 'bg-blue-100 text-blue-700', icon: MessageCircle };
      case 'context_gathering':
        return { text: 'Building context', color: 'bg-yellow-100 text-yellow-700', icon: Brain };
      case 'strategic_focus':
        return { text: 'Strategic planning', color: 'bg-purple-100 text-purple-700', icon: Shield };
      case 'validation':
        return { text: 'Validating approach', color: 'bg-orange-100 text-orange-700', icon: CheckCircle };
      case 'research_plan':
        return { text: 'Planning investigation', color: 'bg-indigo-100 text-indigo-700', icon: Clock };
      case 'handoff':
        return { text: 'Ready to investigate', color: 'bg-green-100 text-green-700', icon: ArrowRight };
      case 'completed':
        return { text: 'Investigation started', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle };
      default:
        return { text: 'In consultation', color: 'bg-gray-100 text-gray-700', icon: MessageCircle };
    }
  };

  const addMackMessage = (content: string) => {
    setIsTyping(true);
    setTimeout(() => {
      const mackMessage: ConversationMessage = {
        id: Date.now().toString(),
        role: 'mack',
        content,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, mackMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const stageDisplay = getStageDisplay();
  const StageIcon = stageDisplay.icon || MessageCircle;

  return (
    <Card className="w-full max-w-4xl mx-auto h-[700px] flex flex-col">
      <CardHeader className="border-b bg-gradient-to-r from-slate-900 to-slate-700 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Consultation with Mack</CardTitle>
              <p className="text-slate-300 text-sm">Corporate Investigator • 15 years experience</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`${stageDisplay.color} border-0`}>
              <StageIcon className="w-3 h-3 mr-1" />
              {stageDisplay.text}
            </Badge>
            {completionScore > 0 && (
              <div className="bg-white/10 px-3 py-1 rounded-full text-sm">
                {Math.round(completionScore * 100)}% Complete
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
            >
              <div
                className={`flex max-w-[80%] ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                } items-start gap-3`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                    message.role === 'user' ? 'bg-blue-500' : 'bg-slate-800'
                  }`}
                >
                  {message.role === 'user' ? <User className="w-4 h-4" /> : 'M'}
                </div>
                <div
                  className={`px-4 py-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-slate-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start mb-4">
              <div className="flex items-start gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-sm font-medium">
                  M
                </div>
                <div className="bg-white border border-slate-200 px-4 py-3 rounded-lg rounded-bl-sm shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Business Context Summary */}
        {Object.keys(businessContext).length > 0 && (
          <div className="border-t bg-white p-4">
            <h4 className="font-medium text-slate-700 mb-2">Intelligence Gathered:</h4>
            <div className="flex flex-wrap gap-2 text-sm text-slate-600">
              {businessContext.target_company?.company_name && (
                <Badge variant="outline">Target: {businessContext.target_company.company_name}</Badge>
              )}
              {businessContext.target_company?.industry && (
                <Badge variant="outline">Industry: {businessContext.target_company.industry}</Badge>
              )}
              {businessContext.sales_context?.primary_pain_point && (
                <Badge variant="outline">Challenge: {businessContext.sales_context.primary_pain_point}</Badge>
              )}
              {businessContext.sales_context?.solution_category && (
                <Badge variant="outline">Solution: {businessContext.sales_context.solution_category}</Badge>
              )}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t bg-white p-4">
          {session?.is_consultation_complete ? (
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2 text-green-600 font-medium mb-2">
                <CheckCircle className="w-5 h-5" />
                Consultation Complete
              </div>
              <p className="text-slate-600 text-sm">
                Mack is briefing the intelligence team. Your investigation will begin shortly.
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your response to Mack..."
                disabled={isLoading || isTyping}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || isTyping || !currentMessage.trim()}
                className="bg-slate-800 hover:bg-slate-700"
              >
                {isLoading ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </Button>
            </div>
          )}
          
          {/* Fallback to form option */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <p className="text-xs text-slate-500">
              Prefer the traditional approach?
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={onFallbackToForm}
              className="text-slate-600 hover:text-slate-800"
            >
              Use Standard Form
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};