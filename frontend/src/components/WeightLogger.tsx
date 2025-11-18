import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WeightLog } from '../types';

interface WeightLoggerProps {
  catId: string;
  currentWeight: number;
  onSave: (log: WeightLog) => void;
  onClose: () => void;
}

function WeightLogger({ catId, currentWeight, onSave, onClose }: WeightLoggerProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'ko' | 'en';

  const [weight, setWeight] = useState(currentWeight.toString());
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      alert(lang === 'ko' ? '유효한 체중을 입력해주세요.' : 'Please enter a valid weight.');
      return;
    }

    const dateTime = new Date(date);
    const log: WeightLog = {
      id: crypto.randomUUID(),
      catId,
      date,
      timestamp: dateTime.getTime(),
      weight: weightNum,
      notes: notes || undefined,
    };

    onSave(log);
    onClose();
  };

  const weightDiff = parseFloat(weight) - currentWeight;
  const weightDiffPercent = ((weightDiff / currentWeight) * 100).toFixed(1);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            ⚖️ {lang === 'ko' ? '체중 기록' : 'Weight Log'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lang === 'ko' ? '날짜' : 'Date'}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lang === 'ko' ? '체중 (kg)' : 'Weight (kg)'}
              </label>
              <input
                type="number"
                step="0.01"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />

              {/* 체중 변화 표시 */}
              {weight && !isNaN(parseFloat(weight)) && (
                <div className={`mt-2 text-sm ${
                  weightDiff > 0
                    ? 'text-orange-600'
                    : weightDiff < 0
                    ? 'text-blue-600'
                    : 'text-gray-600'
                }`}>
                  {lang === 'ko' ? '이전 기록 대비: ' : 'vs Previous: '}
                  {weightDiff > 0 ? '+' : ''}
                  {weightDiff.toFixed(2)}kg ({weightDiff > 0 ? '+' : ''}
                  {weightDiffPercent}%)
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lang === 'ko' ? '메모 (선택)' : 'Notes (Optional)'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={lang === 'ko' ? '특이사항을 기록하세요...' : 'Record any notes...'}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                {lang === 'ko' ? '취소' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                {lang === 'ko' ? '저장' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default WeightLogger;
