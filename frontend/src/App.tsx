import React, { useEffect } from 'react' 
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import HealthLog from './pages/HealthLog'
import AIChat from './pages/AIChat'
import { useCatStore } from './store/catStore'

function App() {
    const { selectedCat, selectCat, cats, loadCats } = useCatStore();
    // Load cats on app start
    useEffect(() => {
    loadCats();
    }, [loadCats]);

    return (
        <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
            {/* 네비게이션 바 */}
            <nav className="bg-white shadow-sm border-b">
            <div className="max-w-6xl mx-auto px-8 py-4">
                <div className="flex items-center justify-between">
                <Link to="/" className="text-2xl font-bold text-gray-800 hover:text-blue-600 transition">
                    🐱 고양이 건강 관리
                </Link>
                
                <div className="flex items-center gap-4">
                    {/* AI 상담 버튼 - 항상 표시 */}
                    <Link
                    to="/ai-chat"
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    >
                    🤖 AI 상담
                    </Link>

                    {/* 고양이 선택 드롭다운 */}
                    {cats.length > 0 && (
                    <>
                        <select
                        value={selectedCat?.id || ''}
                        onChange={(e) => selectCat(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                        <option value="">고양이 선택</option>
                        {cats.map(cat => (
                            <option key={cat.id} value={cat.id}>
                            {cat.name}
                            </option>
                        ))}
                        </select>
                        
                        {selectedCat && (
                        <Link
                            to="/health-log"
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                        >
                            건강 기록
                        </Link>
                        )}
                    </>
                    )}
                </div>
                </div>
            </div>
            </nav>

            {/* 페이지 내용 */}
            <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/health-log" element={<HealthLog />} />
            <Route path="/ai-chat" element={<AIChat />} />
            </Routes>
        </div>
        </BrowserRouter>
    )
}

export default App