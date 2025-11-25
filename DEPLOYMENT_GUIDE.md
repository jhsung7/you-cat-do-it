# 🚀 Render + GitHub Pages 배포 가이드

완벽한 무료 배포 설정입니다!

---

## 📋 **배포 순서**

1. ✅ 백엔드를 Render에 배포
2. ✅ 프론트엔드를 GitHub Pages에 배포
3. ✅ 연결 테스트

---

## Part 1: 백엔드 Render 배포 🔧

### **Step 1-1: GitHub에 코드 푸시**

```bash
cd /Users/jh/you-cat-do-it-v1

# Git 초기화 (아직 안 했다면)
git init
git add .
git commit -m "Initial commit with backend and frontend"

# GitHub 저장소 생성 후 (github.com에서)
git remote add origin https://github.com/YOUR_USERNAME/you-cat-do-it-v1.git
git branch -M main
git push -u origin main
```

### **Step 1-2: Render 계정 생성 & 배포**

1. **Render 가입**
   - https://render.com 방문
   - "Get Started for Free" 클릭
   - GitHub 계정으로 로그인

2. **New Web Service 생성**
   - Dashboard에서 "New +" → "Web Service" 클릭
   - "Build and deploy from a Git repository" 선택
   - GitHub 저장소 연결 (you-cat-do-it-v1)

3. **배포 설정**
   ```
   Name: cat-health-backend (또는 원하는 이름)
   Region: Oregon (미국) 또는 Singapore (아시아)
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```

4. **환경 변수 설정** (매우 중요!)
   - "Environment" 탭 클릭
   - 다음 환경 변수 추가:

   ```
   GEMINI_API_KEY=AIzaSyDCu3H7TArwm4Be3a0MoeznCO5vSYVsaVA
   FRONTEND_URL=https://YOUR_USERNAME.github.io/you-cat-do-it-v1
   NODE_ENV=production
   ```

   **⚠️ 중요:** `YOUR_USERNAME`을 당신의 GitHub 유저네임으로 변경!

5. **배포 시작**
   - "Create Web Service" 클릭
   - 배포 진행 상황 확인 (약 2-3분 소요)

6. **배포 URL 확인**
   - 배포 완료 후 URL이 생성됩니다:
   - `https://cat-health-backend.onrender.com` (예시)
   - 이 URL을 복사해두세요! 프론트엔드에 필요합니다.

7. **테스트**
   ```bash
   curl https://YOUR_BACKEND_URL.onrender.com/health

   # 응답:
   # {"status":"ok","timestamp":"2025-11-25T..."}
   ```

---

## Part 2: 프론트엔드 GitHub Pages 배포 📱

### **Step 2-1: 백엔드 URL 설정**

```bash
cd frontend

# .env.production 파일 수정
# VITE_API_URL을 Render에서 받은 URL로 변경
echo "VITE_API_URL=https://YOUR_BACKEND_URL.onrender.com" > .env.production
```

예시:
```
VITE_API_URL=https://cat-health-backend.onrender.com
```

### **Step 2-2: vite.config.ts 확인**

`frontend/vite.config.ts` 파일에서 `base` 경로를 확인:

```typescript
export default defineConfig({
  plugins: [react()],
  base: '/you-cat-do-it-v1/',  // 저장소 이름과 일치해야 함
  // ...
})
```

**⚠️ 주의:** GitHub 저장소 이름이 다르면 수정하세요!

### **Step 2-3: gh-pages 패키지 설치**

```bash
cd frontend
npm install -D gh-pages
```

### **Step 2-4: 배포 실행**

```bash
npm run deploy
```

배포 과정:
1. TypeScript 컴파일
2. Vite 빌드
3. GitHub Pages에 업로드

### **Step 2-5: GitHub Pages 설정**

1. GitHub 저장소로 이동:
   `https://github.com/YOUR_USERNAME/you-cat-do-it-v1`

2. "Settings" 탭 클릭

3. 왼쪽 메뉴에서 "Pages" 클릭

4. **Source 설정:**
   - Branch: `gh-pages` 선택
   - Folder: `/ (root)` 선택
   - "Save" 클릭

5. **배포 완료 확인:**
   - 잠시 후 (1-2분) 페이지 상단에 URL이 표시됩니다:
   - `https://YOUR_USERNAME.github.io/you-cat-do-it-v1/`

6. **사이트 방문:**
   - URL을 클릭하면 웹사이트가 열립니다!

---

## Part 3: 연결 테스트 ✅

### **Step 3-1: 브라우저에서 테스트**

1. **프론트엔드 접속:**
   ```
   https://YOUR_USERNAME.github.io/you-cat-do-it-v1/
   ```

2. **AI Chat 페이지로 이동**

3. **질문 입력:**
   - "고양이가 구토를 했어요"
   - AI 응답이 오면 성공!

### **Step 3-2: 개발자 도구로 확인**

1. F12 (개발자 도구) 열기

2. **Network 탭 확인:**
   ```
   Request URL: https://YOUR_BACKEND_URL.onrender.com/api/gemini/generate
   Status: 200 OK
   ```

3. **Console 탭 확인:**
   - 에러가 없어야 정상
   - API 키는 보이지 않음 (성공!)

---

## 🔄 **업데이트 방법**

### **백엔드 업데이트:**

```bash
cd backend
# 코드 수정 후
git add .
git commit -m "Update backend"
git push origin main

# Render가 자동으로 재배포 (2-3분 소요)
```

### **프론트엔드 업데이트:**

```bash
cd frontend
# 코드 수정 후
npm run deploy

# GitHub Pages에 자동 배포
```

---

## 🐛 **문제 해결**

### **문제 1: Render 배포 실패**

**증상:** Build failed 또는 Deploy failed

**해결:**
1. Render 대시보드 → Logs 확인
2. 환경 변수 확인:
   ```
   ✓ GEMINI_API_KEY 설정됨
   ✓ FRONTEND_URL 올바른 URL
   ✓ NODE_ENV=production
   ```
3. `backend/package.json`에 `engines` 확인:
   ```json
   "engines": {
     "node": ">=20.0.0"
   }
   ```

### **문제 2: GitHub Pages 404 에러**

**증상:** 페이지가 404 Not Found

**해결:**
1. GitHub → Settings → Pages 확인
2. Source가 `gh-pages` 브랜치인지 확인
3. `vite.config.ts`의 `base` 경로 확인
4. 다시 배포:
   ```bash
   cd frontend
   npm run deploy
   ```

### **문제 3: CORS 에러**

**증상:** Console에 CORS policy error

**해결:**
1. `backend/server.js` 확인:
   ```javascript
   app.use(cors({
     origin: 'https://YOUR_USERNAME.github.io',  // 올바른 URL
     credentials: true
   }));
   ```
2. Render에서 환경 변수 `FRONTEND_URL` 확인
3. 백엔드 재배포

### **문제 4: AI 응답 안 옴**

**증상:** AI 질문 후 응답 없음

**해결:**
1. **백엔드 Health Check:**
   ```bash
   curl https://YOUR_BACKEND_URL.onrender.com/health
   ```
2. **API 키 확인:**
   - Render → Environment → `GEMINI_API_KEY` 확인
3. **브라우저 Console 확인:**
   - Network 탭에서 에러 메시지 확인
4. **Render 무료 플랜 Sleep:**
   - 15분간 요청 없으면 슬립 모드
   - 첫 요청 시 30초 정도 걸릴 수 있음
   - 잠시 기다리고 다시 시도

### **문제 5: Rate Limit 에러 (429)**

**증상:** "Too many requests" 에러

**해결:**
- 1분당 10번 제한
- 1분 기다린 후 다시 시도
- 필요하면 `backend/server.js`에서 제한 변경:
  ```javascript
  const MAX_REQUESTS_PER_WINDOW = 20;  // 10 → 20으로 증가
  ```

---

## 📊 **배포 상태 확인**

### **백엔드 (Render):**
```bash
# Health check
curl https://YOUR_BACKEND_URL.onrender.com/health

# 응답:
# {"status":"ok","timestamp":"..."}
```

### **프론트엔드 (GitHub Pages):**
```bash
# 사이트 접속
curl -I https://YOUR_USERNAME.github.io/you-cat-do-it-v1/

# 응답:
# HTTP/2 200
```

---

## 🎯 **최적화 팁**

### **1. Render Sleep 방지 (선택사항)**

무료 플랜은 15분 후 슬립되므로, 주기적으로 깨우기:

```javascript
// frontend/src/App.tsx에 추가
useEffect(() => {
  // 5분마다 핑 보내기
  const keepAlive = setInterval(async () => {
    try {
      await fetch(import.meta.env.VITE_API_URL + '/health');
    } catch (e) {
      // 에러 무시
    }
  }, 5 * 60 * 1000);

  return () => clearInterval(keepAlive);
}, []);
```

### **2. 커스텀 도메인 연결**

무료 도메인 서비스:
- Freenom: .tk, .ml, .ga 도메인
- 또는 구매: Namecheap, Cloudflare

GitHub Pages 설정:
1. Settings → Pages → Custom domain
2. 도메인 입력 후 DNS 설정

### **3. HTTPS 강제**

GitHub Pages는 자동으로 HTTPS 제공!
"Enforce HTTPS" 옵션 활성화하세요.

---

## 📱 **모바일 최적화**

이미 적용됨:
- ✅ Responsive design (Tailwind CSS)
- ✅ Touch-friendly UI
- ✅ Fast loading (lazy loading)

추가 권장:
```json
// frontend/public/manifest.json
{
  "name": "Cat Health Tracker",
  "short_name": "CatHealth",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ],
  "start_url": "/",
  "display": "standalone"
}
```

---

## 💰 **비용**

| 서비스 | 비용 | 제한 |
|--------|------|------|
| **Render 무료** | $0 | 750시간/월, 15분 sleep |
| **GitHub Pages** | $0 | 100GB 대역폭/월 |
| **Gemini API** | 무료 | 일일 제한 확인 필요 |

**총 비용: $0 (완전 무료!)** 🎉

---

## 🔐 **보안 체크리스트**

- [x] API 키가 브라우저에 노출되지 않음
- [x] CORS 설정으로 허가된 도메인만 허용
- [x] Rate limiting으로 악용 방지
- [x] HTTPS 사용 (자동)
- [x] 환경 변수로 민감정보 관리
- [ ] (선택) 커스텀 도메인 설정
- [ ] (선택) Analytics 추가

---

## 📞 **도움이 필요하면**

1. **Render 대시보드:**
   - Logs 탭에서 에러 확인
   - Environment 탭에서 변수 확인

2. **GitHub Actions:**
   - Actions 탭에서 배포 로그 확인

3. **브라우저 개발자 도구:**
   - Console: JavaScript 에러
   - Network: API 요청 확인

---

## 🎉 **배포 완료!**

축하합니다! 이제 전 세계 어디서나 접속 가능한 웹사이트를 만들었습니다!

**URL 공유하기:**
```
https://YOUR_USERNAME.github.io/you-cat-do-it-v1/
```

**다음 단계:**
- 친구들과 공유하기
- 모바일에서 테스트하기
- 피드백 받고 개선하기
- 커스텀 도메인 연결하기 (선택)

즐거운 개발 되세요! 🐱💖
