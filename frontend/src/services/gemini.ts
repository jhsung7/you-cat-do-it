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
  recentLogs?: any[]
): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    let prompt = `당신은 고양이 건강 전문가입니다. 친절하고 이해하기 쉽게 답변해주세요.\n\n`;
    
    if (catProfile) {
      prompt += `고양이 정보:\n`;
      prompt += `- 이름: ${catProfile.name}\n`;
      prompt += `- 품종: ${catProfile.breed}\n`;
      prompt += `- 체중: ${catProfile.weight}kg\n`;
      prompt += `- 중성화: ${catProfile.neutered ? '완료' : '미완료'}\n\n`;
    }

    if (recentLogs && recentLogs.length > 0) {
      prompt += `최근 건강 기록:\n`;
      recentLogs.slice(0, 3).forEach(log => {
        prompt += `- ${log.date}: 사료 ${log.foodAmount}g, 물 ${log.waterAmount}ml\n`;
      });
      prompt += `\n`;
    }

    prompt += `질문: ${userMessage}`;

    console.log('🤖 Sending to Gemini 2.5 Flash...');
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    console.log('✅ Gemini response received');
    
    return text;
  } catch (error: any) {
    console.error('❌ Gemini API Error:', error);
    return `오류: ${error?.message || '알 수 없는 오류'}`;
  }
};

export const analyzeSymptoms = async (
  symptoms: string,
  catProfile: any
) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `고양이 증상 분석: ${symptoms}\n고양이: ${catProfile.name}, ${catProfile.breed}, ${catProfile.weight}kg\n\n긴급도(emergency/warning/mild)와 권장사항을 알려주세요.`;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    return {
      urgency: 'warning' as const,
      analysis: text,
      recommendations: ['수의사 상담 권장'],
    };
  } catch (error) {
    console.error('Symptom analysis error:', error);
    return {
      urgency: 'warning' as const,
      analysis: '증상 분석 중 오류 발생',
      recommendations: ['수의사와 상담하세요'],
    };
  }
};

export const generateDiary = async (
  date: string,
  healthLog: any,
  catProfile: any,
  style: 'cute' | 'cynical' | 'philosophical' | 'humorous' = 'cute'
) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    const stylePrompts = {
      cute: '귀엽고 사랑스러운',
      cynical: '냉소적이고 까칠한',
      philosophical: '철학적이고 사색적인',
      humorous: '유머러스하고 재치있는',
    };
    
    const prompt = `${catProfile.name}의 오늘(${date}) 일기를 ${stylePrompts[style]} 고양이 시점에서 100-150자로 작성해주세요. 이모지 1-2개 포함. 오늘: 사료 ${healthLog.foodAmount}g, 물 ${healthLog.waterAmount}ml, 기분 ${healthLog.mood}`;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Diary generation error:', error);
    return '오늘도 평범한 하루였다. 밥 먹고, 잠 자고, 집사를 귀찮게 했다. 😺';
  }
};

export default { chatWithAI, analyzeSymptoms, generateDiary };