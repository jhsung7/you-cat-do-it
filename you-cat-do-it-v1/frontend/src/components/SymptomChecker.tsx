import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Symptom } from '../types';
import { analyzeSymptoms } from '../services/gemini';

interface SymptomCheckerProps {
  catId: string;
  catName: string;
  onSave: (symptom: Symptom) => void;
  onClose: () => void;
}

const symptomCategories = {
  digestive: {
    ko: '소화기',
    en: 'Digestive',
    symptoms: {
      vomiting: { ko: '구토', en: 'Vomiting' },
      diarrhea: { ko: '설사', en: 'Diarrhea' },
      constipation: { ko: '변비', en: 'Constipation' },
      bloodInStool: { ko: '혈변', en: 'Blood in stool' },
      lossOfAppetite: { ko: '식욕부진', en: 'Loss of appetite' },
    },
  },
  respiratory: {
    ko: '호흡기',
    en: 'Respiratory',
    symptoms: {
      sneezing: { ko: '재채기', en: 'Sneezing' },
      coughing: { ko: '기침', en: 'Coughing' },
      breathingDifficulty: { ko: '호흡 곤란', en: 'Breathing difficulty' },
      nasalDischarge: { ko: '콧물', en: 'Nasal discharge' },
    },
  },
  skin: {
    ko: '피부',
    en: 'Skin',
    symptoms: {
      hairLoss: { ko: '탈모', en: 'Hair loss' },
      itching: { ko: '가려움', en: 'Itching' },
      rash: { ko: '발진', en: 'Rash' },
      dandruff: { ko: '비듬', en: 'Dandruff' },
      wounds: { ko: '상처', en: 'Wounds' },
    },
  },
  behavioral: {
    ko: '행동',
    en: 'Behavioral',
    symptoms: {
      hiding: { ko: '숨기', en: 'Hiding' },
      aggression: { ko: '공격성', en: 'Aggression' },
      excessiveGrooming: { ko: '과도한 그루밍', en: 'Excessive grooming' },
      excessiveMeowing: { ko: '야옹 증가', en: 'Excessive meowing' },
    },
  },
  urinary: {
    ko: '비뇨기',
    en: 'Urinary',
    symptoms: {
      frequentUrination: { ko: '다뇨', en: 'Frequent urination' },
      straining: { ko: '배뇨 곤란', en: 'Straining to urinate' },
      bloodInUrine: { ko: '혈뇨', en: 'Blood in urine' },
    },
  },
  neurological: {
    ko: '신경',
    en: 'Neurological',
    symptoms: {
      seizures: { ko: '경련', en: 'Seizures' },
      staggering: { ko: '비틀거림', en: 'Staggering' },
      disorientation: { ko: '방향 감각 상실', en: 'Disorientation' },
    },
  },
  other: {
    ko: '기타',
    en: 'Other',
    symptoms: {
      weightChange: { ko: '체중 변화', en: 'Weight change' },
      limping: { ko: '절뚝거림', en: 'Limping' },
      eyeIssues: { ko: '안구 이상', en: 'Eye issues' },
    },
  },
};

function SymptomChecker({ catId, catName, onSave, onClose }: SymptomCheckerProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'ko' | 'en';

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState<number>(5);
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{
    urgency: 'emergency' | 'warning' | 'mild';
    text: string;
  } | null>(null);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleAnalyze = async () => {
    if (selectedSymptoms.length === 0 && !description) {
      alert(lang === 'ko' ? '증상을 선택하거나 설명을 입력해주세요.' : 'Please select symptoms or add description.');
      return;
    }

    setIsAnalyzing(true);

    const symptomText = [
      ...selectedSymptoms.map((s) => lang === 'ko' ? s : s),
      description,
    ]
      .filter(Boolean)
      .join(', ');

    const result = await analyzeSymptoms(
      symptomText,
      { name: catName },
      lang
    );

    setAnalysis({
      urgency: result.urgency,
      text: result.analysis,
    });

    setIsAnalyzing(false);
  };

  const handleSave = () => {
    if (!analysis) {
      alert(lang === 'ko' ? '먼저 AI 분석을 받아주세요.' : 'Please analyze symptoms first.');
      return;
    }

    const now = new Date();
    const symptom: Symptom = {
      id: crypto.randomUUID(),
      catId,
      date: now.toISOString().split('T')[0],
      timestamp: now.getTime(),
      symptomType: selectedSymptoms.join(', '),
      severity: severity <= 3 ? 'mild' : severity <= 7 ? 'moderate' : 'severe',
      description: description || selectedSymptoms.join(', '),
      urgency: analysis.urgency,
    };

    onSave(symptom);
    onClose();
  };

  const urgencyConfig = {
    emergency: {
      emoji: '🔴',
      text: lang === 'ko' ? '응급' : 'Emergency',
      color: 'bg-red-100 text-red-700 border-red-300'
    },
    warning: {
      emoji: '🟡',
      text: lang === 'ko' ? '주의' : 'Warning',
      color: 'bg-yellow-100 text-yellow-700 border-yellow-300'
    },
    mild: {
      emoji: '🟢',
      text: lang === 'ko' ? '경미' : 'Mild',
      color: 'bg-green-100 text-green-700 border-green-300'
    },
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 z-10">
          <h2 className="text-2xl font-bold text-gray-800">
            ⚠️ {lang === 'ko' ? '증상 체크' : 'Symptom Checker'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {lang === 'ko'
              ? `${catName}의 증상을 선택하고 AI 분석을 받아보세요.`
              : `Select ${catName}'s symptoms and get AI analysis.`}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* 증상 체크리스트 */}
          <div className="space-y-4">
            {Object.entries(symptomCategories).map(([key, category]) => (
              <div key={key} className="border rounded-lg p-4">
                <h3 className="font-bold text-gray-800 mb-3">
                  {category[lang]}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(category.symptoms).map(([symptomKey, symptom]) => {
                    const symptomLabel = symptom[lang];
                    const isSelected = selectedSymptoms.includes(symptomLabel);
                    return (
                      <button
                        key={symptomKey}
                        onClick={() => toggleSymptom(symptomLabel)}
                        className={`px-3 py-2 rounded-lg text-sm transition ${
                          isSelected
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {symptomLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 심각도 슬라이더 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {lang === 'ko' ? '증상 심각도' : 'Symptom Severity'} ({severity}/10)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #10B981 0%, #FBBF24 50%, #EF4444 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>{lang === 'ko' ? '경미' : 'Mild'}</span>
              <span>{lang === 'ko' ? '중간' : 'Moderate'}</span>
              <span>{lang === 'ko' ? '심각' : 'Severe'}</span>
            </div>
          </div>

          {/* 상세 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {lang === 'ko' ? '상세 설명' : 'Detailed Description'}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={
                lang === 'ko'
                  ? '증상에 대해 자세히 설명해주세요. (예: 언제부터, 얼마나 자주, 다른 증상은?)'
                  : 'Describe the symptoms in detail. (e.g., since when, how often, other symptoms?)'
              }
            />
          </div>

          {/* AI 분석 버튼 */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || (selectedSymptoms.length === 0 && !description)}
            className={`w-full px-6 py-3 rounded-lg font-medium transition ${
              isAnalyzing
                ? 'bg-gray-400 cursor-not-allowed'
                : selectedSymptoms.length > 0 || description
                ? 'bg-purple-500 text-white hover:bg-purple-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isAnalyzing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {lang === 'ko' ? 'AI 분석 중...' : 'AI Analyzing...'}
              </span>
            ) : (
              <>🤖 {lang === 'ko' ? 'AI 분석 받기' : 'Get AI Analysis'}</>
            )}
          </button>

          {/* AI 분석 결과 */}
          {analysis && (
            <div className={`border-2 rounded-lg p-4 ${urgencyConfig[analysis.urgency].color}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{urgencyConfig[analysis.urgency].emoji}</span>
                <span className="text-lg font-bold">{urgencyConfig[analysis.urgency].text}</span>
              </div>
              <p className="text-gray-800 whitespace-pre-wrap">{analysis.text}</p>
            </div>
          )}
        </div>

        {/* 버튼 영역 */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            {lang === 'ko' ? '취소' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            disabled={!analysis}
            className={`flex-1 px-6 py-3 rounded-lg transition ${
              analysis
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {lang === 'ko' ? '저장' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SymptomChecker;
