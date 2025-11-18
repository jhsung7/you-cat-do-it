import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCatStore } from '../store/catStore';
import { useHealthStore } from '../store/healthStore';
import { Link } from 'react-router-dom';
import WeightChart from '../components/WeightChart';
import WeightLogger from '../components/WeightLogger';
import { WeightLog } from '../types';

function Dashboard() {
  const { t } = useTranslation();
  const { cats, addCat, selectCat, selectedCat } = useCatStore();
  const { loadWeightLogs, getWeightLogs, addWeightLog } = useHealthStore();

  const [showForm, setShowForm] = useState(false);
  const [showWeightLogger, setShowWeightLogger] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    birthDate: '',
    weight: '',
    gender: 'male' as 'male' | 'female',
    neutered: false,
    chronicConditions: '',
  });

  // 선택된 고양이의 체중 기록 로드
  useEffect(() => {
    if (selectedCat) {
      loadWeightLogs(selectedCat.id);
    }
  }, [selectedCat, loadWeightLogs]);

  console.log('🏠 Dashboard rendering, cats:', cats.length);

  const weightLogs = selectedCat ? getWeightLogs(selectedCat.id) : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCat({
      ...formData,
      weight: Number(formData.weight),
      chronicConditions: formData.chronicConditions
        ? formData.chronicConditions.split(',').map(c => c.trim()).filter(c => c)
        : undefined,
    });
    setShowForm(false);
    setFormData({
      name: '',
      breed: '',
      birthDate: '',
      weight: '',
      gender: 'male',
      neutered: false,
      chronicConditions: '',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              🐈‍⬛ {t('dashboard.title')}
            </h1>
            <p className="text-gray-600 mt-1">{t('dashboard.welcome')}</p>
          </div>
          {cats.length > 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition shadow-md"
            >
              + {t('nav.addCat')}
            </button>
          )}
        </div>

        {/* 메인 콘텐츠 */}
        {cats.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🐈</div>
            <p className="text-xl text-gray-600 mb-2">{t('dashboard.noCats')}</p>
            <p className="text-gray-500 mb-6">{t('dashboard.noCatsDescription')}</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              + {t('dashboard.addFirstCat')}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 선택된 고양이의 체중 그래프 */}
            {selectedCat && weightLogs.length > 0 && (
              <WeightChart logs={weightLogs} />
            )}

            {/* 고양이 카드 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">{t('dashboard.myCats')}</h2>
                {selectedCat && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowWeightLogger(true);
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
                  >
                    ⚖️ {t('catProfile.weight')} {t('nav.addCat')}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cats.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
                  onClick={() => selectCat(cat.id)}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl">
                      😻
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{cat.name}</h3>
                      <p className="text-gray-600">{cat.breed}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('catProfile.weight')}</span>
                      <span className="font-medium text-gray-800">{cat.weight}kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('catProfile.gender')}</span>
                      <span className="font-medium text-gray-800">
                        {cat.gender === 'male' ? t('catProfile.male') : t('catProfile.female')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('catProfile.neutered')}</span>
                      <span className="font-medium text-gray-800">
                        {cat.neutered ? '✅' : '❌'}
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/health-log"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectCat(cat.id);
                    }}
                    className="mt-4 block w-full text-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                  >
                    {t('nav.healthLog')}
                  </Link>
                </div>
              ))}
            </div>
            </div>
          </div>
        )}
      </div>

      {/* 체중 로거 모달 */}
      {showWeightLogger && selectedCat && (
        <WeightLogger
          catId={selectedCat.id}
          currentWeight={selectedCat.weight}
          onSave={(log: WeightLog) => {
            addWeightLog(log);
          }}
          onClose={() => setShowWeightLogger(false)}
        />
      )}

      {/* 고양이 추가 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {t('nav.addCat')}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('catProfile.name')}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('catProfile.breed')}
                  </label>
                  <input
                    type="text"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('catProfile.birthDate')}
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('catProfile.weight')} (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('catProfile.gender')}
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option key="male" value="male">{t('catProfile.male')}</option>
                    <option key="female" value="female">{t('catProfile.female')}</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.neutered}
                    onChange={(e) => setFormData({ ...formData, neutered: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    {t('catProfile.neutered')}
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('catProfile.chronicConditions')}
                  </label>
                  <input
                    type="text"
                    value={formData.chronicConditions}
                    onChange={(e) => setFormData({ ...formData, chronicConditions: e.target.value })}
                    placeholder={t('catProfile.chronicConditionsPlaceholder')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    {t('catProfile.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    {t('catProfile.save')}
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

export default Dashboard;