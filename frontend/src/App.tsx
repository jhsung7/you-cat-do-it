import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { useCatStore } from './store/catStore'
import { useTranslation } from 'react-i18next'
import ErrorBoundary from './components/ErrorBoundary'

// Lazy load route components for code splitting and better performance
const Dashboard = lazy(() => import('./pages/DashboardModern'))
const HealthRecords = lazy(() => import('./pages/HealthRecords'))
const NutritionTracker = lazy(() => import('./pages/NutritionTracker'))
const AIChat = lazy(() => import('./pages/AIChat'))

const fallbackAvatar =
  'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=200&q=60'

const formatCatAge = (birthDate?: string, language: string = 'en') => {
  if (!birthDate) return '--'
  const parsed = new Date(birthDate)
  if (Number.isNaN(parsed.getTime())) return '--'
  const diff = Date.now() - parsed.getTime()
  const yearMs = 1000 * 60 * 60 * 24 * 365.25
  const years = Math.floor(diff / yearMs)
  if (years >= 1) {
    return language === 'ko' ? `${years}살` : `${years} years old`
  }
  const months = Math.max(1, Math.floor(diff / (yearMs / 12)))
  return language === 'ko' ? `${months}개월` : `${months} mo`
}

function Navigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedCat, cats, selectCat } = useCatStore()
  const { t, i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ko' ? 'en' : 'ko'
    i18n.changeLanguage(newLang)
    localStorage.setItem('language', newLang)
  }

  const handleCatSelect = (catId: string) => {
    selectCat(catId)
  }

  const openAddCatModal = () => {
    navigate('/?modal=addCat')
  }

  const openEditCatModal = () => {
    navigate('/?modal=editCat')
  }

  const catAgeLabel = selectedCat ? formatCatAge(selectedCat.birthDate, i18n.language) : '--'

  const navItems = [
    { key: 'dashboard', label: t('nav.dashboardLabel'), icon: '📊', path: '/' },
    { key: 'records', label: t('nav.healthRecords'), icon: '📁', path: '/health-records' },
    { key: 'nutrition', label: t('nav.nutritionTracker'), icon: '🥣', path: '/nutrition' },
  ]

  const getNavClasses = (path?: string) => {
    const isActive = path && location.pathname === path
    const base = 'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition w-full'
    if (isActive) {
      return `${base} bg-indigo-50 text-indigo-600 font-semibold`
    }
    return `${base} text-gray-600 hover:bg-slate-50`
  }

  return (
    <>
      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:justify-between lg:border-r lg:bg-white lg:px-6 lg:py-8">
        <div>
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-2xl">🐾</div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">{t('nav.title')}</p>
              <p className="text-lg font-semibold text-gray-900">Cat Health</p>
            </div>
          </Link>

          <button
            onClick={toggleLanguage}
            className="mt-6 rounded-2xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            {i18n.language === 'ko' ? 'EN' : '한국어'}
          </button>

          <div className="mt-8 space-y-2">
            {navItems.map((item) =>
              item.path ? (
                <Link key={item.key} to={item.path} className={getNavClasses(item.path)}>
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ) : (
                <button key={item.key} type="button" className={`${getNavClasses()} cursor-not-allowed opacity-60`}>
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              )
            )}
          </div>

          <div className="mt-8 rounded-3xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('dashboard.currentProfile')}</p>
            {selectedCat ? (
              <>
                <div className="mt-4 flex flex-col items-center text-center">
                  <img
                    src={selectedCat.imageUrl || fallbackAvatar}
                    className="h-24 w-24 rounded-full border-4 border-gray-50 object-cover shadow-sm"
                    alt={selectedCat.name}
                  />
                  <h3 className="mt-3 text-xl font-semibold text-gray-900">{selectedCat.name}</h3>
                  <p className="text-xs text-gray-500">
                    {catAgeLabel}
                    {selectedCat.breed ? ` · ${selectedCat.breed}` : ''}
                  </p>
                </div>
                <div className="mt-5 space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>{t('catProfile.age')}</span>
                    <span className="font-semibold text-gray-900">{catAgeLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('catProfile.gender')}</span>
                    <span className="font-semibold text-gray-900">
                      {selectedCat.gender === 'male' ? t('catProfile.male') : t('catProfile.female')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('catProfile.weight')}</span>
                    <span className="font-semibold text-gray-900">{selectedCat.weight} kg</span>
                  </div>
                </div>
                {cats.length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t('dashboard.switchCat')}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {cats.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => handleCatSelect(cat.id)}
                          className={`h-10 w-10 rounded-full border-2 ${
                            selectedCat?.id === cat.id ? 'border-blue-500' : 'border-transparent'
                          }`}
                          aria-label={cat.name}
                        >
                          <img
                            src={cat.imageUrl || fallbackAvatar}
                            className="h-full w-full rounded-full object-cover"
                            alt={cat.name}
                          />
                        </button>
                      ))}
                      <button
                        onClick={openAddCatModal}
                        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-gray-300 text-xl text-gray-500 hover:border-blue-400 hover:text-blue-500"
                        aria-label={t('nav.addCat')}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
                <button
                  onClick={openEditCatModal}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-indigo-200 hover:text-indigo-600"
                >
                  ✏️ {t('catProfile.edit')}
                </button>
              </>
            ) : (
              <button
                onClick={openAddCatModal}
                className="mt-4 w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                + {t('nav.addCat')}
              </button>
            )}
          </div>
        </div>

        <div />
      </aside>

      <div className="lg:hidden border-b bg-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">{t('nav.title')}</p>
            <p className="text-xl font-semibold text-gray-900">Cat Health</p>
          </div>
          <button
            onClick={toggleLanguage}
            className="rounded-2xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600"
          >
            {i18n.language === 'ko' ? 'EN' : '한국어'}
          </button>
        </div>

        <div className="mt-4 flex gap-3 overflow-x-auto">
          {navItems
            .filter((item) => item.path)
            .map((item) => (
              <Link
                key={item.key}
                to={item.path!}
                className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm ${
                  location.pathname === item.path ? 'border-indigo-200 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-600'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
        </div>

        <div className="mt-4 rounded-3xl border border-gray-100 p-4">
          {selectedCat ? (
            <>
              <div className="flex flex-col items-center text-center">
                <img
                  src={selectedCat.imageUrl || fallbackAvatar}
                  className="h-20 w-20 rounded-full border-4 border-gray-50 object-cover shadow-sm"
                  alt={selectedCat.name}
                />
                <p className="mt-2 text-base font-semibold text-gray-900">{selectedCat.name}</p>
                <p className="text-xs text-gray-500">
                  {catAgeLabel}
                  {selectedCat.breed ? ` · ${selectedCat.breed}` : ''}
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">{t('catProfile.weight')}</p>
                  <p className="font-semibold text-gray-900">{selectedCat.weight} kg</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">{t('catProfile.gender')}</p>
                  <p className="font-semibold text-gray-900">
                    {selectedCat.gender === 'male' ? t('catProfile.male') : t('catProfile.female')}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {cats.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCatSelect(cat.id)}
                    className={`h-10 w-10 rounded-full border-2 ${
                      selectedCat?.id === cat.id ? 'border-blue-500' : 'border-transparent'
                    }`}
                    aria-label={cat.name}
                  >
                    <img src={cat.imageUrl || fallbackAvatar} className="h-full w-full rounded-full object-cover" alt={cat.name} />
                  </button>
                ))}
                <button
                  onClick={openAddCatModal}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-gray-300 text-lg text-gray-500 hover:border-blue-400 hover:text-blue-500"
                  aria-label={t('nav.addCat')}
                >
                  +
                </button>
              </div>
              <button
                onClick={openEditCatModal}
                className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-indigo-200 hover:text-indigo-600"
              >
                ✏️ {t('catProfile.edit')}
              </button>
            </>
          ) : (
            <button
              onClick={openAddCatModal}
              className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              + {t('nav.addCat')}
            </button>
          )}
        </div>
      </div>
    </>
  )
}

function App() {
  const { loadCats } = useCatStore()
  const { i18n } = useTranslation()

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language')
    if (savedLanguage && (savedLanguage === 'ko' || savedLanguage === 'en')) {
      i18n.changeLanguage(savedLanguage)
    }
  }, [i18n])

  useEffect(() => {
    loadCats()
  }, [loadCats])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 lg:flex">
          <Navigation />

          <div className="flex-1">
            <main className="px-4 pb-12 pt-6 lg:px-10 lg:pt-10">
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-[50vh]">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-gray-600 font-medium">Loading...</p>
                  </div>
                </div>
              }>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/health-records" element={<HealthRecords />} />
                  <Route path="/nutrition" element={<NutritionTracker />} />
                  <Route path="/ai-chat" element={<AIChat />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
