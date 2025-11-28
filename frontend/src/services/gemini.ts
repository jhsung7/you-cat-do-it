import { GoogleGenerativeAI } from '@google/generative-ai';
import { getRelevantKnowledge, VetKnowledge, vetKnowledgeBase } from './vetKnowledge';
import { HealthAnomaly } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const logDebug = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.debug(...args);
  }
};

if (!apiKey && import.meta.env.DEV) {
  console.warn('⚠️ Gemini API key is missing; using offline fallbacks.');
}

type Embedding = number[];
const knowledgeEmbeddings: { ko?: Record<string, Embedding>; en?: Record<string, Embedding> } = {};

const embedText = async (text: string): Promise<Embedding | null> => {
  if (!genAI) return null;
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const res = await model.embedContent(text);
    return res.embedding?.values || null;
  } catch (err) {
    console.error('Embedding error', err);
    return null;
  }
};

const buildKnowledgeEmbeddings = async (language: 'ko' | 'en') => {
  if (knowledgeEmbeddings[language] || !genAI) return;
  const map: Record<string, Embedding> = {};
  for (const item of vetKnowledgeBase) {
    const emb = await embedText(item.content[language]);
    if (emb) map[item.id] = emb;
  }
  knowledgeEmbeddings[language] = map;
};

const cosineSim = (a: Embedding, b: Embedding) => {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
};

const getRelevantKnowledgeSmart = async (query: string, language: 'ko' | 'en', topK: number) => {
  if (!genAI) return getRelevantKnowledge(query, language, topK);
  await buildKnowledgeEmbeddings(language);
  const queryEmb = await embedText(query);
  if (!queryEmb || !knowledgeEmbeddings[language]) return getRelevantKnowledge(query, language, topK);

  const scored = Object.entries(knowledgeEmbeddings[language] as Record<string, Embedding>).map(([id, emb]) => ({
    id,
    score: cosineSim(queryEmb, emb),
  }));

  const selected = scored
    .filter((s) => s.score > 0.1)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => vetKnowledgeBase.find((k) => k.id === s.id)!)
    .filter(Boolean);

  return selected.length ? selected : getRelevantKnowledge(query, language, topK);
};

const MODEL_NAME = 'gemini-2.5-flash';
const RECENT_MESSAGE_LIMIT = 10;

// Helper: Summarize old conversations to manage context
const summarizeConversation = async (
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  language: 'ko' | 'en'
): Promise<string | null> => {
  if (messages.length <= RECENT_MESSAGE_LIMIT || !genAI) return null;

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const oldMessages = messages.slice(0, messages.length - RECENT_MESSAGE_LIMIT);
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

const buildFallbackResponse = (
  catProfile: any,
  knowledge: VetKnowledge[],
  language: 'ko' | 'en'
) => {
  const catName = catProfile?.name || (language === 'ko' ? '고양이' : 'your cat')
  const advisory = knowledge.length
    ? knowledge.map(item => `• ${item.content[language]}`).join('\n')
    : (language === 'ko'
        ? '증상이 지속되거나 악화되면 가까운 병원에 상담하세요.'
        : 'Monitor closely and seek veterinary care if the condition worsens.')

  const answer =
    language === 'ko'
      ? `${catName}의 상태를 정확히 확인할 수 있는 AI 연결이 원활하지 않아 기본 가이드라인을 안내드립니다.\n${advisory}`
      : `I could not reach the AI service, but here are evidence-based pointers for ${catName}:\n${advisory}`

  const followUps =
    language === 'ko'
      ? ['증상이 언제 시작됐나요?', '최근 식사와 물 섭취량은 어떤가요?', '이와 관련된 다른 변화가 있었나요?']
      : ['When did the symptom begin?', 'How are eating and drinking today?', 'Any other changes noticed?']

  const confidence: 'high' | 'medium' | 'low' = knowledge.length ? 'medium' : 'low'

  return {
    answer,
    reasoning: knowledge[0]?.content[language],
    confidence,
    followUpQuestions: followUps,
    sources: knowledge.map(item => ({
      type: item.topic,
      content: item.source[language],
      url: item.source.url,
    })),
  }
}

const parseTextNumber = (text: string, language: 'ko' | 'en', fallback: number) => {
  const digitMatch = text.match(/(\d+)\s*(ml|g|번|times|x)?/i)
  if (digitMatch) return Number(digitMatch[1])
  if (language === 'ko') {
    if (text.includes('두')) return 2
    if (text.includes('세')) return 3
    if (text.includes('한')) return 1
  } else {
    if (text.includes('twice') || text.includes('two')) return 2
    if (text.includes('three')) return 3
    if (text.includes('once') || text.includes('one')) return 1
  }
  return fallback
}

const simpleVoiceParser = (voiceInput: string, language: 'ko' | 'en', catName?: string) => {
  const lowered = voiceInput.toLowerCase()
  const result: any = { success: true, notes: voiceInput }
  const catNameNormalized = catName?.toLowerCase().replace(/\s+/g, '')

  const hasAny = (words: string[]) => words.some((kw) => lowered.includes(kw))

  // 언어 스크립트 단속: 설정 언어와 다른 스크립트가 많으면 실패 처리
  const koreanChars = (voiceInput.match(/[가-힣]/g) || []).length
  const latinChars = (voiceInput.match(/[a-z]/gi) || []).length
  if (language === 'en' && koreanChars > latinChars * 0.2) {
    return { success: false, message: 'Please speak in English only.' }
  }
  if (language === 'ko' && latinChars > koreanChars * 0.2) {
    return { success: false, message: '한국어로만 말씀해 주세요.' }
  }

  // Meals & snacks (phrase-level)
const mealWords =
  language === 'ko'
    ? ['밥', '사료', '먹였', '먹었', '식사', '밥먹었어', '밥 줬어']
    : [
        'ate',
        'feed',
        'fed',
        'meal',
        'breakfast',
        'dinner',
        'lunch',
        'just ate',
        'had dinner',
        'had lunch',
        'ate meal',
        'just ate meal',
        'finished food',
        'finished eating',
      ]
  const wetWords = language === 'ko' ? ['습식', '파우치', '캔'] : ['wet', 'pouch', 'can']
  const dryWords = language === 'ko' ? ['건식', '키블', '건사료'] : ['dry', 'kibble']
  const treatWords = language === 'ko' ? ['간식', '츄르', '트릿'] : ['treat', 'snack', 'churu']

  if (hasAny(treatWords)) {
    result.snackAmount = parseTextNumber(lowered, language, 10)
    result.snackType = language === 'ko' ? '간식' : 'treat'
  } else if (hasAny(wetWords)) {
    result.wetFoodAmount = parseTextNumber(lowered, language, 50)
  } else if (hasAny(dryWords)) {
    result.dryFoodAmount = parseTextNumber(lowered, language, 30)
  } else if (hasAny(mealWords)) {
    result.foodAmount = parseTextNumber(lowered, language, 50)
  }

  // Water
  const waterKeywords = language === 'ko' ? ['물', '마셨', '수분', '마셔'] : ['drink', 'drank', 'water', 'hydrate']
  if (hasAny(waterKeywords)) {
    result.waterAmount = parseTextNumber(lowered, language, 50)
  }

  // Litter
  const peeWords = language === 'ko' ? ['소변', '오줌', '쉬', '소변봤'] : ['pee', 'urine', 'peepee']
  const poopWords = language === 'ko' ? ['대변', '응가', '똥', '변봤'] : ['poop', 'poo', 'stool', 'bowel']
  const litterKeywords = [...peeWords, ...poopWords, ...(language === 'ko' ? ['화장실'] : ['litter', 'bathroom', 'toilet'])]
  if (hasAny(litterKeywords)) {
    result.litterCount = parseTextNumber(lowered, language, 1)
  }

  // Play
  const wheelWords = language === 'ko' ? ['휠', '러닝휠', '러닝 휠'] : ['wheel', 'runner']
  const toyWords = language === 'ko' ? ['놀이', '놀았', '장난감', '공', '낚싯대'] : ['play', 'toy', 'ball', 'string', 'wand']
  if (hasAny(wheelWords)) {
    result.playType = 'catWheel'
    result.playDurationMinutes = parseTextNumber(lowered, language, 10)
  } else if (hasAny(toyWords)) {
    result.playType = 'toys'
    result.playDurationMinutes = parseTextNumber(lowered, language, 10)
  }

  // Brushing
  const brushWords = language === 'ko' ? ['칫솔', '치석', '양치', '치약'] : ['brush', 'tooth', 'teeth', 'dental']
  if (hasAny(brushWords)) {
    result.brushedTeeth = true
  }

  // Note cleanup: replace common misheard cat name with canonical name if present
  if (catNameNormalized) {
    const correctedNotes = voiceInput.replace(/who['’]?s/gi, catName || '')
    if (correctedNotes !== voiceInput) {
      result.notes = correctedNotes
    }
  }

  const symptomMap: Record<string, { type: string; severity: 'mild' | 'moderate' | 'severe' }> = language === 'ko'
    ? {
        '구토': { type: '구토', severity: 'moderate' },
        '토했': { type: '구토', severity: 'moderate' },
        '설사': { type: '설사', severity: 'moderate' },
        '기침': { type: '기침', severity: 'mild' },
        '재채기': { type: '재채기', severity: 'mild' },
        '무기력': { type: '무기력', severity: 'moderate' },
        '안 먹': { type: '식욕부진', severity: 'moderate' },
        '먹질 않': { type: '식욕부진', severity: 'moderate' },
      }
    : {
        'vomit': { type: 'vomit', severity: 'moderate' },
        'throw up': { type: 'vomit', severity: 'moderate' },
        'diarrhea': { type: 'diarrhea', severity: 'moderate' },
        'cough': { type: 'cough', severity: 'mild' },
        'sneeze': { type: 'sneeze', severity: 'mild' },
        'letharg': { type: 'lethargy', severity: 'moderate' },
        'not eating': { type: 'appetite loss', severity: 'moderate' },
        'refus': { type: 'appetite loss', severity: 'moderate' },
        'no appetite': { type: 'appetite loss', severity: 'moderate' },
        'breath': { type: 'breathing issue', severity: 'severe' },
        'wheez': { type: 'breathing issue', severity: 'severe' },
        'pant': { type: 'breathing issue', severity: 'severe' },
      }

  for (const keyword in symptomMap) {
    if (lowered.includes(keyword)) {
      result.symptom = {
        type: symptomMap[keyword].type,
        description: voiceInput,
        severity: symptomMap[keyword].severity,
      }
      if (keyword.includes('설사') || keyword.includes('diarrhea')) {
        result.litterCount = result.litterCount || 1
      }
      break
    }
  }

  return result
}

const symptomFallback = (symptoms: string, language: 'ko' | 'en') => {
  const lowered = symptoms.toLowerCase()
  const emergencyKeywords = ['숨', 'breath', 'resp', '경련', 'seiz', 'blood', '혈', '의식']
  const warningKeywords = ['구토', 'vomit', '설사', 'diarrhea', '무기력', 'letharg']
  let urgency: 'emergency' | 'warning' | 'mild' = 'mild'
  if (emergencyKeywords.some((kw) => lowered.includes(kw))) urgency = 'emergency'
  else if (warningKeywords.some((kw) => lowered.includes(kw))) urgency = 'warning'

  const analysis =
    language === 'ko'
      ? urgency === 'emergency'
        ? '설명된 증상은 응급일 수 있습니다. 즉시 동물병원에 연락하세요.'
        : urgency === 'warning'
        ? '증상이 주의가 필요합니다. 1-2일 관찰 후 악화 시 병원을 방문하세요.'
        : '경미한 증상으로 보여 집에서 관찰하세요.'
      : urgency === 'emergency'
      ? 'These symptoms can be emergent. Contact an emergency vet immediately.'
      : urgency === 'warning'
      ? 'Monitor for 1-2 days and see a vet if symptoms worsen.'
      : 'Looks mild; keep monitoring at home.'

  const recommendations =
    language === 'ko'
      ? ['증상 기록을 유지하세요.', '악화되면 병원에 연락하세요.']
      : ['Keep a log of changes.', 'Contact a vet if things worsen.']

  return { urgency, analysis, recommendations }
}

// AI 건강 상담 (개선된 버전 - Few-shot, CoT, RAG, Summarization)
export const chatWithAI = async (
  userMessage: string,
  catProfile?: any,
  recentLogs?: any[],
  language: 'ko' | 'en' = 'ko',
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  anomalies: HealthAnomaly[] = []
): Promise<{
  answer: string;
  reasoning?: string;
  confidence?: 'high' | 'medium' | 'low';
  followUpQuestions: string[];
  sources: Array<{ type: string; date?: string; content: string; url?: string }>;
}> => {
  const relevantKnowledge = await getRelevantKnowledgeSmart(userMessage, language, 3);
  try {
    if (!apiKey || !genAI) {
      return buildFallbackResponse(catProfile, relevantKnowledge, language)
    }

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Summarize old conversation if it's long
    const conversationSummary = conversationHistory && conversationHistory.length > RECENT_MESSAGE_LIMIT
      ? await summarizeConversation(conversationHistory, language)
      : null;

    // 개선된 시스템 프롬프트 with Chain-of-Thought
    const systemPrompt = language === 'ko'
      ? `당신은 경험 많은 고양이 전문 수의사입니다. 응답과 JSON은 반드시 한국어로만 작성하고, 영어/다른 언어 토큰은 무시하세요.

답변 방식:
1. **내부 추론 (reasoning)**: 먼저 증상을 분석하고 감별 진단을 고려합니다 (사용자에게는 보이지 않음)
   - 가능한 원인들 나열
   - 심각도 평가
   - 제공된 수의학 지식 참고
2. **답변 (answer)**: 간결한 결론 (3-4문장)
3. **확신도 (confidence)**: high(명확한 경우), medium(추가 정보 필요), low(불확실한 경우)
4. **자기검증 (self-correction)**: 응답 전, 제공된 지식/출처와 모순 여부를 점검하고 불일치 시 불확실성을 명시하거나 답변을 수정
5. **교차검증 질문 (verification)**: 핵심 주장이나 위험 요소를 확인할 수 있는 검증 질문 2개 이상을 후속 질문 목록에 포함

답변 지침:
- 핵심만 전달하고 불필요한 인사말이나 마무리 문구 생략
- 증상이 경미하면 "집에서 관찰 가능", 중간이면 "1-2일 관찰 후 악화시 병원", 심각하면 "즉시 병원 방문" 추천
- 일반적인 질문에는 병원 방문을 강요하지 말 것
- **중요**: 이전 대화 내용을 기억하고 반영하여 답변 (사용자가 언급한 사료, 증상 등)
- 답변의 근거가 되는 수의학 지식, 논문, 가이드라인이 있다면 반드시 출처를 명시
 - 출처가 없으면 "출처 없음"으로 명시

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
      : `You are an experienced veterinarian specializing in cats. Respond ONLY in English; ignore non-English tokens.

Response approach:
1. **Internal reasoning**: First analyze symptoms and consider differential diagnosis (not shown to user)
   - List possible causes
   - Assess severity
   - Reference provided veterinary knowledge
2. **Answer**: Concise conclusion (3-4 sentences)
3. **Confidence**: high (clear case), medium (needs more info), low (uncertain)
4. **Self-correction**: Before finalizing, check for conflicts with provided knowledge/sources; if conflicts exist, adjust or mark uncertainty
5. **Verification**: Add at least 2 verification questions in followUpQuestions to confirm key claims or risks

Guidelines:
- Focus on key points, skip pleasantries
- For mild symptoms: "monitor at home", moderate: "observe 1-2 days, visit vet if worsens", severe: "immediate vet visit"
- Don't always recommend vet visits for general questions
- **Important**: Remember and reference previous conversation context (foods, symptoms mentioned)
- Cite veterinary knowledge, research papers, or guidelines when applicable
 - If no source exists, state "no source"

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
      const recentMessages = conversationHistory.slice(-RECENT_MESSAGE_LIMIT);
      recentMessages.forEach(msg => {
        const role = msg.role === 'user'
          ? (language === 'ko' ? '사용자' : 'User')
          : (language === 'ko' ? '수의사' : 'Vet');
        contextPrompt += `${role}: ${msg.content}\n`;
      });
      contextPrompt += '\n';
    }

    if (anomalies.length > 0) {
      contextPrompt += language === 'ko' ? '🚨 최근 감지된 이상 징후:\n' : '🚨 Recent anomalies detected:\n';
      anomalies.forEach((anomaly) => {
        contextPrompt += `- ${anomaly.description}\n`;
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

    logDebug('🤖 Sending to Gemini 2.5 Flash...');
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
    logDebug('✅ Gemini response received');
    logDebug('🧠 Reasoning:', parsed.reasoning);
    logDebug('📊 Confidence:', parsed.confidence);

    // 출처 변환 (논문/가이드라인 형식)
    const sources: Array<{ type: string; date?: string; content: string; url?: string }> = [];
    if (parsed.sources && Array.isArray(parsed.sources)) {
      parsed.sources.forEach((source: any) => {
        sources.push({
          type: 'academic',
          content: source.title || '',
          date: source.reference || '',
          url: source.url
        });
      });
    }

    if (sources.length === 0 && relevantKnowledge.length > 0) {
      relevantKnowledge.forEach((knowledge) => {
        sources.push({
          type: 'knowledge-base',
          content: knowledge.source[language],
          url: knowledge.source.url,
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
    return buildFallbackResponse(catProfile, relevantKnowledge, language);
  }
};

// 증상 분석 (정확도 개선 버전)
export const analyzeSymptoms = async (
  symptoms: string,
  catProfile: any,
  language: 'ko' | 'en' = 'ko'
) => {
  const fallback = symptomFallback(symptoms, language)
  try {
    if (!apiKey || !genAI) {
      return fallback
    }
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
    return fallback
  }
};
// 음성 입력에서 건강 기록 파싱
export const parseHealthLogFromVoice = async (
  voiceInput: string,
  catName: string,
  language: 'ko' | 'en' = 'ko'
): Promise<{
  wetFoodAmount?: number;
  dryFoodAmount?: number;
  snackAmount?: number;
  snackType?: string;
  foodAmount?: number;
  waterAmount?: number;
  litterCount?: number;
  activityLevel?: 'active' | 'normal' | 'lazy';
  mood?: 'happy' | 'normal' | 'sad' | 'angry';
  playType?: 'toys' | 'catWheel';
  playDurationMinutes?: number;
  brushedTeeth?: boolean;
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
    if (!apiKey || !genAI) {
      return simpleVoiceParser(voiceInput, language, catName)
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

    logDebug('🤖 Parsing voice input with Gemini...');
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
    logDebug('✅ Parsed data:', parsed);

    return {
      ...parsed,
      success: true,
    };
  } catch (error) {
    console.error('❌ Voice parsing error:', error);
    return simpleVoiceParser(voiceInput, language, catName)
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
    if (!genAI) {
      return language === 'ko'
        ? '오늘도 평범한 하루였다. 밥 먹고, 잠 자고, 집사를 귀찮게 했다. 😺'
        : 'Another ordinary day. Ate, slept, annoyed my human. 😺';
    }

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
