'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, MessageCircle, ArrowRight, CheckCircle, Clock, Brain } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ConversationMessage {
  id: string;
  role: 'mack' | 'user';
  content: string;
  timestamp: Date;
  intent?: string;
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
  const [conversationId, setConversationId] = useState<string>('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [businessContext, setBusinessContext] = useState<BusinessContextUpdate>({});
  const [extractedContext, setExtractedContext] = useState<any>({});
  const [isTyping, setIsTyping] = useState(false);
  const [completionScore, setCompletionScore] = useState(0);
  const [stage, setStage] = useState('');
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

  const startConsultation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/consultation/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user-session' })
      });

      const data = await response.json();
      
      if (data.success) {
        const newConversationId = data.data.conversationId || '';
        setConversationId(newConversationId);
        setSession({ 
          session_id: newConversationId,
          status: 'active',
          current_step: data.data.stage || 'initial',
          mack_message: data.data.initialMessage?.content
        });
        setMessages([data.data.initialMessage]);
        setStage(data.data.stage);
        setCompletionScore(data.data.completionScore);
      }
    } catch (error) {
      console.error('Failed to start consultation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !conversationId || isLoading) return;

    const userMessage: ConversationMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/consultation/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: currentMessage
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Simulate typing delay for natural feel
        setTimeout(() => {
          setMessages(prev => [...prev, data.data.mackResponse]);
          setStage(data.data.stage);
          setCompletionScore(data.data.completionScore);
          setExtractedContext(data.data.extractedContext || {});
          setIsTyping(false);
        }, 800);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const generateResearch = async () => {
    if (!conversationId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/consultation/${conversationId}/generate-research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (data.success && onConsultationComplete) {
        onConsultationComplete(data.data.optimizedUserInput);
      }
    } catch (error) {
      console.error('Failed to generate research:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStageDescription = () => {
    switch (stage) {
      case 'introduction': return 'Meeting Mack';
      case 'context-building': return 'Building Strategy';
      case 'plan-review': return 'Finalizing Plan';
      case 'handoff': return 'Ready to Investigate';
      default: return 'Consultation';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Header with Mack's Identity */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-violet-600" />
          <div className="text-2xl font-bold">
            <span className="text-navy-900">prospect</span>
            <span className="text-violet-600">PI</span>
          </div>
        </div>
        <p className="text-lg text-gray-600">Corporate Intelligence Consultation</p>
        <Badge variant="outline" className="mt-2">
          {getStageDescription()} • {completionScore}% Complete
        </Badge>
      </div>

      {/* Main Consultation Interface */}
      <Card className="border-2 border-violet-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-navy-900 to-violet-600 text-white rounded-t-lg">
          <CardTitle className="text-xl font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Consultation with Mack
            </div>
            {onFallbackToForm && (
              <Button
                variant="ghost" 
                size="sm"
                onClick={onFallbackToForm}
                className="text-white hover:bg-white/20"
              >
                Use Form Instead
              </Button>
            )}
          </CardTitle>
          <p className="text-violet-100">
            Corporate Intelligence Specialist • 12 years experience
          </p>
        </CardHeader>

        <CardContent className="p-6">
          {/* Consultation Progress */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Research Context</span>
              <span>{completionScore}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-violet-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${completionScore}%` }}
              />
            </div>
          </div>

          {/* Conversation Messages */}
          <div className="h-96 overflow-y-auto bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-violet-600 text-white ml-auto'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.role === 'mack' && (
                      <div className="font-semibold text-xs text-violet-600 mb-1">
                        Mack - Research Specialist
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-violet-200' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 max-w-xs px-4 py-2 rounded-lg">
                    <div className="font-semibold text-xs text-violet-600 mb-1">
                      Mack - Research Specialist
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>

          {/* Extracted Context Display */}
          {Object.keys(extractedContext).length > 0 && (
            <div className="mb-4 p-3 bg-violet-50 border border-violet-200 rounded-lg">
              <h4 className="font-semibold text-violet-800 mb-2">Research Context</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {extractedContext.companyName && (
                  <div><strong>Target:</strong> {extractedContext.companyName}</div>
                )}
                {extractedContext.solutionFocus && (
                  <div><strong>Solution:</strong> {extractedContext.solutionFocus}</div>
                )}
                {extractedContext.competitiveAngle && (
                  <div><strong>Angle:</strong> {extractedContext.competitiveAngle}</div>
                )}
                {extractedContext.primaryPainPoint && (
                  <div><strong>Challenge:</strong> {extractedContext.primaryPainPoint}</div>
                )}
              </div>
            </div>
          )}

          {/* Input Area */}
          {stage !== 'handoff' ? (
            <div className="flex gap-2">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your response..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                onClick={sendMessage}
                disabled={isLoading || !currentMessage.trim()}
                className="bg-violet-600 hover:bg-violet-700"
              >
                Send
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <Button
                onClick={generateResearch}
                disabled={isLoading}
                size="lg"
                className="bg-violet-600 hover:bg-violet-700"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Start Intelligence Gathering
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};