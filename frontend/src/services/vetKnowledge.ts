// Veterinary Knowledge Base for RAG (Retrieval-Augmented Generation)
// WSAVA (World Small Animal Veterinary Association)
// AAHA (American Animal Hospital Association)
// AAFCO (Association of American Feed Control Officials)
// Cornell Feline Health Center
export interface VetKnowledge {
  id: string;
  topic: string;
  keywords: string[];
  content: {
    ko: string;
    en: string;
  };
  source: {
    ko: string;
    en: string;
    url?: string;
  };
}

export const vetKnowledgeBase: VetKnowledge[] = [
  {
    id: 'vomiting',
    topic: 'Cat Vomiting',
    keywords: ['토', '구토', '게워', 'vomit', 'throw up', 'regurgitate'],
    content: {
      ko: '단발성 구토(24시간 내 1-2회)는 털뭉치나 급식으로 인해 정상적일 수 있습니다. 그러나 24시간 내 3회 이상, 혈액이나 담즙 동반, 무기력 동반 시 응급 상황입니다. 구토 후 12-24시간 금식하고 소량의 물만 제공하며 관찰하세요.',
      en: 'Single episodes of vomiting (1-2 times per 24 hours) can be normal due to hairballs or eating too quickly. However, 3+ times in 24 hours, presence of blood or bile, or accompanied by lethargy requires emergency care. After vomiting, fast for 12-24 hours and provide only small amounts of water.'
    },
    source: {
      ko: 'WSAVA 소화기 질환 가이드라인, 2022',
      en: 'WSAVA Gastrointestinal Disease Guidelines, 2022',
      url: 'https://wsava.org/global-guidelines/'
    }
  },
  {
    id: 'diarrhea',
    topic: 'Diarrhea',
    keywords: ['설사', 'diarrhea', 'loose stool', '묽은'],
    content: {
      ko: '급성 설사는 식이 변화, 스트레스, 경미한 감염으로 발생할 수 있습니다. 24-48시간 지속되는 경증 설사는 집에서 관찰 가능하나, 혈변, 검은 변, 48시간 이상 지속, 탈수 증상(눈 움푹 들어감, 피부 탄력 저하) 동반 시 즉시 병원 방문이 필요합니다.',
      en: 'Acute diarrhea can result from dietary changes, stress, or mild infections. Mild diarrhea lasting 24-48 hours can be monitored at home, but bloody stool, black stool, persistence beyond 48 hours, or dehydration signs (sunken eyes, poor skin elasticity) require immediate veterinary attention.'
    },
    source: {
      ko: '고양이 소화기 건강 매뉴얼, AAHA, 2023',
      en: 'Feline Digestive Health Manual, AAHA, 2023',
      url: 'https://www.aaha.org'
    }
  },
  {
    id: 'appetite-loss',
    topic: 'Loss of Appetite',
    keywords: ['식욕', '안먹', '밥', '사료', 'appetite', 'eating', 'food', 'anorexia'],
    content: {
      ko: '고양이가 24시간 이상 식사를 거부하면 간 지방증(hepatic lipidosis) 위험이 있습니다. 특히 과체중 고양이에서 48시간 이상 금식 시 생명을 위협할 수 있습니다. 24시간 식욕 부진 시 병원 상담, 48시간 이상 시 즉시 응급 진료가 필요합니다.',
      en: 'Cats refusing food for more than 24 hours risk hepatic lipidosis (fatty liver disease). This is especially dangerous in overweight cats, becoming life-threatening after 48+ hours of fasting. Consult a vet after 24 hours of appetite loss; emergency care is needed after 48+ hours.'
    },
    source: {
      ko: 'Cornell Feline Health Center 영양 가이드, 2023',
      en: 'Cornell Feline Health Center Nutrition Guide, 2023',
      url: 'https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center'
    }
  },
  {
    id: 'urinary-issues',
    topic: 'Urinary Problems',
    keywords: ['소변', '화장실', '오줌', 'urine', 'urinary', 'litter', 'pee'],
    content: {
      ko: '배뇨 곤란, 소량 빈번한 배뇨, 혈뇨, 화장실에서 울부짖음은 요로폐색의 징후일 수 있으며, 특히 수컷 고양이에서 응급 상황입니다. 12시간 이상 배뇨하지 못하면 신부전으로 이어질 수 있어 즉시 응급실 방문이 필요합니다.',
      en: 'Difficulty urinating, frequent small urinations, bloody urine, or crying in the litter box can indicate urinary obstruction, especially emergent in male cats. Inability to urinate for 12+ hours can lead to kidney failure and requires immediate emergency care.'
    },
    source: {
      ko: 'International Cat Care 요로 건강 가이드, 2023',
      en: 'International Cat Care Urinary Health Guide, 2023',
      url: 'https://icatcare.org'
    }
  },
  {
    id: 'breathing-difficulty',
    topic: 'Breathing Difficulty',
    keywords: ['숨', '호흡', '헐떡', 'breathing', 'respiratory', 'panting', 'wheeze'],
    content: {
      ko: '고양이의 입벌림 호흡, 빠른 호흡(분당 40회 이상), 복부를 이용한 호흡은 심각한 호흡곤란의 징후입니다. 고양이는 개와 달리 헐떡이지 않으므로, 이런 증상은 즉시 응급 진료가 필요합니다. 천식, 심부전, 흉수 등 생명을 위협하는 상황일 수 있습니다.',
      en: 'Open-mouth breathing, rapid breathing (>40 breaths/min), or abdominal breathing indicates severe respiratory distress. Unlike dogs, cats do not pant, so these signs require immediate emergency care. This can indicate life-threatening conditions like asthma, heart failure, or pleural effusion.'
    },
    source: {
      ko: 'RECOVER 고양이 응급 치료 지침, 2022',
      en: 'RECOVER Feline Emergency Care Guidelines, 2022',
      url: 'https://recoverinitiative.org'
    }
  },
  {
    id: 'nutrition-basics',
    topic: 'Feline Nutrition',
    keywords: ['사료', '영양', '먹이', 'food', 'nutrition', 'diet', 'feed'],
    content: {
      ko: '고양이는 절대 육식동물로 타우린, 아라키돈산, 비타민A(프리포름) 등이 필수입니다. 성묘는 체중 kg당 40-60kcal가 필요하며, AAFCO 또는 FEDIAF 기준을 충족하는 사료를 선택해야 합니다. 로얄캐닌, 힐스, 퓨리나 프로플랜 등이 과학적으로 검증된 브랜드입니다.',
      en: 'Cats are obligate carnivores requiring taurine, arachidonic acid, and preformed vitamin A. Adult cats need 40-60 kcal per kg body weight. Choose foods meeting AAFCO or FEDIAF standards. Royal Canin, Hills, and Purina Pro Plan are scientifically validated brands.'
    },
    source: {
      ko: 'AAFCO 고양이 영양 기준, 2023',
      en: 'AAFCO Feline Nutrition Standards, 2023',
      url: 'https://www.aafco.org'
    }
  },
  {
    id: 'weight-monitoring',
    topic: 'Weight Management',
    keywords: ['체중', '살', '비만', 'weight', 'obesity', 'fat', 'overweight'],
    content: {
      ko: '이상적 체중에서 10-19% 초과 시 과체중, 20% 이상 시 비만으로 분류됩니다. 비만은 당뇨, 관절염, 간 질환 위험을 증가시킵니다. 체중 감량은 주당 1-2% 이하로 서서히 진행해야 하며, 급격한 감량은 간 지방증을 유발할 수 있습니다.',
      en: 'Cats are considered overweight at 10-19% above ideal weight, obese at 20%+. Obesity increases risks of diabetes, arthritis, and liver disease. Weight loss should be gradual at 1-2% per week maximum; rapid loss can cause hepatic lipidosis.'
    },
    source: {
      ko: 'WSAVA 영양 평가 가이드라인, 2023',
      en: 'WSAVA Nutrition Assessment Guidelines, 2023',
      url: 'https://wsava.org/global-guidelines/'
    }
  },
  {
    id: 'behavioral-changes',
    topic: 'Behavioral Changes',
    keywords: ['행동', '무기력', '공격', 'behavior', 'lethargy', 'aggressive', 'hiding'],
    content: {
      ko: '갑작스러운 행동 변화(숨기, 공격성 증가, 과도한 무기력)는 통증이나 질병의 신호일 수 있습니다. 고양이는 본능적으로 아픔을 숨기므로, 미묘한 행동 변화도 주의 깊게 관찰해야 합니다. 평소와 다른 모습이 2일 이상 지속되면 수의사 상담이 필요합니다.',
      en: 'Sudden behavioral changes (hiding, increased aggression, excessive lethargy) can signal pain or illness. Cats instinctively hide pain, so subtle behavioral changes require careful attention. If unusual behavior persists for 2+ days, veterinary consultation is needed.'
    },
    source: {
      ko: 'AAFP 고양이 통증 관리 가이드라인, 2022',
      en: 'AAFP Feline Pain Management Guidelines, 2022',
      url: 'https://catvets.com/guidelines'
    }
  },
  {
    id: 'hydration',
    topic: 'Water Intake and Hydration',
    keywords: ['물', '수분', '탈수', 'water', 'hydration', 'dehydration', 'drink'],
    content: {
      ko: '고양이는 체중 kg당 하루 40-60ml의 물이 필요합니다(4kg 고양이 = 160-240ml). 탈수 증상: 피부 탄력 저하, 눈 움푹 들어감, 끈적한 잇몸. 만성 탈수는 신장 질환으로 이어질 수 있습니다. 습식 사료 급여와 여러 곳에 물그릇 배치가 도움이 됩니다.',
      en: 'Cats need 40-60ml of water per kg body weight daily (4kg cat = 160-240ml). Dehydration signs: poor skin elasticity, sunken eyes, sticky gums. Chronic dehydration can lead to kidney disease. Wet food feeding and multiple water bowl locations help.'
    },
    source: {
      ko: 'Cornell 수의과대학 고양이 건강 센터, 2023',
      en: 'Cornell University College of Veterinary Medicine Feline Health Center, 2023',
      url: 'https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center'
    }
  },
  {
    id: 'dental-health',
    topic: 'Dental Health',
    keywords: ['치아', '입', '구강', 'dental', 'teeth', 'mouth', 'oral', 'bad breath'],
    content: {
      ko: '3세 이상 고양이의 80%가 치주 질환을 가지고 있습니다. 증상: 구취, 침흘림, 식욕 감소, 한쪽으로만 씹기. 예방: 매일 칫솔질(이상적), 치아 건강 간식, 정기 치과 검진. 치주 질환은 심장, 신장 문제로 이어질 수 있어 정기적인 관리가 중요합니다.',
      en: '80% of cats over 3 years have periodontal disease. Symptoms: bad breath, drooling, decreased appetite, chewing on one side. Prevention: daily brushing (ideal), dental treats, regular dental exams. Periodontal disease can lead to heart and kidney problems, making regular care essential.'
    },
    source: {
      ko: 'AVDC 고양이 치과 건강 지침, 2023',
      en: 'AVDC Feline Dental Health Guidelines, 2023',
      url: 'https://avdc.org'
    }
  }
];

// Simple keyword-based retrieval (can be upgraded to embeddings later)
export const getRelevantKnowledge = (
  query: string,
  _language: 'ko' | 'en' = 'ko',
  topK: number = 2
): VetKnowledge[] => {
  const queryLower = query.toLowerCase();

  // Score each knowledge item based on keyword matches
  const scored = vetKnowledgeBase.map(knowledge => {
    const matchCount = knowledge.keywords.filter(keyword =>
      queryLower.includes(keyword.toLowerCase())
    ).length;

    return { knowledge, score: matchCount };
  });

  // Return top K items with matches
  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(item => item.knowledge);
};
