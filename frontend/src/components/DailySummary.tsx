import { useTranslation } from 'react-i18next';
import { Cat } from '../types/cat';
import { HealthLog } from '../types/health';
import { getDailySummary } from '../utils/calorieCalculator';

interface DailySummaryProps {
  cat: Cat;
  dailyLogs: HealthLog[];
  date: Date;
  wetFoodCaloriesPer100g?: number;
  dryFoodCaloriesPer100g?: number;
  snackCaloriesPer100g?: number;
}

export default function DailySummary({
  cat,
  dailyLogs,
  date,
  wetFoodCaloriesPer100g = 85,
  dryFoodCaloriesPer100g = 375,
  snackCaloriesPer100g = 400
}: DailySummaryProps) {
  const { i18n } = useTranslation();

  const summary = getDailySummary(
    cat,
    dailyLogs,
    wetFoodCaloriesPer100g,
    dryFoodCaloriesPer100g,
    snackCaloriesPer100g
  );

  const getStatusColor = (status: 'low' | 'normal' | 'high') => {
    switch (status) {
      case 'low':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getStatusIcon = (status: 'low' | 'normal' | 'high') => {
    switch (status) {
      case 'low':
        return '⚠️';
      case 'high':
        return '🔴';
      default:
        return '✅';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        📊 {i18n.language === 'ko' ? '일일 요약' : 'Daily Summary'}
        <span className="text-sm font-normal text-gray-500">
          ({date.toLocaleDateString(i18n.language === 'ko' ? 'ko-KR' : 'en-US')})
        </span>
      </h3>

      {/* 칼로리 요약 */}
      <div className={`p-4 rounded-lg border ${getStatusColor(summary.calorieAnalysis.status)}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">
            {getStatusIcon(summary.calorieAnalysis.status)} {i18n.language === 'ko' ? '칼로리' : 'Calories'}
          </span>
          <span className="text-sm">
            {summary.estimatedCalories} / {summary.recommendedCalories} kcal
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full ${
              summary.calorieAnalysis.status === 'low'
                ? 'bg-orange-500'
                : summary.calorieAnalysis.status === 'high'
                ? 'bg-red-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(summary.calorieAnalysis.percentage, 100)}%` }}
          ></div>
        </div>
        <p className="text-xs">
          {i18n.language === 'ko' ? summary.calorieAnalysis.message : summary.calorieAnalysis.messageEn}
        </p>
      </div>

      {/* 수분 요약 */}
      <div className={`p-4 rounded-lg border ${getStatusColor(summary.waterAnalysis.status)}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">
            {getStatusIcon(summary.waterAnalysis.status)} {i18n.language === 'ko' ? '수분' : 'Water'}
          </span>
          <span className="text-sm">
            {summary.totalWater} / {summary.recommendedWater} ml
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full ${
              summary.waterAnalysis.status === 'low'
                ? 'bg-orange-500'
                : summary.waterAnalysis.status === 'high'
                ? 'bg-red-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(summary.waterAnalysis.percentage, 100)}%` }}
          ></div>
        </div>
        <p className="text-xs">
          {i18n.language === 'ko' ? summary.waterAnalysis.message : summary.waterAnalysis.messageEn}
        </p>
      </div>

      {/* 세부 정보 */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{summary.totalWetFood}g</div>
          <div className="text-xs text-gray-600">{i18n.language === 'ko' ? '습식 사료' : 'Wet Food'}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600">{summary.totalDryFood}g</div>
          <div className="text-xs text-gray-600">{i18n.language === 'ko' ? '건식 사료' : 'Dry Food'}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-pink-600">{summary.totalSnacks}g</div>
          <div className="text-xs text-gray-600">{i18n.language === 'ko' ? '간식' : 'Snacks'}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-cyan-600">{summary.totalWater}ml</div>
          <div className="text-xs text-gray-600">{i18n.language === 'ko' ? '물' : 'Water'}</div>
        </div>
      </div>

      {/* 기초대사량 정보 */}
      <div className="pt-4 border-t text-xs text-gray-600">
        <p>
          💡 {i18n.language === 'ko' ? '기초대사량(BMR)' : 'Basal Metabolic Rate (BMR)'}: ~
          {Math.round(summary.recommendedCalories / 1.2)} kcal
        </p>
        <p className="mt-1">
          {i18n.language === 'ko'
            ? '※ 칼로리는 평균 값으로 추정되었습니다. 정확한 값은 사료 제품의 영양 성분표를 참고하세요.'
            : '※ Calorie estimates are averages. Check food packaging for exact nutritional values.'}
        </p>
      </div>
    </div>
  );
}
