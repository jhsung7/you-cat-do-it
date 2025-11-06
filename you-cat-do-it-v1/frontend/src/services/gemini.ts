import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  AIChatResponse,
  AIConversationTurn,
  AICatProfile,
  AIRecentLog,
  AIReferenceSource,
} from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const isGeminiConfigured = Boolean(apiKey);

if (!isGeminiConfigured) {
  console.warn('⚠️ Gemini API key is missing. AI chat will return fallback responses.');
}

const genAI = isGeminiConfigured ? new GoogleGenerativeAI(apiKey!) : null;

const MODEL_NAME = 'gemini-2.5-flash';

const FALLBACK_RESPONSE: AIChatResponse = {
  answer: 'AI service is unavailable at the moment. Please try again later.',
  followUpQuestions: [],
  sources: [],
};

const extractJsonPayload = (text: string): string => {
  const trimmed = text.trim();
  if (trimmed.includes('```json')) {
    return trimmed.split('```json')[1].split('```')[0].trim();
  }
  if (trimmed.includes('```')) {
    return trimmed.split('```')[1].split('```')[0].trim();
  }
  return trimmed;
};

const mapSources = (rawSources: unknown): AIReferenceSource[] => {
  if (!Array.isArray(rawSources)) {
    return [];
  }

  const sources: AIReferenceSource[] = [];

  rawSources.forEach((source) => {
    if (typeof source !== 'object' || source === null) {
      return;
    }

    const { title, reference, type } = source as {
      title?: unknown;
      reference?: unknown;
      type?: unknown;
    };

    if (typeof title !== 'string' || title.trim().length === 0) {
      return;
    }

    sources.push({
      type: typeof type === 'string' && type.trim().length > 0 ? type : 'academic',
      content: title,
      date: typeof reference === 'string' && reference.trim().length > 0 ? reference : undefined,
    });
  });

  return sources;
};

const buildSystemPrompt = (language: 'ko' | 'en'): string =>
  language === 'ko'
    ? `당신은 경험 많은 고양이 전문 수의사입니다.

답변 지침:
1. 답변은 3-4문장 이내로 간결하게 작성
2. 핵심만 전달하고 불필요한 인사말이나 마무리 문구 생략
3. 증상이 경미하면 "집에서 관찰 가능", 중간이면 "1-2일 관찰 후 악화시 병원", 심각하면 "즉시 병원 방문" 추천
4. 일반적인 질문에는 병원 방문을 강요하지 말 것
5. **중요**: 이전 대화 내용을 기억하고 반영하여 답변 (사용자가 언급한 사료, 증상 등)
6. 답변의 근거가 되는 수의학 지식, 논문, 가이드라인이 있다면 반드시 출처를 명시

출력 형식 (JSON):
{
  "answer": "간결한 답변 (3-4문장)",
  "followUpQuestions": ["후속 질문 1", "후속 질문 2", "후속 질문 3"],
  "sources": [
    {"title": "출처 제목 (논문명, 가이드라인명 등)", "reference": "저자/기관명, 연도"},
    {"title": "AAFCO 고양이 영양 기준", "reference": "Association of American Feed Control Officials, 2023"}
  ]
}`
    : `You are an experienced veterinarian specializing in cats.

Guidelines:
1. Keep answers concise (3-4 sentences max)
2. Focus on key points, skip pleasantries
3. For mild symptoms: "monitor at home", moderate: "observe 1-2 days, visit vet if worsens", severe: "immediate vet visit"
4. Don't always recommend vet visits for general questions
5. **Important**: Remember and reference previous conversation context (foods, symptoms mentioned)
6. Cite veterinary knowledge, research papers, or guidelines when applicable

Output format (JSON):
{
  "answer": "Concise answer (3-4 sentences)",
  "followUpQuestions": ["Follow-up 1", "Follow-up 2", "Follow-up 3"],
  "sources": [
    {"title": "Source title (paper, guideline, etc.)", "reference": "Author/Organization, Year"},
    {"title": "AAFCO Feline Nutrition Standards", "reference": "Association of American Feed Control Officials, 2023"}
  ]
}`;

const buildCatProfileLine = (catProfile: AICatProfile, language: 'ko' | 'en'): string => {
  const base =
    language === 'ko'
      ? `고양이: ${catProfile.name} (${catProfile.breed}, ${catProfile.weight}kg, 중성화: ${catProfile.neutered ? 'O' : 'X'}`
      : `Cat: ${catProfile.name} (${catProfile.breed}, ${catProfile.weight}kg, Neutered: ${catProfile.neutered ? 'Yes' : 'No'}`;

  if (!catProfile.chronicConditions?.length) {
    return `${base})`;
  }

  const conditions = catProfile.chronicConditions.join(', ');
  return (
    base +
    (language === 'ko'
      ? `, 만성질환: ${conditions})`
      : `, Chronic Conditions: ${conditions})`)
  );
};

const buildRecentLogLine = (log: AIRecentLog, language: 'ko' | 'en'): string | null => {
  const details: string[] = [];
  if (log.foodAmount) details.push(`${language === 'ko' ? '사료' : 'Food'} ${log.foodAmount}g`);
  if (log.waterAmount) details.push(`${language === 'ko' ? '물' : 'Water'} ${log.waterAmount}ml`);
  if (log.litterCount)
    details.push(`${language === 'ko' ? '배변' : 'Litter'} ${log.litterCount}${language === 'ko' ? '회' : 'x'}`);
  if (log.activityLevel) details.push(`${language === 'ko' ? '활동' : 'Activity'}: ${log.activityLevel}`);
  if (log.mood) details.push(`${language === 'ko' ? '기분' : 'Mood'}: ${log.mood}`);
  if (log.notes) details.push(`${language === 'ko' ? '메모' : 'Notes'}: ${log.notes}`);

  if (!details.length) {
    return null;
  }

  return `- ${log.date}: ${details.join(', ')}`;
};

const buildConversationHistory = (
  history: AIConversationTurn[] = [],
  language: 'ko' | 'en'
): string => {
  if (!history.length) {
    return '';
  }

  const label = language === 'ko' ? '이전 대화:' : 'Previous conversation:';
  const turns = history.slice(-5).map((msg) => {
    const role = msg.role === 'user' ? (language === 'ko' ? '사용자' : 'User') : language === 'ko' ? '수의사' : 'Vet';
    return `${role}: ${msg.content}`;
  });

  return `${label}\n${turns.join('\n')}\n\n`;
};

const parseModelResponse = (text: string, language: 'ko' | 'en'): AIChatResponse => {
  try {
    const payload = extractJsonPayload(text);
    const parsed = JSON.parse(payload) as Partial<{
      answer: string;
      followUpQuestions: string[];
      sources: unknown;
    }>;

    return {
      answer:
        typeof parsed.answer === 'string' && parsed.answer.length > 0
          ? parsed.answer
          : payload,
      followUpQuestions: Array.isArray(parsed.followUpQuestions)
        ? parsed.followUpQuestions.filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
        : [],
      sources: mapSources(parsed.sources),
    };
  } catch (error) {
    console.error('Failed to parse Gemini response', error);
    return {
      ...FALLBACK_RESPONSE,
      answer:
        language === 'ko'
          ? '응답을 해석하지 못했습니다. 질문을 다시 시도해주세요.'
          : 'Could not understand the AI response. Please try again.',
    };
  }
};

// AI 건강 상담 (개선된 버전 - 간결하고 대화 컨텍스트 유지)
export const chatWithAI = async (
  userMessage: string,
  catProfile?: AICatProfile,
  recentLogs: AIRecentLog[] = [],
  language: 'ko' | 'en' = 'ko',
  conversationHistory: AIConversationTurn[] = []
): Promise<AIChatResponse> => {
  if (!genAI) {
    return language === 'ko'
      ? {
          ...FALLBACK_RESPONSE,
          answer: 'AI 서비스를 사용하려면 환경 변수에 Gemini API 키를 설정해주세요.',
        }
      : {
          ...FALLBACK_RESPONSE,
          answer: 'Configure the Gemini API key to enable AI consultations.',
        };
  }

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    let contextPrompt = `${buildSystemPrompt(language)}\n\n`;

    if (catProfile) {
      contextPrompt += `${buildCatProfileLine(catProfile, language)}\n\n`;
    }

    contextPrompt += buildConversationHistory(conversationHistory, language);

    if (recentLogs.length) {
      const header = language === 'ko' ? '최근 7일 건강 기록:' : 'Recent 7-day health records:';
      const lines = recentLogs
        .slice(0, 7)
        .map((log) => buildRecentLogLine(log, language))
        .filter((line): line is string => Boolean(line));

      if (lines.length) {
        contextPrompt += `${header}\n${lines.join('\n')}\n\n`;
      }
    }

    contextPrompt +=
      language === 'ko'
        ? `사용자 질문: ${userMessage}\n\n위 JSON 형식으로 답변해주세요.`
        : `User question: ${userMessage}\n\nRespond in the JSON format above.`;

    console.log('🤖 Sending to Gemini 2.5 Flash...');
    const result = await model.generateContent(contextPrompt);
    const response = result.response;
    console.log('✅ Gemini response received');

    return parseModelResponse(response.text(), language);
  } catch (error) {
    console.error('❌ Gemini API Error:', error);
    return language === 'ko'
      ? {
          ...FALLBACK_RESPONSE,
          answer: '오류가 발생했습니다. 다시 시도해주세요.',
        }
      : {
          ...FALLBACK_RESPONSE,
          answer: 'An error occurred. Please try again.',
        };
  }
};

// 증상 분석 (정확도 개선 버전)
export const analyzeSymptoms = async (
  symptoms: string,
  catProfile: any,
  language: 'ko' | 'en' = 'ko'
) => {
  if (!genAI) {
    return {
      urgency: 'warning' as const,
      analysis:
        language === 'ko'
          ? 'AI 분석을 사용하려면 Gemini API 키를 설정해주세요.'
          : 'Configure the Gemini API key to enable AI symptom analysis.',
      recommendations: [language === 'ko' ? '수의사와 상담하세요' : 'Please consult a veterinarian'],
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = language === 'ko'
      ? `당신은 고양이 전문 수의사입니다. 아래 증상을 분석하고 정확한 긴급도를 판단하세요.

고양이 정보:
- 이름: ${catProfile.name}
- 품종: ${catProfile.breed}
- 체중: ${catProfile.weight}kg

증상: ${symptoms}

긴급도 판단 기준:
- emergency (🔴 응급): 생명을 위협하는 증상 (호흡곤란, 경련, 혈변 대량, 의식 저하, 48시간 이상 식사 거부)
- warning (🟡 주의): 1-2일 관찰이 필요한 증상 (구토 1-2회, 설사, 식욕 감소, 무기력)
- mild (🟢 경미): 집에서 관찰 가능 (재채기, 가벼운 가려움, 일시적 식욕부진)

JSON 형식으로 답변:
{
  "urgency": "emergency|warning|mild",
  "analysis": "증상 분석 (2-3문장, 간결하게)",
  "recommendations": ["권장사항 1", "권장사항 2"]
}`
      : `You are a veterinarian specializing in cats. Analyze these symptoms and determine accurate urgency.

Cat info:
- Name: ${catProfile.name}
- Breed: ${catProfile.breed}
- Weight: ${catProfile.weight}kg

Symptoms: ${symptoms}

Urgency criteria:
- emergency (🔴): Life-threatening (breathing difficulty, seizures, heavy blood in stool, unconsciousness, refusing food 48+ hours)
- warning (🟡): Needs 1-2 day observation (vomiting 1-2x, diarrhea, decreased appetite, lethargy)
- mild (🟢): Can monitor at home (sneezing, mild itching, temporary appetite loss)

Respond in JSON:
{
  "urgency": "emergency|warning|mild",
  "analysis": "Symptom analysis (2-3 sentences, concise)",
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const parsed = JSON.parse(extractJsonPayload(response.text())) as {
      urgency: 'emergency' | 'warning' | 'mild';
      analysis: string;
      recommendations?: string[];
    };

    return {
      urgency: parsed.urgency as 'emergency' | 'warning' | 'mild',
      analysis: parsed.analysis,
      recommendations: parsed.recommendations || [],
    };
  } catch (error) {
    console.error('Symptom analysis error:', error);
    return {
      urgency: 'warning' as const,
      analysis: language === 'ko' ? '증상 분석 중 오류 발생' : 'Error during symptom analysis',
      recommendations: [language === 'ko' ? '수의사와 상담하세요' : 'Please consult a veterinarian'],
    };
  }
};
// 음성 입력에서 건강 기록 파싱
export const parseHealthLogFromVoice = async (
  voiceInput: string,
  catName: string,
  language: 'ko' | 'en' = 'ko'
): Promise<{
  foodAmount?: number;
  waterAmount?: number;
  litterCount?: number;
  activityLevel?: 'active' | 'normal' | 'lazy';
  mood?: 'happy' | 'normal' | 'sad' | 'angry';
  notes?: string;
  symptom?: {
    type: string;
    description: string;
    severity: 'mild' | 'moderate' | 'severe';
  };
  success: boolean;
  message?: string;
}> => {
  if (!genAI) {
    return {
      success: false,
      message:
        language === 'ko'
          ? 'AI 음성 인식을 사용하려면 Gemini API 키를 설정해주세요.'
          : 'Configure the Gemini API key to enable AI voice parsing.',
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = language === 'ko' ? `
고양이 "${catName}"에 대한 음성 입력을 분석하세요:
"${voiceInput}"

음성 입력 의도 파악 및 자동 분류 기준:
1. 식사 관련: "먹었다", "사료", "밥" → foodAmount 추출 (기본값: 50g)
2. 수분 관련: "물 마셨다", "마셨다", "물" → waterAmount 추출 (기본값: 50ml)
3. 배변 관련: "화장실", "응가", "똥" → litterCount 추출 (기본값: 1)
4. **증상 관련 (중요)**:
   - "토", "토했다", "구토", "게워냈다" → symptom 객체 생성 (type: "구토", severity: "moderate")
   - "설사" → symptom 객체 생성 (type: "설사", severity: "moderate") + litterCount도 함께 설정 (기본값: 1)
   - 다른 증상: "기침", "재채기", "무기력" 등 → symptom 객체로 처리

수치 추출 규칙:
- "50그램", "50g" → 50
- "100밀리", "100ml" → 100
- "두 번", "2번" → 2
- 수치 없으면 합리적인 기본값 사용

JSON 응답 형식:
{
  "foodAmount": 50,
  "waterAmount": null,
  "litterCount": null,
  "activityLevel": null,
  "mood": null,
  "notes": null,
  "symptom": {
    "type": "구토",
    "description": "고양이가 토했다",
    "severity": "moderate"
  }
}

**중요**:
- 증상이 감지되면 symptom 객체를 반드시 포함
- "설사"인 경우 symptom과 litterCount를 모두 설정
- 정보가 없는 필드는 포함하지 마세요
` : `
Analyze voice input for cat "${catName}":
"${voiceInput}"

Intent classification rules:
1. Food-related: "ate", "fed", "food", "meal" → extract foodAmount (default: 50g)
2. Water-related: "drink", "water", "drank" → extract waterAmount (default: 50ml)
3. Litter-related: "poop", "litter", "bathroom" → extract litterCount (default: 1)
4. **Symptoms (important)**:
   - "vomit", "threw up", "vomited" → create symptom object (type: "vomit", severity: "moderate")
   - "diarrhea" → create symptom object (type: "diarrhea", severity: "moderate") + also set litterCount (default: 1)
   - Other symptoms: "cough", "sneeze", "lethargic" → process as symptom object

Number extraction:
- "50 grams", "50g" → 50
- "100ml", "100 milliliters" → 100
- "twice", "2 times" → 2
- If no number, use reasonable defaults

JSON response format:
{
  "foodAmount": 50,
  "waterAmount": null,
  "litterCount": null,
  "activityLevel": null,
  "mood": null,
  "notes": null,
  "symptom": {
    "type": "vomit",
    "description": "Cat vomited",
    "severity": "moderate"
  }
}

**Important**:
- If symptom detected, always include symptom object
- For "diarrhea", set both symptom and litterCount
- Omit fields with no data
`;

    console.log('🤖 Parsing voice input with Gemini...');
    const result = await model.generateContent(prompt);
    const response = result.response;
    const parsed = JSON.parse(extractJsonPayload(response.text()));
    console.log('✅ Parsed data:', parsed);

    return {
      ...parsed,
      success: true,
    };
  } catch (error) {
    console.error('❌ Voice parsing error:', error);
    return {
      success: false,
      message: language === 'ko'
        ? '음성 입력을 이해하지 못했습니다. 다시 시도해주세요.'
        : 'Failed to understand voice input. Please try again.',
    };
  }
};

export const generateDiary = async (
  date: string,
  healthLog: any,
  catProfile: any,
  style: 'cute' | 'cynical' | 'philosophical' | 'humorous' = 'cute',
  language: 'ko' | 'en' = 'ko'
) => {
  if (!genAI) {
    return language === 'ko'
      ? 'AI 일기를 생성하려면 Gemini API 키를 설정해주세요.'
      : 'Configure the Gemini API key to generate diary entries.';
  }

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const stylePrompts = {
      ko: {
        cute: '귀엽고 사랑스러운',
        cynical: '냉소적이고 까칠한',
        philosophical: '철학적이고 사색적인',
        humorous: '유머러스하고 재치있는',
      },
      en: {
        cute: 'cute and adorable',
        cynical: 'cynical and snarky',
        philosophical: 'philosophical and contemplative',
        humorous: 'humorous and witty',
      }
    };

    const prompt = language === 'ko'
      ? `${catProfile.name}의 오늘(${date}) 일기를 ${stylePrompts.ko[style]} 고양이 시점에서 100-150자로 작성해주세요. 이모지 1-2개 포함. 오늘: 사료 ${healthLog.foodAmount}g, 물 ${healthLog.waterAmount}ml, 기분 ${healthLog.mood}`
      : `Write a ${stylePrompts.en[style]} diary entry from ${catProfile.name}'s perspective for ${date} in 100-150 characters. Include 1-2 emojis. Today: Food ${healthLog.foodAmount}g, Water ${healthLog.waterAmount}ml, Mood ${healthLog.mood}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Diary generation error:', error);
    return language === 'ko'
      ? '오늘도 평범한 하루였다. 밥 먹고, 잠 자고, 집사를 귀찮게 했다. 😺'
      : 'Another ordinary day. Ate, slept, annoyed my human. 😺';
  }
};

export default { chatWithAI, analyzeSymptoms, generateDiary };