import React, { useState, useRef, useEffect } from 'react';
import { useCatStore } from '../store/catStore';
import { useHealthStore } from '../store/healthStore';
import { chatWithAI } from '../services/gemini';
import { useNavigate } from 'react-router-dom';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    }

    function AIChat() {
    const navigate = useNavigate();
    const { selectedCat, cats } = useCatStore();
    const { getRecentLogs } = useHealthStore();
    
    const [messages, setMessages] = useState<Message[]>([
        {
        role: 'assistant',
        content: '안녕하세요! 🐱 저는 고양이 건강 상담 AI입니다. 고양이의 건강에 대해 궁금한 점을 물어보세요!',
        timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 자동 스크롤
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 메시지 전송
    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
        role: 'user',
        content: input,
        timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
        // 선택된 고양이의 최근 로그 가져오기
        const recentLogs = selectedCat ? getRecentLogs(selectedCat.id, 7) : [];

        // AI 응답 받기
        const response = await chatWithAI(input, selectedCat, recentLogs);

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
            content: '죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        } finally {
        setIsLoading(false);
        }
    };

    // 엔터키로 전송
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
        }
    };

    // 빠른 질문
    const quickQuestions = [
        '우리 고양이가 물을 잘 안 마셔요',
        '사료를 평소보다 적게 먹어요',
        '구토를 했어요',
        '털이 많이 빠져요',
    ];

    return (
        <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
            <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/')}
                    className="text-blue-600 hover:text-blue-700"
                >
                    ← 돌아가기
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">AI 건강 상담</h1>
                    {selectedCat && (
                    <p className="text-sm text-gray-600">{selectedCat.name}에 대해 상담 중</p>
                    )}
                </div>
                </div>
                
                {!selectedCat && cats.length > 0 && (
                <p className="text-sm text-gray-600">
                    💡 네비게이션에서 고양이를 선택하면 더 정확한 답변을 받을 수 있어요!
                </p>
                )}
            </div>
            </div>
        </div>

        {/* 채팅 영역 */}
        <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="bg-white rounded-lg shadow-md flex flex-col" style={{ height: 'calc(100vh - 250px)' }}>
            {/* 메시지 목록 */}
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
                        {message.timestamp.toLocaleTimeString('ko-KR', {
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

            {/* 빠른 질문 (처음에만 표시) */}
            {messages.length === 1 && (
                <div className="px-6 pb-4">
                <p className="text-sm text-gray-600 mb-2">💬 자주 묻는 질문:</p>
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

            {/* 입력창 */}
            <div className="border-t p-4">
                <div className="flex gap-2">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="고양이 건강에 대해 물어보세요..."
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
                    전송
                </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                Shift + Enter: 줄바꿈 | Enter: 전송
                </p>
            </div>
            </div>
        </div>
        </div>
    );
}

export default AIChat;