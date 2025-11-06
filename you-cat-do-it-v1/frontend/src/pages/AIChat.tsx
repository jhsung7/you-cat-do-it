import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCatStore } from '../store/catStore';
import { useHealthStore } from '../store/healthStore';
import { chatWithAI } from '../services/gemini';
import { publishTelemetryEvent } from '../utils/telemetry';
import type {
  AIChatMessage,
  AIConversationTurn,
  StoredAIConversation,
} from '../types';

const STORAGE_KEY = 'ai-chat-conversations';

interface HydratedConversation {
  id: string;
  timestamp: Date;
  catId?: string;
  catName?: string;
  messages: AIChatMessage[];
}

function AIChat() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { cats, selectedCat, selectCat } = useCatStore();
  const { getRecentLogs } = useHealthStore();

  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [savedConversations, setSavedConversations] = useState<HydratedConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<string>(crypto.randomUUID());
  const hasHydratedRef = useRef(false);
  const previousCatIdRef = useRef<string | undefined>(selectedCat?.id);

  const createGreetingMessage = useCallback((): AIChatMessage => ({
    role: 'assistant',
    content: t('aiChat.greeting', {
      catName: selectedCat?.name ?? t('nav.selectCat'),
    }),
    timestamp: new Date(),
  }), [selectedCat?.name, t]);

  const hydrateConversation = useCallback(
    (conversation: StoredAIConversation): HydratedConversation => {
      const rawTimestamp = new Date(conversation.timestamp);
      const timestamp = Number.isNaN(rawTimestamp.getTime()) ? new Date() : rawTimestamp;

      return {
        id: conversation.id,
        catId: conversation.catId,
        catName: conversation.catName,
        timestamp,
        messages: (conversation.messages ?? []).map((message) => {
          const messageTimestamp = new Date(message.timestamp);
          return {
            ...message,
            timestamp: Number.isNaN(messageTimestamp.getTime())
              ? new Date()
              : messageTimestamp,
          };
        }),
      };
    },
    []
  );

  const parseStoredConversations = useCallback((): StoredAIConversation[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item) => item && typeof item.id === 'string');
    } catch (error) {
      publishTelemetryEvent({
        type: 'aiChat.loadFailed',
        severity: 'warning',
        translationKey: 'notifications.aiChatLoadFailed',
      });
      return [];
    }
  }, []);

  const persistConversations = useCallback((conversations: StoredAIConversation[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, []);

  const applyConversation = useCallback(
    (conversation: HydratedConversation) => {
      conversationIdRef.current = conversation.id;
      setActiveConversationId(conversation.id);
      const greeting = createGreetingMessage();
      setMessages([
        { ...greeting, timestamp: new Date() },
        ...conversation.messages.map((message) => ({ ...message })),
      ]);
    },
    [createGreetingMessage]
  );

  const startNewConversation = useCallback(() => {
    const newId = crypto.randomUUID();
    conversationIdRef.current = newId;
    setActiveConversationId(newId);
    setMessages([createGreetingMessage()]);
  }, [createGreetingMessage]);

  const refreshSavedConversations = useCallback(
    (override?: StoredAIConversation[]) => {
      const stored = override ?? parseStoredConversations();
      const hydrated = stored
        .map(hydrateConversation)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setSavedConversations(hydrated);
      return hydrated;
    },
    [hydrateConversation, parseStoredConversations]
  );

  useEffect(() => {
    const hydrated = refreshSavedConversations();
    const catChanged = previousCatIdRef.current !== selectedCat?.id;
    const shouldAutoSelect = !hasHydratedRef.current || catChanged;

    if (shouldAutoSelect) {
      const preferredConversation = selectedCat
        ? hydrated.find((conversation) => conversation.catId === selectedCat.id)
        : hydrated[0];

      if (preferredConversation) {
        applyConversation(preferredConversation);
      } else {
        startNewConversation();
      }

      hasHydratedRef.current = true;
      previousCatIdRef.current = selectedCat?.id;
    }
  }, [applyConversation, refreshSavedConversations, selectedCat?.id, startNewConversation]);

  useEffect(() => {
    if (!messages.length) {
      return;
    }

    setMessages((prev) => {
      if (!prev.length) return prev;
      const [first, ...rest] = prev;
      return [
        {
          ...first,
          content: t('aiChat.greeting', {
            catName: selectedCat?.name ?? t('nav.selectCat'),
          }),
        },
        ...rest,
      ];
    });
  }, [selectedCat?.name, t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveConversationToStorage = useCallback(
    (conversationMessages: AIChatMessage[]) => {
      try {
        const stored = parseStoredConversations();
        const actualMessages = conversationMessages.slice(1);
        if (actualMessages.length === 0) return;

        const conversationData: StoredAIConversation = {
          id: conversationIdRef.current,
          timestamp: new Date().toISOString(),
          catId: selectedCat?.id,
          catName: selectedCat?.name,
          messages: actualMessages.map((message) => ({
            ...message,
            timestamp: message.timestamp.toISOString(),
          })),
        };

        const existingIndex = stored.findIndex(
          (conversation) => conversation.id === conversationIdRef.current
        );

        if (existingIndex >= 0) {
          stored[existingIndex] = conversationData;
        } else {
          stored.push(conversationData);
        }

        const recentConversations = stored.slice(-5);
        persistConversations(recentConversations);
        refreshSavedConversations(recentConversations);
      } catch (error) {
        publishTelemetryEvent({
          type: 'aiChat.saveFailed',
          severity: 'warning',
          translationKey: 'notifications.aiChatSaveFailed',
        });
      }
    },
    [parseStoredConversations, persistConversations, refreshSavedConversations, selectedCat?.id, selectedCat?.name]
  );

  const handleConversationSelect = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const conversationId = event.target.value;
      if (!conversationId) {
        return;
      }

      const conversation = savedConversations.find((item) => item.id === conversationId);
      if (!conversation) {
        return;
      }

      if (conversation.catId && conversation.catId !== selectedCat?.id) {
        selectCat(conversation.catId);
      }

      applyConversation(conversation);
    },
    [applyConversation, savedConversations, selectCat, selectedCat?.id]
  );

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;

    const userMessage: AIChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const recentLogs = selectedCat ? getRecentLogs(selectedCat.id, 7) : [];
      const conversationHistoryBase: AIConversationTurn[] = messages
        .slice(1)
        .map((msg) => ({ role: msg.role, content: msg.content }));
      const conversationHistory: AIConversationTurn[] = [
        ...conversationHistoryBase,
        { role: 'user', content: userMessage.content },
      ];

      const response = await chatWithAI(
        userMessage.content,
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

      setMessages((prev) => {
        const updatedMessages = [...prev, aiMessage];
        setTimeout(() => saveConversationToStorage(updatedMessages), 0);
        return updatedMessages;
      });
    } catch (error) {
      publishTelemetryEvent({
        type: 'aiChat.requestFailed',
        severity: 'error',
        translationKey: 'notifications.aiChatRequestFailed',
      });

      const errorMessage: AIChatMessage = {
        role: 'assistant',
        content: t('aiChat.errorMessage'),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [
    getRecentLogs,
    i18n.language,
    input,
    messages,
    saveConversationToStorage,
    selectedCat,
    t,
  ]);

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

  const sortedConversations = useMemo(
    () =>
      [...savedConversations].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      ),
    [savedConversations]
  );

  const savedConversationValue = sortedConversations.some(
    (conversation) => conversation.id === activeConversationId
  )
    ? activeConversationId ?? ''
    : '';

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
        <div
          className="bg-white rounded-lg shadow-md flex flex-col"
          style={{ height: 'calc(100vh - 250px)' }}
        >
          <div className="border-b px-6 py-4 flex flex-wrap items-center gap-3">
            <label
              htmlFor="saved-conversations"
              className="text-sm font-medium text-gray-600"
            >
              {t('aiChat.savedConversationsLabel')}
            </label>
            <select
              id="saved-conversations"
              value={savedConversationValue}
              onChange={handleConversationSelect}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              disabled={sortedConversations.length === 0}
            >
              <option value="">
                {sortedConversations.length > 0
                  ? t('aiChat.savedConversationPlaceholder')
                  : t('aiChat.noSavedConversations')}
              </option>
              {sortedConversations.map((conversation) => (
                <option key={conversation.id} value={conversation.id}>
                  {`${conversation.catName ?? t('nav.selectCat')} • ${conversation.timestamp.toLocaleString(
                    i18n.language === 'ko' ? 'ko-KR' : 'en-US'
                  )}`}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={startNewConversation}
              className="text-sm px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 transition"
            >
              {t('aiChat.newConversation')}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className="space-y-2">
                <div
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        message.role === 'user'
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString(
                        i18n.language === 'ko' ? 'ko-KR' : 'en-US',
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </p>
                  </div>
                </div>

                {message.role === 'assistant' &&
                  message.followUpQuestions &&
                  message.followUpQuestions.length > 0 && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] space-y-2">
                        <p className="text-xs text-gray-500 px-2">
                          💬{' '}
                          {i18n.language === 'ko'
                            ? '후속 질문'
                            : 'Follow-up questions'}
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

                {message.role === 'assistant' &&
                  message.sources &&
                  message.sources.length > 0 && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] bg-amber-50 rounded-lg px-4 py-3 border border-amber-200">
                        <p className="text-xs font-medium text-amber-900 mb-2">
                          📚{' '}
                          {i18n.language === 'ko'
                            ? '참고 문헌'
                            : 'References'}
                        </p>
                        <div className="space-y-2">
                          {message.sources.map((source, sIndex) => (
                            <div key={sIndex} className="text-xs text-amber-900">
                              <div className="font-medium">{source.content}</div>
                              {source.date && (
                                <div className="text-amber-700 italic mt-0.5">
                                  {source.date}
                                </div>
                              )}
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
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && (
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
