import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCatStore } from '../store/catStore';
import { useHealthStore } from '../store/healthStore';

function HealthLog() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { selectedCat } = useCatStore();
  const { addHealthLog, getRecentLogs } = useHealthStore();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    foodAmount: '',
    waterAmount: '',
    litterCount: '',
    activityLevel: 'normal' as 'active' | 'normal' | 'lazy',
    mood: 'normal' as 'happy' | 'normal' | 'sad' | 'angry',
    notes: '',
  });

  console.log('🏥 HealthLog page, selectedCat:', selectedCat?.name);

  if (!selectedCat) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🐱</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {t('healthLog.selectCatFirst')}
          </h2>
          <p className="text-gray-600 mb-6">
            {t('healthLog.selectCatDescription')}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            {t('healthLog.backButton')}
          </button>
        </div>
      </div>
    );
  }

  const catLogs = getRecentLogs(selectedCat.id, 30);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 Submitting form data:', formData);
    
    try {
      addHealthLog({
        id: crypto.randomUUID(),
        catId: selectedCat.id,
        date: formData.date,
        foodAmount: Number(formData.foodAmount),
        waterAmount: Number(formData.waterAmount),
        litterCount: Number(formData.litterCount),
        activityLevel: formData.activityLevel,
        mood: formData.mood,
        notes: formData.notes,
      });
      
      console.log('✅ Health log saved successfully!');
      
      // 폼 닫기
      setShowForm(false);
      
      // 폼 초기화
      setFormData({
        date: new Date().toISOString().split('T')[0],
        foodAmount: '',
        waterAmount: '',
        litterCount: '',
        activityLevel: 'normal',
        mood: 'normal',
        notes: '',
      });
      
      console.log('✅ Form closed and reset');
    } catch (error) {
      console.error('❌ Error saving health log:', error);
      alert('저장 중 오류가 발생했습니다. 콘솔을 확인해주세요.');
    }
  };

  const activityOptions = [
    { value: 'active', label: t('healthLog.active') },
    { value: 'normal', label: t('healthLog.normal') },
    { value: 'lazy', label: t('healthLog.lazy') },
  ];

  const moodEmojis: Record<'happy' | 'normal' | 'sad' | 'angry', string> = {
    happy: '😊',
    normal: '😐',
    sad: '😢',
    angry: '😠',
  };

  const moodOptions: Array<{ value: 'happy' | 'normal' | 'sad' | 'angry'; label: string; emoji: string }> = [
    { value: 'happy', label: t('healthLog.moodHappy'), emoji: '😊' },
    { value: 'normal', label: t('healthLog.moodNormal'), emoji: '😐' },
    { value: 'sad', label: t('healthLog.moodSad'), emoji: '😢' },
    { value: 'angry', label: t('healthLog.moodAngry'), emoji: '😠' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="text-blue-600 hover:text-blue-700 transition"
              >
                ← {t('healthLog.backButton')}
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {selectedCat.name}{t('healthLog.title')}
                </h1>
                <p className="text-sm text-gray-600">
                  {selectedCat.breed} · {selectedCat.weight}kg
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                console.log('➕ Opening form...');
                setShowForm(true);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              + {t('healthLog.addTodayLog')}
            </button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {catLogs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-xl text-gray-600 mb-2">{t('healthLog.noLogs')}</p>
            <p className="text-gray-500 mb-6">{t('healthLog.noLogsDescription')}</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              + {t('healthLog.addTodayLog')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {catLogs.map((log) => (
              <div key={log.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    {new Date(log.date).toLocaleDateString(
                      t('nav.title') === 'Cat Health Manager' ? 'en-US' : 'ko-KR',
                      { year: 'numeric', month: 'long', day: 'numeric' }
                    )}
                  </h3>
                  <span className="text-2xl">{moodEmojis[log.mood]}</span>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">{t('healthLog.food')}</p>
                    <p className="text-xl font-bold text-gray-800">{log.foodAmount}g</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('healthLog.water')}</p>
                    <p className="text-xl font-bold text-gray-800">{log.waterAmount}ml</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('healthLog.litter')}</p>
                    <p className="text-xl font-bold text-gray-800">{log.litterCount}{t('healthLog.times')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('healthLog.activity')}</p>
                    <p className="text-xl font-bold text-gray-800">
                      {activityOptions.find(opt => opt.value === log.activityLevel)?.label}
                    </p>
                  </div>
                </div>

                {log.notes && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-1">{t('healthLog.memo')}</p>
                    <p className="text-gray-800">{log.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {t('healthLog.addTodayLog')}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 날짜 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('healthLog.date')}
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* 사료 & 물 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('healthLog.food')} (g)
                    </label>
                    <input
                      type="number"
                      value={formData.foodAmount}
                      onChange={(e) => setFormData({ ...formData, foodAmount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('healthLog.water')} (ml)
                    </label>
                    <input
                      type="number"
                      value={formData.waterAmount}
                      onChange={(e) => setFormData({ ...formData, waterAmount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* 배변 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('healthLog.litter')} ({t('healthLog.times')})
                  </label>
                  <input
                    type="number"
                    value={formData.litterCount}
                    onChange={(e) => setFormData({ ...formData, litterCount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* 활동량 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('healthLog.activity')}
                  </label>
                  <select
                    value={formData.activityLevel}
                    onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value as 'active' | 'normal' | 'lazy' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {activityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 기분 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('healthLog.mood')}
                  </label>
                  <select
                    value={formData.mood}
                    onChange={(e) => setFormData({ ...formData, mood: e.target.value as 'happy' | 'normal' | 'sad' | 'angry' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {moodOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.emoji} {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 메모 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('healthLog.memo')}
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={t('healthLog.memo')}
                  />
                </div>

                {/* 버튼 */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      console.log('❌ Form cancelled');
                      setShowForm(false);
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    {t('healthLog.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                  >
                    {t('healthLog.save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HealthLog;
