import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, TooltipProps } from 'recharts';
import { WeightLog } from '../types';

interface WeightChartProps {
  logs: WeightLog[];
  targetWeight?: number;
}

function WeightChart({ logs, targetWeight }: WeightChartProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'ko' | 'en';

  // 날짜순 정렬
  const sortedLogs = [...logs].sort((a, b) => a.timestamp - b.timestamp);

  // 차트 데이터 준비
  const chartData = sortedLogs.map((log) => {
    const dateObj = log.timestamp ? new Date(log.timestamp) : new Date(log.date);
    return {
      id: log.id,
      date: dateObj.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', {
        month: 'short',
        day: 'numeric',
      }),
      weight: log.weight,
      fullDate: log.date,
      timestamp: log.timestamp,
      notes: log.notes,
    };
  });

  const logMap = useMemo(() => {
    return sortedLogs.reduce<Record<string, WeightLog>>((acc, log) => {
      acc[log.id] = log;
      return acc;
    }, {});
  }, [sortedLogs]);

  // 체중 변화 계산
  const getWeightChange = () => {
    if (sortedLogs.length < 2) return null;
    const first = sortedLogs[0].weight;
    const last = sortedLogs[sortedLogs.length - 1].weight;
    const diff = last - first;
    const percent = ((diff / first) * 100).toFixed(1);
    return { diff: diff.toFixed(2), percent };
  };

  const weightChange = getWeightChange();

  // 급격한 변화 감지 (±5%)
  const detectRapidChange = () => {
    if (sortedLogs.length < 2) return null;

    for (let i = 1; i < sortedLogs.length; i++) {
      const prev = sortedLogs[i - 1].weight;
      const curr = sortedLogs[i].weight;
      const changePercent = Math.abs(((curr - prev) / prev) * 100);

      if (changePercent >= 5) {
        return {
          date: sortedLogs[i].date,
          from: prev,
          to: curr,
          percent: changePercent.toFixed(1),
        };
      }
    }
    return null;
  };

  const rapidChange = detectRapidChange();

  // Y축 범위 계산
  const weights = sortedLogs.map((log) => log.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const padding = (maxWeight - minWeight) * 0.2 || 0.5;

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0].payload as typeof chartData[number];
    const log = logMap[data.id];
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-lg">
        <p className="text-sm font-semibold text-gray-900">{data.weight.toFixed(2)}kg</p>
        <p className="text-xs text-gray-500">
          {new Date(data.timestamp).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
        {log?.notes && <p className="mt-1 text-xs text-gray-600">{log.notes}</p>}
      </div>
    );
  };

  if (sortedLogs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          ⚖️ {lang === 'ko' ? '체중 추이' : 'Weight Trend'}
        </h3>
        <div className="text-center py-12 text-gray-500">
          {lang === 'ko' ? '체중 기록이 없습니다.' : 'No weight records yet.'}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">
          ⚖️ {lang === 'ko' ? '체중 추이' : 'Weight Trend'}
        </h3>
        {sortedLogs.length > 0 && (
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-800">{sortedLogs[sortedLogs.length - 1].weight}kg</p>
            <p className="text-sm text-gray-600">
              {lang === 'ko' ? '현재 체중' : 'Current Weight'}
            </p>
          </div>
        )}
      </div>

      {/* 체중 변화 요약 */}
      {weightChange && (
        <div className={`mb-4 p-3 rounded-lg ${
          Number(weightChange.diff) > 0
            ? 'bg-orange-50 text-orange-700'
            : Number(weightChange.diff) < 0
            ? 'bg-blue-50 text-blue-700'
            : 'bg-gray-50 text-gray-700'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {lang === 'ko' ? '전체 변화' : 'Total Change'}
            </span>
            <span className="text-lg font-bold">
              {Number(weightChange.diff) > 0 ? '+' : ''}
              {weightChange.diff}kg ({Number(weightChange.percent) > 0 ? '+' : ''}
              {weightChange.percent}%)
            </span>
          </div>
        </div>
      )}

      {/* 급격한 변화 경고 */}
      {rapidChange && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border-2 border-red-300">
          <div className="flex items-center gap-2 text-red-700">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <p className="font-bold">
                {lang === 'ko' ? '급격한 체중 변화 감지!' : 'Rapid Weight Change Detected!'}
              </p>
              <p className="text-sm">
                {rapidChange.date}: {rapidChange.from}kg → {rapidChange.to}kg ({rapidChange.percent}%)
              </p>
              <p className="text-xs mt-1">
                {lang === 'ko'
                  ? '동물병원 방문을 권장합니다.'
                  : 'Veterinary consultation recommended.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 차트 */}
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            domain={[minWeight - padding, maxWeight + padding]}
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `${value.toFixed(1)}kg`}
          />
          <Tooltip
            content={<CustomTooltip />}
          />
          {targetWeight && (
            <ReferenceLine
              y={targetWeight}
              stroke="#10B981"
              strokeDasharray="5 5"
              label={{
                value: lang === 'ko' ? '목표' : 'Target',
                position: 'right',
                fill: '#10B981',
                fontSize: 12,
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#3B82F6"
            strokeWidth={3}
            dot={{ fill: '#3B82F6', r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
        <div className="text-center">
          <p className="text-sm text-gray-600">{lang === 'ko' ? '최소' : 'Min'}</p>
          <p className="text-lg font-bold text-gray-800">{minWeight.toFixed(2)}kg</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">{lang === 'ko' ? '평균' : 'Avg'}</p>
          <p className="text-lg font-bold text-gray-800">
            {(weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(2)}kg
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">{lang === 'ko' ? '최대' : 'Max'}</p>
          <p className="text-lg font-bold text-gray-800">{maxWeight.toFixed(2)}kg</p>
        </div>
      </div>
    </div>
  );
}

export default WeightChart;
