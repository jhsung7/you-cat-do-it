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
  reasoning?: string;
  confidence?: 'high' | 'medium' | 'low';
  followUpQuestions?: string[];
  sources?: Array<{
    type: string;
    date?: string;
    content: string;
    url?: string;
  }>;
}

function AIChat() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { cats, selectedCat } = useCatStore();
  const { getRecentLogs, getAnomalies, loadSymptoms, symptoms } = useHealthStore();

  const greetingText = () => {
    const name = selectedCat?.name || (i18n.language === 'ko' ? '고양이' : 'your cat');
    return (
      t('aiChat.greeting', {
        catName: name,
        defaultValue:
          i18n.language === 'ko'
            ? `안녕하세요! 😺 저는 고양이 건강 상담 AI입니다. ${name}의 건강에 대해 궁금한 점을 물어보세요!`
            : `Hi! 😺 I'm your cat health assistant. Ask me anything about ${name}'s health!`,
      }) || ''
    );
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: greetingText(),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedReasoning, setExpandedReasoning] = useState<number | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [savedConversations, setSavedConversations] = useState<any[]>([]);
  const conversationIdRef = useRef<string>(crypto.randomUUID());

  useEffect(() => {
    if (selectedCat) {
      loadSymptoms(selectedCat.id);
    }
  }, [selectedCat, loadSymptoms]);

  // 대화 기록을 localStorage에 저장 (최대 5개 대화)
  const saveConversationToStorage = (conversationMessages: Message[]) => {
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
        messages: actualMessages,
      };

      if (existingIndex >= 0) {
        // 기존 대화 업데이트
        conversations[existingIndex] = conversationData;
      } else {
        // 새 대화 추가
        conversations.push(conversationData);
      }

      // 최근 10개만 유지 (5개에서 10개로 증가)
      const recentConversations = conversations.slice(-10);
      localStorage.setItem(storageKey, JSON.stringify(recentConversations));
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  };

  // 저장된 대화 목록 불러오기
  const loadConversations = () => {
    try {
      const storageKey = 'ai-chat-conversations';
      const stored = localStorage.getItem(storageKey);
      const conversations = stored ? JSON.parse(stored) : [];
      // 최신순으로 정렬
      setSavedConversations(conversations.reverse());
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setSavedConversations([]);
    }
  };

  // 특정 대화 불러오기
  const loadConversation = (conversation: any) => {
    try {
      // 대화 메시지 복원 (타임스탬프를 Date 객체로 변환)
      const restoredMessages = conversation.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));

      // greeting 메시지 추가
      const messagesWithGreeting = [
        {
          role: 'assistant' as const,
          content: greetingText(),
          timestamp: new Date(),
        },
        ...restoredMessages,
      ];

      setMessages(messagesWithGreeting);
      conversationIdRef.current = conversation.id;
      setShowHistoryModal(false);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  // 대화 삭제
  const deleteConversation = (conversationId: string) => {
    try {
      const storageKey = 'ai-chat-conversations';
      const stored = localStorage.getItem(storageKey);
      const conversations = stored ? JSON.parse(stored) : [];
      const filtered = conversations.filter((conv: any) => conv.id !== conversationId);
      localStorage.setItem(storageKey, JSON.stringify(filtered));
      loadConversations(); // 목록 새로고침
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  // 새 대화 시작
  const startNewConversation = () => {
    setMessages([
      {
        role: 'assistant',
        content: greetingText(),
        timestamp: new Date(),
      },
    ]);
    conversationIdRef.current = crypto.randomUUID();
    setShowHistoryModal(false);
  };

  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: greetingText(),
      timestamp: new Date(),
    }]);
  }, [i18n.language, t, selectedCat]);


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
      const anomalies = selectedCat ? getAnomalies(selectedCat.id) : [];
      const symptomHistory = selectedCat ? symptoms : [];

      // 대화 히스토리 생성 (첫 인사 메시지 제외)
      const conversationHistory = messages
        .slice(1) // 첫 greeting 메시지 제외
        .map(msg => ({ role: msg.role, content: msg.content }));

      const response = await chatWithAI(
        input,
        selectedCat,
        recentLogs,
        i18n.language as 'ko' | 'en',
        conversationHistory,
        anomalies,
        symptomHistory
      );

      const aiMessage: Message = {
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        reasoning: response.reasoning,
        confidence: response.confidence,
        followUpQuestions: response.followUpQuestions,
        // Only keep real URLs; skip generic search fallbacks for clarity
        sources: response.sources?.map((src) => (src.url ? { ...src } : { ...src, url: undefined })),
      };

      setMessages(prev => {
        const updatedMessages = [...prev, aiMessage];
        // 대화 저장 (비동기적으로)
        setTimeout(() => saveConversationToStorage(updatedMessages), 0);
        return updatedMessages;
      });
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

                    {t('aiChat.consultingWith', { catName: selectedCat.name })}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={startNewConversation}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm font-medium"
              >
                🆕 {i18n.language === 'ko' ? '새 대화' : 'New Chat'}
              </button>
              <button
                onClick={() => {
                  loadConversations();
                  setShowHistoryModal(true);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
              >
                📜 {i18n.language === 'ko' ? '대화 기록' : 'History'}
              </button>
            </div>
          </div>

          {!selectedCat && cats.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                💡 {t('aiChat.noCatWarning')}
              </p>
            </div>
          )}
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

                    {/* Confidence indicator for AI messages */}
                    {message.role === 'assistant' && message.confidence && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {i18n.language === 'ko' ? '확신도:' : 'Confidence:'}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                          message.confidence === 'high' ? 'bg-green-100 text-green-700' :
                          message.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {i18n.language === 'ko'
                            ? (message.confidence === 'high' ? '높음' : message.confidence === 'medium' ? '중간' : '낮음')
                            : (message.confidence === 'high' ? 'High' : message.confidence === 'medium' ? 'Medium' : 'Low')
                          }
                        </span>
                      </div>
                    )}

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

                {/* Chain-of-thought reasoning (expandable) */}
                {message.role === 'assistant' && message.reasoning && (
                  <div className="flex justify-start mt-1">
                    <div className="max-w-[80%]">
                      <button
                        onClick={() => setExpandedReasoning(expandedReasoning === index ? null : index)}
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        <span>{expandedReasoning === index ? '▼' : '▶'}</span>
                        <span>{i18n.language === 'ko' ? '진단 과정 보기' : 'View diagnostic reasoning'}</span>
                      </button>
                      {expandedReasoning === index && (
                        <div className="mt-2 bg-purple-50 rounded-lg px-3 py-2 border border-purple-200">
                          <p className="text-xs font-medium text-purple-900 mb-1">
                            🧠 {i18n.language === 'ko' ? '내부 추론 과정' : 'Internal Reasoning'}
                          </p>
                          <p className="text-xs text-purple-800 whitespace-pre-wrap">{message.reasoning}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                    <div className="max-w-[70%] rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2">
                      <p className="text-[11px] font-semibold text-amber-900 mb-1">
                        📚 {i18n.language === 'ko' ? '참고 자료' : 'References'}
                      </p>
                      <ul className="space-y-1">
                        {message.sources.map((source, sIndex) => (
                          <li key={sIndex} className="text-[11px] text-amber-900 leading-snug">
                            <span className="font-medium">{source.content}</span>
                            {source.date && <span className="ml-1 text-amber-700 italic">({source.date})</span>}
                            {source.url && (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                                className="ml-2 text-blue-600 underline"
                              >
                                {i18n.language === 'ko' ? '원문' : 'Source'}
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
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

      {/* 대화 기록 모달 */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* 모달 헤더 */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                📜 {i18n.language === 'ko' ? '대화 기록' : 'Conversation History'}
              </h2>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* 대화 목록 */}
            <div className="flex-1 overflow-y-auto p-4">
              {savedConversations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">
                    {i18n.language === 'ko' ? '저장된 대화가 없습니다' : 'No saved conversations'}
                  </p>
                  <p className="text-sm mt-2">
                    {i18n.language === 'ko'
                      ? 'AI와 대화를 시작하면 자동으로 저장됩니다'
                      : 'Conversations are automatically saved when you chat'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedConversations.map((conv) => {
                    const firstUserMessage = conv.messages.find((m: any) => m.role === 'user');
                    const preview = firstUserMessage
                      ? firstUserMessage.content.slice(0, 60) + (firstUserMessage.content.length > 60 ? '...' : '')
                      : (i18n.language === 'ko' ? '(메시지 없음)' : '(No messages)');

                    const date = new Date(conv.timestamp);
                    const formattedDate = date.toLocaleDateString(i18n.language === 'ko' ? 'ko-KR' : 'en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={conv.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-700">
                                {conv.catName || (i18n.language === 'ko' ? '고양이 없음' : 'No cat')}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formattedDate}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {preview}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {conv.messages.length} {i18n.language === 'ko' ? '개 메시지' : 'messages'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => loadConversation(conv)}
                              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm whitespace-nowrap"
                            >
                              {i18n.language === 'ko' ? '불러오기' : 'Load'}
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(i18n.language === 'ko' ? '이 대화를 삭제하시겠습니까?' : 'Delete this conversation?')) {
                                  deleteConversation(conv.id);
                                }
                              }}
                              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div className="px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                {i18n.language === 'ko' ? '닫기' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIChat;
