import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cat } from '../types/cat';
import { MoodLog } from '../types/health';
import { useHealthStore } from '../store/healthStore';

interface MoodTrackerProps {
  cat: Cat;
}

const moodEmojis = {
  happy: '😊',
  normal: '😐',
  sad: '😢',
  angry: '😾',
};

export default function MoodTracker({ cat }: MoodTrackerProps) {
  const { t, i18n } = useTranslation();
  const { moodLogs, addMoodLog, deleteMoodLog } = useHealthStore();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    mood: 'normal' as 'happy' | 'normal' | 'sad' | 'angry',
    intensity: 'medium' as 'low' | 'medium' | 'high',
    triggers: '',
    notes: '',
  });

  const catMoodLogs = moodLogs.filter(log => log.catId === cat.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date();
    const moodLog: MoodLog = {
      id: crypto.randomUUID(),
      catId: cat.id,
      date: now.toISOString().split('T')[0],
      timestamp: now.getTime(),
      mood: formData.mood,
      intensity: formData.intensity,
      triggers: formData.triggers || undefined,
      notes: formData.notes || undefined,
    };

    addMoodLog(moodLog);

    // Reset form
    setFormData({
      mood: 'normal',
      intensity: 'medium',
      triggers: '',
      notes: '',
    });
    setShowForm(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">
          😊 {t('moodLog.title')}
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          + {t('moodLog.addMood')}
        </button>
      </div>

      {/* Mood Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Mood Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('healthLog.mood')}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['happy', 'normal', 'sad', 'angry'] as const).map((mood) => (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => setFormData({ ...formData, mood })}
                    className={`p-3 text-3xl rounded-lg border-2 transition-all ${
                      formData.mood === mood
                        ? 'border-purple-500 bg-purple-100 scale-110'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    {moodEmojis[mood]}
                  </button>
                ))}
              </div>
            </div>

            {/* Intensity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('moodLog.intensity')}
              </label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map((intensity) => (
                  <button
                    key={intensity}
                    type="button"
                    onClick={() => setFormData({ ...formData, intensity })}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg border-2 transition-all ${
                      formData.intensity === intensity
                        ? 'border-purple-500 bg-purple-100'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    {t(`moodLog.intensity${intensity.charAt(0).toUpperCase() + intensity.slice(1)}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Triggers */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('moodLog.triggers')}
            </label>
            <input
              type="text"
              value={formData.triggers}
              onChange={(e) => setFormData({ ...formData, triggers: e.target.value })}
              placeholder={t('moodLog.triggersPlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('healthLog.memo')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              {t('healthLog.save')}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {t('healthLog.cancel')}
            </button>
          </div>
        </form>
      )}

      {/* Mood Logs List */}
      <div className="space-y-3">
        {catMoodLogs.length > 0 ? (
          catMoodLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-4xl flex-shrink-0">{moodEmojis[log.mood]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-gray-500">
                    {new Date(log.date).toLocaleDateString(i18n.language === 'ko' ? 'ko-KR' : 'en-US')}
                  </p>
                  {log.intensity && (
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      log.intensity === 'high' ? 'bg-red-100 text-red-700' :
                      log.intensity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {t(`moodLog.intensity${log.intensity.charAt(0).toUpperCase() + log.intensity.slice(1)}`)}
                    </span>
                  )}
                </div>
                {log.triggers && (
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-medium">{t('moodLog.triggers')}:</span> {log.triggers}
                  </p>
                )}
                {log.notes && (
                  <p className="text-sm text-gray-600">{log.notes}</p>
                )}
              </div>
              <button
                onClick={() => deleteMoodLog(log.id)}
                className="text-red-500 hover:text-red-700 text-sm flex-shrink-0"
              >
                🗑️
              </button>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-400 py-8">
            <p className="text-sm">{t('moodLog.noMoodLogs')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
