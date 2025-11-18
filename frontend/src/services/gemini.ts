import { GoogleGenerativeAI } from '@google/generative-ai';
import { getRelevantKnowledge } from './vetKnowledge';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error('⚠️ Gemini API key is missing!');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

const MODEL_NAME = 'gemini-2.5-flash';

// Helper: Summarize old conversations to manage context
const summarizeConversation = async (
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  language: 'ko' | 'en'
): Promise<string | null> => {
  if (messages.length < 10) return null;

  try {
    const genAI = new GoogleGenerativeAI(apiKey || '');
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const oldMessages = messages.slice(0, -5);
    const summaryPrompt = language === 'ko'
      ? `다음 대화를 핵심 내용만 3-4줄로 요약하세요. 고양이 건강 관련 중요 정보(증상, 처방된 조언, 언급된 질환)만 포함:\n\n${oldMessages.map(m => `${m.role === 'user' ? '사용자' : '수의사'}: ${m.content}`).join('\n')}`
      : `Summarize this conversation in 3-4 lines, focusing only on key health information (symptoms, advice given, conditions mentioned):\n\n${oldMessages.map(m => `${m.role === 'user' ? 'User' : 'Vet'}: ${m.content}`).join('\n')}`;

    const result = await model.generateContent(summaryPrompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Failed to summarize conversation:', error);
    return null;
  }
};

// AI 건강 상담 (개선된 버전 - Few-shot, CoT, RAG, Summarization)
export const chatWithAI = async (
  userMessage: string,
  catProfile?: any,
  recentLogs?: any[],
  language: 'ko' | 'en' = 'ko',
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<{
  answer: string;
  reasoning?: string;
  confidence?: 'high' | 'medium' | 'low';
  followUpQuestions: string[];
  sources: Array<{ type: string; date?: string; content: string }>;
}> => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Retrieve relevant veterinary knowledge
    const relevantKnowledge = getRelevantKnowledge(userMessage, language, 2);

    // Summarize old conversation if it's long
    const conversationSummary = conversationHistory && conversationHistory.length > 10
      ? await summarizeConversation(conversationHistory, language)
      : null;

    // 개선된 시스템 프롬프트 with Chain-of-Thought
    const systemPrompt = language === 'ko'
      ? `당신은 경험 많은 고양이 전문 수의사입니다.

답변 방식:
1. **내부 추론 (reasoning)**: 먼저 증상을 분석하고 감별 진단을 고려합니다 (사용자에게는 보이지 않음)
   - 가능한 원인들 나열
   - 심각도 평가
   - 제공된 수의학 지식 참고
2. **답변 (answer)**: 간결한 결론 (3-4문장)
3. **확신도 (confidence)**: high(명확한 경우), medium(추가 정보 필요), low(불확실한 경우)

답변 지침:
- 핵심만 전달하고 불필요한 인사말이나 마무리 문구 생략
- 증상이 경미하면 "집에서 관찰 가능", 중간이면 "1-2일 관찰 후 악화시 병원", 심각하면 "즉시 병원 방문" 추천
- 일반적인 질문에는 병원 방문을 강요하지 말 것
- **중요**: 이전 대화 내용을 기억하고 반영하여 답변 (사용자가 언급한 사료, 증상 등)
- 답변의 근거가 되는 수의학 지식, 논문, 가이드라인이 있다면 반드시 출처를 명시

출력 형식 (JSON):
{
  "reasoning": "내부 사고 과정 - 가능한 원인, 감별 진단, 심각도 평가 (2-3문장)",
  "answer": "사용자에게 보여줄 간결한 답변 (3-4문장)",
  "confidence": "high|medium|low",
  "followUpQuestions": ["후속 질문 1", "후속 질문 2", "후속 질문 3"],
  "sources": [
    {"title": "출처 제목", "reference": "저자/기관명, 연도"}
  ]
}`
      : `You are an experienced veterinarian specializing in cats.

Response approach:
1. **Internal reasoning**: First analyze symptoms and consider differential diagnosis (not shown to user)
   - List possible causes
   - Assess severity
   - Reference provided veterinary knowledge
2. **Answer**: Concise conclusion (3-4 sentences)
3. **Confidence**: high (clear case), medium (needs more info), low (uncertain)

Guidelines:
- Focus on key points, skip pleasantries
- For mild symptoms: "monitor at home", moderate: "observe 1-2 days, visit vet if worsens", severe: "immediate vet visit"
- Don't always recommend vet visits for general questions
- **Important**: Remember and reference previous conversation context (foods, symptoms mentioned)
- Cite veterinary knowledge, research papers, or guidelines when applicable

Output format (JSON):
{
  "reasoning": "Internal thought process - possible causes, differential diagnosis, severity assessment (2-3 sentences)",
  "answer": "Concise answer for user (3-4 sentences)",
  "confidence": "high|medium|low",
  "followUpQuestions": ["Follow-up 1", "Follow-up 2", "Follow-up 3"],
  "sources": [
    {"title": "Source title", "reference": "Author/Organization, Year"}
  ]
}`;

    // Few-shot examples
    const fewShotExamples = language === 'ko' ? `

📚 학습 예시:

예시 1:
사용자: "고양이가 사료를 평소보다 적게 먹어요"
응답:
{
  "reasoning": "일시적 식욕 감소는 스트레스, 날씨 변화, 사료 기호도 변화 등으로 흔히 발생. 24시간 미만이고 다른 증상 없으면 경미. 무기력, 구토 동반 시 주의 필요.",
  "answer": "일시적 식욕 감소는 흔합니다. 24시간 관찰하고 물은 충분히 제공하세요. 무기력하거나 구토가 동반되면 병원 방문이 필요합니다.",
  "confidence": "high",
  "followUpQuestions": ["다른 증상은 없나요?", "최근 사료를 바꾸셨나요?", "평소 몇 그램 정도 먹나요?"],
  "sources": [{"title": "고양이 식욕부진 진단 가이드", "reference": "AAHA, 2023"}]
}

예시 2:
사용자: "설사를 하는데 피가 섞여있어요"
응답:
{
  "reasoning": "혈변은 장 출혈의 징후로 감염성 장염, 기생충, IBD, 종양 등 다양한 원인 가능. 탈수 위험 높고 응급 상황. 즉시 수의사 진료 필요.",
  "answer": "혈변은 응급 상황입니다. 즉시 동물병원 방문이 필요합니다. 탈수 방지를 위해 물은 계속 제공하되 사료는 수의사 상담 전까지 급여를 중단하세요.",
  "confidence": "high",
  "followUpQuestions": [],
  "sources": [{"title": "급성 위장관 출혈 진단 가이드라인", "reference": "WSAVA, 2022"}]
}

예시 3:
사용자: "아까 로얄캐닌 추천해주셨는데, 다른 브랜드는 어때요?"
응답:
{
  "reasoning": "이전 대화에서 로얄캐닌 언급됨. 사용자는 다른 옵션 탐색 중. 힐스, 퓨리나 프로플랜도 AAFCO 기준 충족하는 과학적으로 검증된 브랜드.",
  "answer": "힐스나 퓨리나 프로플랜도 좋은 선택입니다. 로얄캐닌과 유사한 영양 기준을 충족하며, 고양이의 기호도에 따라 선택하시면 됩니다. 모두 AAFCO 인증 제품입니다.",
  "confidence": "high",
  "followUpQuestions": ["특정 건강 문제가 있나요?", "현재 사료에 알러지 반응은 없나요?", "나이가 어떻게 되나요?"],
  "sources": [{"title": "AAFCO 고양이 영양 기준", "reference": "AAFCO, 2023"}]
}
` : `

📚 Learning Examples:

Example 1:
User: "My cat is eating less than usual"
Response:
{
  "reasoning": "Temporary appetite decrease commonly occurs due to stress, weather changes, or food preference shifts. If under 24 hours with no other symptoms, likely mild. Requires attention if accompanied by lethargy or vomiting.",
  "answer": "Temporary appetite decrease is common. Monitor for 24 hours and ensure adequate water. If accompanied by lethargy or vomiting, veterinary visit is needed.",
  "confidence": "high",
  "followUpQuestions": ["Are there any other symptoms?", "Did you recently change food?", "How much does your cat usually eat?"],
  "sources": [{"title": "Feline Anorexia Diagnostic Guide", "reference": "AAHA, 2023"}]
}

Example 2:
User: "My cat has diarrhea with blood in it"
Response:
{
  "reasoning": "Bloody stool indicates intestinal bleeding from infectious enteritis, parasites, IBD, tumors, etc. High dehydration risk and emergency situation. Immediate veterinary care required.",
  "answer": "Bloody stool is an emergency. Immediate veterinary visit required. Continue providing water to prevent dehydration, but withhold food until veterinary consultation.",
  "confidence": "high",
  "followUpQuestions": [],
  "sources": [{"title": "Acute Gastrointestinal Bleeding Diagnostic Guidelines", "reference": "WSAVA, 2022"}]
}

Example 3:
User: "You recommended Royal Canin earlier, what about other brands?"
Response:
{
  "reasoning": "Previous conversation mentioned Royal Canin. User exploring alternatives. Hills and Purina Pro Plan also meet AAFCO standards and are scientifically validated brands.",
  "answer": "Hills or Purina Pro Plan are also excellent choices. They meet similar nutritional standards as Royal Canin and you can choose based on your cat's preference. All are AAFCO certified.",
  "confidence": "high",
  "followUpQuestions": ["Does your cat have any specific health issues?", "Any allergic reactions to current food?", "How old is your cat?"],
  "sources": [{"title": "AAFCO Feline Nutrition Standards", "reference": "AAFCO, 2023"}]
}
`;

    let contextPrompt = systemPrompt + fewShotExamples + '\n\n';

    // RAG: Inject relevant veterinary knowledge
    if (relevantKnowledge.length > 0) {
      contextPrompt += language === 'ko'
        ? '🔬 참고할 수의학 지식:\n'
        : '🔬 Veterinary Knowledge Reference:\n';
      relevantKnowledge.forEach(knowledge => {
        contextPrompt += `- ${knowledge.content[language]}\n  출처: ${knowledge.source[language]}\n`;
      });
      contextPrompt += '\n';
    }

    // 고양이 프로필 (Priority context)
    if (catProfile) {
      let profileText = language === 'ko'
        ? `🐱 고양이 정보: ${catProfile.name} (${catProfile.breed}, ${catProfile.weight}kg, 중성화: ${catProfile.neutered ? 'O' : 'X'}`
        : `🐱 Cat Profile: ${catProfile.name} (${catProfile.breed}, ${catProfile.weight}kg, Neutered: ${catProfile.neutered ? 'Yes' : 'No'}`;

      if (catProfile.chronicConditions && catProfile.chronicConditions.length > 0) {
        profileText += language === 'ko'
          ? `, ⚠️ 만성질환: ${catProfile.chronicConditions.join(', ')}`
          : `, ⚠️ Chronic Conditions: ${catProfile.chronicConditions.join(', ')}`;
      }

      contextPrompt += profileText + ')\n\n';
    }

    // Conversation context: Summarized old + Recent messages
    if (conversationHistory && conversationHistory.length > 0) {
      if (conversationSummary) {
        contextPrompt += language === 'ko'
          ? `📝 이전 대화 요약:\n${conversationSummary}\n\n`
          : `📝 Previous Conversation Summary:\n${conversationSummary}\n\n`;
      }

      contextPrompt += language === 'ko' ? '💬 최근 대화:\n' : '💬 Recent Conversation:\n';
      const recentMessages = conversationHistory.slice(-5);
      recentMessages.forEach(msg => {
        const role = msg.role === 'user'
          ? (language === 'ko' ? '사용자' : 'User')
          : (language === 'ko' ? '수의사' : 'Vet');
        contextPrompt += `${role}: ${msg.content}\n`;
      });
      contextPrompt += '\n';
    }

    // 최근 기록 (더 상세하게)
    if (recentLogs && recentLogs.length > 0) {
      contextPrompt += language === 'ko' ? '최근 7일 건강 기록:\n' : 'Recent 7-day health records:\n';
      recentLogs.slice(0, 7).forEach(log => {
        const details = [];
        if (log.foodAmount) details.push(`${language === 'ko' ? '사료' : 'Food'} ${log.foodAmount}g`);
        if (log.waterAmount) details.push(`${language === 'ko' ? '물' : 'Water'} ${log.waterAmount}ml`);
        if (log.litterCount) details.push(`${language === 'ko' ? '배변' : 'Litter'} ${log.litterCount}${language === 'ko' ? '회' : 'x'}`);
        if (log.activityLevel) details.push(`${language === 'ko' ? '활동' : 'Activity'}: ${log.activityLevel}`);
        if (log.mood) details.push(`${language === 'ko' ? '기분' : 'Mood'}: ${log.mood}`);
        if (log.notes) details.push(`${language === 'ko' ? '메모' : 'Notes'}: ${log.notes}`);

        if (details.length > 0) {
          contextPrompt += `- ${log.date}: ${details.join(', ')}\n`;
        }
      });
      contextPrompt += '\n';
    }

    contextPrompt += language === 'ko'
      ? `사용자 질문: ${userMessage}\n\n위 JSON 형식으로 답변해주세요.`
      : `User question: ${userMessage}\n\nRespond in the JSON format above.`;

    console.log('🤖 Sending to Gemini 2.5 Flash...');
    const result = await model.generateContent(contextPrompt);
    const response = result.response;
    let text = response.text().trim();

    // JSON 추출
    if (text.includes('```json')) {
      text = text.split('```json')[1].split('```')[0].trim();
    } else if (text.includes('```')) {
      text = text.split('```')[1].split('```')[0].trim();
    }

    const parsed = JSON.parse(text);
    console.log('✅ Gemini response received');
    console.log('🧠 Reasoning:', parsed.reasoning);
    console.log('📊 Confidence:', parsed.confidence);

    // 출처 변환 (논문/가이드라인 형식)
    const sources: Array<{ type: string; date?: string; content: string }> = [];
    if (parsed.sources && Array.isArray(parsed.sources)) {
      parsed.sources.forEach((source: any) => {
        sources.push({
          type: 'academic',
          content: source.title || '',
          date: source.reference || ''
        });
      });
    }

    return {
      answer: parsed.answer || text,
      reasoning: parsed.reasoning,
      confidence: parsed.confidence,
      followUpQuestions: parsed.followUpQuestions || [],
      sources
    };
  } catch (error: any) {
    console.error('❌ Gemini API Error:', error);
    const errorMsg = language === 'ko'
      ? `오류가 발생했습니다. 다시 시도해주세요.`
      : `An error occurred. Please try again.`;
    return {
      answer: errorMsg,
      followUpQuestions: [],
      sources: []
    };
  }
};

// 증상 분석 (정확도 개선 버전)
export const analyzeSymptoms = async (
  symptoms: string,
  catProfile: any,
  language: 'ko' | 'en' = 'ko'
) => {
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
    let text = response.text().trim();

    // JSON 추출
    if (text.includes('```json')) {
      text = text.split('```json')[1].split('```')[0].trim();
    } else if (text.includes('```')) {
      text = text.split('```')[1].split('```')[0].trim();
    }

    const parsed = JSON.parse(text);

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