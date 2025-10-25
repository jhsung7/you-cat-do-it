import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error('⚠️ Gemini API key is missing!');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

const MODEL_NAME = 'gemini-2.5-flash';

// 나이 계산
const calculateAge = (birthDate: string): string => {
  const birth = new Date(birthDate);
  const today = new Date();
  const years = today.getFullYear() - birth.getFullYear();
  const months = today.getMonth() - birth.getMonth();


  if (years < 1) {
    return `${months}개월`;
  }
  return `${years}년 ${months}개월`;
};

// AI 건강 상담
export const chatWithAI = async (
  userMessage: string,
  catProfile?: any,
  recentLogs?: any[],
  language: 'ko' | 'en' = 'ko'
): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // 언어별 시스템 프롬프트
    const languagePrompt = language === 'ko'
      ? '당신은 고양이 전문 수의사입니다. 친절하고 이해하기 쉽게 한국어로 답변해주세요.'
      : 'You are a veterinarian specializing in feline medicine. Please answer kindly and clearly in English.';

    let prompt = `${languagePrompt}\n\n`;

    if (catProfile) {
      if (language === 'ko') {
        prompt += `고양이 정보:\n`;
        prompt += `- 이름: ${catProfile.name}\n`;
        prompt += `- 품종: ${catProfile.breed}\n`;
        prompt += `- 체중: ${catProfile.weight}kg\n`;
        prompt += `- 중성화: ${catProfile.neutered ? '완료' : '미완료'}\n\n`;
      } else {
        prompt += `Cat Information:\n`;
        prompt += `- Name: ${catProfile.name}\n`;
        prompt += `- Breed: ${catProfile.breed}\n`;
        prompt += `- Weight: ${catProfile.weight}kg\n`;
        prompt += `- Neutered: ${catProfile.neutered ? 'Yes' : 'No'}\n\n`;
      }
    }

    if (recentLogs && recentLogs.length > 0) {
      if (language === 'ko') {
        prompt += `최근 건강 기록:\n`;
        recentLogs.slice(0, 3).forEach(log => {
          prompt += `- ${log.date}: 사료 ${log.foodAmount}g, 물 ${log.waterAmount}ml\n`;
        });
      } else {
        prompt += `Recent Health Records:\n`;
        recentLogs.slice(0, 3).forEach(log => {
          prompt += `- ${log.date}: Food ${log.foodAmount}g, Water ${log.waterAmount}ml\n`;
        });
      }
      prompt += `\n`;
    }

    prompt += language === 'ko' ? `질문: ${userMessage}` : `Question: ${userMessage}`;

    console.log('🤖 Sending to Gemini 2.5 Flash...');
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    console.log('✅ Gemini response received');

    return text;
  } catch (error: any) {
    console.error('❌ Gemini API Error:', error);
    const errorMsg = language === 'ko' 
      ? `오류: ${error?.message || '알 수 없는 오류'}`
      : `Error: ${error?.message || 'Unknown error'}`;
    return errorMsg;
  }
};

export const analyzeSymptoms = async (
  symptoms: string,
  catProfile: any,
  language: 'ko' | 'en' = 'ko'
) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    const prompt = language === 'ko'
      ? `고양이 증상 분석: ${symptoms}\n고양이: ${catProfile.name}, ${catProfile.breed}, ${catProfile.weight}kg\n\n긴급도(emergency/warning/mild)와 권장사항을 알려주세요.`
      : `Cat symptom analysis: ${symptoms}\nCat: ${catProfile.name}, ${catProfile.breed}, ${catProfile.weight}kg\n\nPlease provide urgency level (emergency/warning/mild) and recommendations.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return {
      urgency: 'warning' as const,
      analysis: text,
      recommendations: [language === 'ko' ? '수의사 상담 권장' : 'Consult a veterinarian'],
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
  success: boolean;
  message?: string;
}> => {
  try {
    if (!apiKey) {
      return {
        success: false,
        message: language === 'ko' 
          ? 'API 키가 설정되지 않았습니다.' 
          : 'API key not configured.',
      };
    }

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = language === 'ko' ? `
다음은 고양이 "${catName}"에 대한 건강 기록 음성 입력입니다:
"${voiceInput}"

이 입력에서 다음 정보를 추출해주세요. 정보가 없으면 null을 반환하세요:
- 사료량 (그램 단위 숫자, foodAmount)
- 물량 (ml 단위 숫자, waterAmount)
- 배변 횟수 (숫자, litterCount)
- 활동량 (active/normal/lazy 중 하나, activityLevel)
- 기분 (happy/normal/sad/angry 중 하나, mood)
- 추가 메모 (notes)

JSON 형식으로만 응답해주세요. 예시:
{
  "foodAmount": 20,
  "waterAmount": 50,
  "litterCount": 2,
  "activityLevel": "active",
  "mood": "happy",
  "notes": "츄르도 먹었음"
}

정보가 없는 필드는 포함하지 마세요.
` : `
This is a voice input about cat "${catName}" health log:
"${voiceInput}"

Extract the following information. Return null if not mentioned:
- Food amount (number in grams, foodAmount)
- Water amount (number in ml, waterAmount)
- Litter count (number, litterCount)
- Activity level (active/normal/lazy, activityLevel)
- Mood (happy/normal/sad/angry, mood)
- Additional notes (notes)

Respond ONLY in JSON format. Example:
{
  "foodAmount": 20,
  "waterAmount": 50,
  "litterCount": 2,
  "activityLevel": "active",
  "mood": "happy",
  "notes": "had treats"
}

Omit fields with no information.
`;

    console.log('🤖 Parsing voice input with Gemini...');
    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text().trim();

    // JSON 블록에서 추출
    if (text.includes('```json')) {
      text = text.split('```json')[1].split('```')[0].trim();
    } else if (text.includes('```')) {
      text = text.split('```')[1].split('```')[0].trim();
    }

    const parsed = JSON.parse(text);
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