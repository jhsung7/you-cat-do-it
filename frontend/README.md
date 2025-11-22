# You CAT do it - Frontend

고양이 건강 관리 웹 애플리케이션

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 Gemini API 키를 설정하세요:

```bash
cp .env.example .env
```

`.env` 파일을 열고 API 키를 입력하세요:

```
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

#### Gemini API 키 발급 방법

1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. Google 계정으로 로그인
3. "Create API Key" 클릭
4. 생성된 API 키를 복사하여 `.env` 파일에 붙여넣기

### 3. 개발 서버 실행

```bash
npm run dev
```

개발 서버가 `http://localhost:5173`에서 실행됩니다.

### 4. 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

## 📋 주요 기능

### Phase 1 (완료)

- ✅ **증상 기록 + AI 긴급도 판단**
  - 7개 카테고리 증상 체크리스트
  - Gemini AI 기반 긴급도 자동 평가 (🔴응급/🟡주의/🟢경미)

- ✅ **체중 그래프 시각화**
  - Recharts를 이용한 시계열 차트
  - 급격한 변화 자동 감지 (±5%)
  - 최소/평균/최대 통계

- ✅ **병원 기록 관리**
  - 진료 일지 (병원명, 수의사, 진단, 치료)
  - 처방약 관리 (약품명, 용량, 복용 빈도)
  - 재진 날짜 및 진료비 기록

### 기존 기능

- 고양이 프로필 관리 (다묘 가정 지원)
- 일일 건강 기록 (식사, 수분, 배변, 기분)
- 음성 입력 + AI 파싱
- 빠른 입력 버튼 (원클릭 기록)
- 캘린더 뷰
- AI 건강 상담 (Gemini 2.5 Flash)
- 다국어 지원 (한국어/영어)

## 🛠️ 기술 스택

- **Frontend**: React 18 + TypeScript + Vite
- **상태 관리**: Zustand (persist middleware)
- **스타일링**: Tailwind CSS
- **차트**: Recharts
- **AI**: Google Gemini 2.5 Flash
- **다국어**: i18next + react-i18next
- **저장소**: localStorage (클라이언트 사이드)

## 📁 프로젝트 구조

```
frontend/
├── src/
│   ├── components/        # 재사용 가능한 컴포넌트
│   │   ├── SymptomChecker.tsx
│   │   ├── WeightChart.tsx
│   │   ├── WeightLogger.tsx
│   │   ├── VetVisitLogger.tsx
│   │   └── Calendar.tsx
│   ├── pages/            # 페이지 컴포넌트
│   │   ├── Dashboard.tsx
│   │   ├── HealthLog.tsx
│   │   └── AIChat.tsx
│   ├── services/         # API 및 서비스
│   │   ├── gemini.ts     # Gemini AI 연동
│   │   ├── storage.ts    # localStorage 관리
│   │   └── speech.ts     # 음성 인식
│   ├── store/            # Zustand 스토어
│   │   ├── catStore.ts
│   │   └── healthStore.ts
│   ├── types/            # TypeScript 타입 정의
│   │   ├── cat.ts
│   │   └── health.ts
│   └── locales/          # 다국어 리소스
│       └── index.ts
└── public/
```

## 🔐 보안 주의사항

- `.env` 파일은 **절대 Git에 커밋하지 마세요**
- API 키는 절대 코드에 하드코딩하지 마세요
- `.gitignore`에 `.env` 파일이 포함되어 있는지 확인하세요

## 📝 라이선스

MIT License
