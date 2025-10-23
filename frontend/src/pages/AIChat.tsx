import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCatStore } from '../store/catStore';
import { useHealthStore } from '../store/healthStore';
import { chatWithAI } from '../services/gemini';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function AIChat() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { cats, selectedCat } = useCatStore();
  const { getRecentLogs } = useHealthStore();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: t('aiChat.greeting'),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const recentLogs = selectedCat ? getRecentLogs(selectedCat.id, 7) : [];

      const response = await chatWithAI(
        input,
        selectedCat,
        recentLogs,
        i18n.language as 'ko' | 'en'
      );

      const aiMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: t('aiChat.errorMessage'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    t('aiChat.quickQuestions.q1'),
    t('aiChat.quickQuestions.q2'),
    t('aiChat.quickQuestions.q3'),
    t('aiChat.quickQuestions.q4'),
  ];

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
                    {selectedCat.name} {t('aiChat.consultingWith')}
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
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
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
                onKeyPress={handleKeyPress}
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