import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { useCatStore } from './store/catStore'
import { useTranslation } from 'react-i18next'
import NotificationCenter from './components/NotificationCenter'
import { publishTelemetryEvent } from './utils/telemetry'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const HealthLog = lazy(() => import('./pages/HealthLog'))
const AIChat = lazy(() => import('./pages/AIChat'))

function Navigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedCat, selectCat, cats } = useCatStore()
  const { t, i18n } = useTranslation()
  
  const toggleLanguage = () => {
    const newLang = i18n.language === 'ko' ? 'en' : 'ko'
    i18n.changeLanguage(newLang)
    localStorage.setItem('language', newLang)
  }

  const isHome = location.pathname === '/'

  const handleCatSelect = (catId: string) => {
    selectCat(catId)
  }

  const handleGoToHealthLog = () => {
    publishTelemetryEvent({
      type: 'navigation.healthLog',
      severity: 'info',
      translationKey: 'notifications.openHealthLog',
    })
    navigate('/health-log')
  }

  const handleAddCat = () => {
    publishTelemetryEvent({
      type: 'navigation.addCat',
      severity: 'info',
      translationKey: 'notifications.openAddCat',
    })
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          {/* 로고 */}
          <Link 
            to="/" 
            className="text-2xl font-bold text-gray-800 hover:text-blue-600 transition"
          >
            🐱 {t('nav.title')}
          </Link>
          
          <div className="flex items-center gap-4">
            {/* 언어 전환 */}
            <button
              onClick={toggleLanguage}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              {i18n.language === 'ko' ? 'EN' : '한국어'}
            </button>

            {/* AI 상담 */}
            <Link
              to="/ai-chat"
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              🤖 {t('nav.aiChat')}
            </Link>

            {/* 고양이 선택 & 관리 */}
            {cats.length > 0 ? (
              <>
                <select
                  value={selectedCat?.id || ''}
                  onChange={(e) => handleCatSelect(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option key="select-empty" value="">
                    {t('nav.selectCat')}
                  </option>
                  {cats.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                
                {selectedCat && (
                  <button
                    onClick={handleGoToHealthLog}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                  >
                    {t('nav.healthLog')}
                  </button>
                )}
              </>
            ) : (
              !isHome && (
                <button
                  onClick={handleAddCat}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  + {t('nav.addCat')}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

function App() {
  const { loadCats } = useCatStore()
  const { i18n } = useTranslation()
  
  // 언어 설정 로드
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language')
    if (savedLanguage && (savedLanguage === 'ko' || savedLanguage === 'en')) {
      i18n.changeLanguage(savedLanguage)
    }
  }, [i18n])
  
  // 고양이 목록 로드
  useEffect(() => {
    loadCats()
  }, [loadCats])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <NotificationCenter />

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-24 text-gray-500">
              Loading...
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/health-log" element={<HealthLog />} />
            <Route path="/ai-chat" element={<AIChat />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  )
}

export default App