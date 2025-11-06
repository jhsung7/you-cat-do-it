import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCatStore } from '../store/catStore';
import { useHealthStore } from '../store/healthStore';
import { chatWithAI } from '../services/gemini';
import type { AIChatMessage, AIConversationTurn } from '../types';

function AIChat() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { cats, selectedCat } = useCatStore();
  const { getRecentLogs } = useHealthStore();
  
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      role: 'assistant',
      content: t('aiChat.greeting'),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<string>(crypto.randomUUID());

  // 대화 기록을 localStorage에 저장 (최대 5개 대화)
  const saveConversationToStorage = useCallback(
    (conversationMessages: AIChatMessage[]) => {
      try {
        const storageKey = 'ai-chat-conversations';
        const stored = localStorage.getItem(storageKey);
        const conversations = stored ? JSON.parse(stored) : [];

        // greeting 메시지 제외, 실제 대화만
        const actualMessages = conversationMessages.slice(1);
        if (actualMessages.length === 0) return;

        // 현재 대화 세션 ID로 기존 대화를 찾거나 새로 추가
        const existingIndex = conversations.findIndex(
          (conv: any) => conv.id === conversationIdRef.current
        );

        const conversationData = {
          id: conversationIdRef.current,
          timestamp: new Date().toISOString(),
          catId: selectedCat?.id,
          catName: selectedCat?.name,
          messages: actualMessages.map((message) => ({
            ...message,
            timestamp: message.timestamp.toISOString(),
          })),
        };

        if (existingIndex >= 0) {
          // 기존 대화 업데이트
          conversations[existingIndex] = conversationData;
        } else {
          // 새 대화 추가
          conversations.push(conversationData);
        }

        // 최근 5개만 유지
        const recentConversations = conversations.slice(-5);
        localStorage.setItem(storageKey, JSON.stringify(recentConversations));
      } catch (error) {
        console.error('Failed to save conversation:', error);
      }
    },
    [selectedCat?.id, selectedCat?.name]
  );

  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: t('aiChat.greeting'),
      timestamp: new Date(),
    }]);
  }, [i18n.language, t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;

    const userMessage: AIChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const recentLogs = selectedCat ? getRecentLogs(selectedCat.id, 7) : [];

      // 대화 히스토리 생성 (첫 인사 메시지 제외)
      const conversationHistory: AIConversationTurn[] = messages
        .slice(1) // 첫 greeting 메시지 제외
        .map(msg => ({ role: msg.role, content: msg.content }));

      const response = await chatWithAI(
        input,
        selectedCat ?? undefined,
        recentLogs,
        i18n.language as 'ko' | 'en',
        conversationHistory
      );

      const aiMessage: AIChatMessage = {
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        followUpQuestions: response.followUpQuestions,
        sources: response.sources,
      };

      setMessages(prev => {
        const updatedMessages = [...prev, aiMessage];
        // 대화 저장 (비동기적으로)
        setTimeout(() => saveConversationToStorage(updatedMessages), 0);
        return updatedMessages;
      });
    } catch (error) {
      console.error('AI Chat Error:', error);
      const errorMessage: AIChatMessage = {
        role: 'assistant',
        content: t('aiChat.errorMessage'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, i18n.language, messages, saveConversationToStorage, selectedCat, getRecentLogs, t]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = useMemo(
    () => [
      t('aiChat.quickQuestions.q1'),
      t('aiChat.quickQuestions.q2'),
      t('aiChat.quickQuestions.q3'),
      t('aiChat.quickQuestions.q4'),
    ],
    [t]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="text-blue-600 hover:text-blue-700"
              >
                ← {t('aiChat.backButton')}
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {t('aiChat.title')}
                </h1>
                {selectedCat && (
                  <p className="text-sm text-gray-600">
                 
                    {t('aiChat.consultingWith', { catName: selectedCat.name })}
                  </p>
                )}
              </div>
            </div>
            
            {!selectedCat && cats.length > 0 && (
              <p className="text-sm text-gray-600">
                💡 {t('aiChat.noCatWarning')}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md flex flex-col" style={{ height: 'calc(100vh - 250px)' }}>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className="space-y-2">
                <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString(i18n.language === 'ko' ? 'ko-KR' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                {/* Follow-up questions */}
                {message.role === 'assistant' && message.followUpQuestions && message.followUpQuestions.length > 0 && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] space-y-2">
                      <p className="text-xs text-gray-500 px-2">
                        💬 {i18n.language === 'ko' ? '후속 질문' : 'Follow-up questions'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {message.followUpQuestions.map((question, qIndex) => (
                          <button
                            key={qIndex}
                            onClick={() => setInput(question)}
                            className="text-sm px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sources */}
                {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] bg-amber-50 rounded-lg px-4 py-3 border border-amber-200">
                      <p className="text-xs font-medium text-amber-900 mb-2">
                        📚 {i18n.language === 'ko' ? '참고 문헌' : 'References'}
                      </p>
                      <div className="space-y-2">
                        {message.sources.map((source, sIndex) => (
                          <div key={sIndex} className="text-xs text-amber-900">
                            <div className="font-medium">{source.content}</div>
                            {source.date && <div className="text-amber-700 italic mt-0.5">{source.date}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
          
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-3">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="px-6 pb-4">
              <p className="text-sm text-gray-600 mb-2">
                💬 {t('aiChat.frequentQuestions')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(question)}
                    className="text-left text-sm px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t p-4">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('aiChat.placeholder')}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`px-6 py-3 rounded-lg font-medium transition ${
                  input.trim() && !isLoading
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {t('aiChat.sendButton')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIChat;