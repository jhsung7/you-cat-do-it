# 🎯 Render 풀스택 배포 가이드

## Render 한 곳에서 전부 관리하기!

프론트엔드 + 백엔드 모두 Render에 올리는 방법입니다.

---

## ⚡ **빠른 배포 (3단계)**

### **1단계: GitHub에 푸시**

```bash
git add .
git commit -m "Ready for Render full deployment"
git push origin main
```

---

### **2단계: 백엔드 배포**

1. https://render.com 접속
2. "New +" → "Web Service" 클릭
3. 저장소 선택: `you-cat-do-it-v1`
4. 설정:
   ```
   Name: cat-health-backend
   Region: Singapore (또는 Oregon)
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```
5. 환경 변수:
   ```
   GEMINI_API_KEY=AIzaSyDCu3H7TArwm4Be3a0MoeznCO5vSYVsaVA
   FRONTEND_URL=https://cat-health-frontend.onrender.com
   NODE_ENV=production
   ```
6. "Create Web Service" 클릭
7. **백엔드 URL 복사:** `https://cat-health-backend.onrender.com`

---

### **3단계: 프론트엔드 배포**

1. Render 대시보드에서 "New +" → "Static Site" 클릭
2. 같은 저장소 선택: `you-cat-do-it-v1`
3. 설정:
   ```
   Name: cat-health-frontend
   Region: Singapore (백엔드와 같은 지역)
   Root Directory: frontend
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```
4. 환경 변수:
   ```
   VITE_API_URL=https://cat-health-backend.onrender.com
   ```
5. "Create Static Site" 클릭

**완료! 🎉**

프론트엔드 URL: `https://cat-health-frontend.onrender.com`

---

## 📝 **설정 파일로 자동 배포 (선택사항)**

`render-full.yaml` 파일을 사용하면 더 쉽습니다:

1. Render 대시보드 → "New +" → "Blueprint"
2. 저장소 선택
3. `render-full.yaml` 자동 인식
4. 환경 변수만 설정하면 끝!

---

## ⚙️ **환경 변수 설정**

### 백엔드:
```
GEMINI_API_KEY=당신의_API_키
FRONTEND_URL=https://cat-health-frontend.onrender.com
NODE_ENV=production
```

### 프론트엔드:
```
VITE_API_URL=https://cat-health-backend.onrender.com
```

---

## 🔄 **업데이트 방법**

### 백엔드 업데이트:
```bash
cd backend
# 코드 수정
git add .
git commit -m "Update backend"
git push
# Render가 자동 재배포
```

### 프론트엔드 업데이트:
```bash
cd frontend
# 코드 수정
git add .
git commit -m "Update frontend"
git push
# Render가 자동 재배포
```

---

## ⚡ **Render vs GitHub Pages 비교**

| 항목 | Render 풀스택 | Render + GitHub Pages |
|------|---------------|----------------------|
| 설정 복잡도 | ⭐⭐ 간단 | ⭐⭐⭐ 약간 복잡 |
| 관리 | 한 곳 | 두 곳 |
| 프론트 슬립 | ⚠️ 15분 후 | ✅ 없음 |
| 백엔드 슬립 | ⚠️ 15분 후 | ⚠️ 15분 후 |
| 속도 | 빠름 | 더 빠름 (CDN) |
| 커스텀 도메인 | 쉬움 | 분리 설정 |
| 비용 | $0 | $0 |

---

## 💡 **추천**

### **개인 프로젝트라면:**
→ **Render 풀스택** 추천!
- 설정 간단
- 한 곳에서 관리
- 충분히 빠름

### **실제 서비스라면:**
→ **Render + GitHub Pages** 추천!
- 프론트엔드 항상 빠름 (슬립 없음)
- 글로벌 CDN (GitHub)
- 백엔드만 슬립

---

## 🚀 **지금 바로 시작하기**

### Option A: Render 풀스택 (간단)
```bash
git push origin main
# Render에서 백엔드 + 프론트엔드 각각 생성
```

### Option B: GitHub Pages (빠름)
```bash
cd frontend
npm run deploy
# 이미 설정 완료됨
```

---

## 🔍 **테스트**

### 백엔드:
```bash
curl https://cat-health-backend.onrender.com/health
```

### 프론트엔드:
```
https://cat-health-frontend.onrender.com
```

---

## ⚠️ **주의사항**

### Render 무료 플랜:
- 두 서비스 모두 15분 후 슬립
- 첫 요청 시 30초 대기
- 750시간/월 (31일 = 744시간이므로 충분)

### 슬립 방지:
두 가지 모두 깨우려면:
```javascript
// frontend에서 5분마다 핑
setInterval(() => {
  fetch('https://cat-health-backend.onrender.com/health');
  fetch('https://cat-health-frontend.onrender.com/');
}, 5 * 60 * 1000);
```

---

## 📊 **무료 플랜 제한**

| 항목 | 제한 | 충분? |
|------|------|-------|
| 서비스 수 | 무제한 | ✅ |
| 대역폭 | 100GB/월 | ✅ |
| 빌드 시간 | 500분/월 | ✅ |
| 슬립 | 15분 후 | ⚠️ |

---

## 💰 **비용**

**완전 무료!**
- Render 백엔드: $0
- Render 프론트엔드: $0
- 총: $0

유료 업그레이드 시:
- Starter ($7/월): 슬립 없음
- Pro ($25/월): 더 빠른 성능

---

## 🎯 **결론**

### 당신에게 맞는 선택:

**"간단하게 하고 싶다" →** Render 풀스택
**"빠르게 하고 싶다" →** Render + GitHub Pages (이미 설정됨)
**"돈 쓸 수 있다" →** Render Starter ($7)

---

## 📞 **다음 단계**

1. **Render 풀스택으로 변경하려면:**
   - 이 가이드 따라하기
   - 프론트엔드도 Render에 배포

2. **GitHub Pages 유지하려면:**
   - 이미 설정 완료!
   - `QUICK_START.md` 참고

---

**어떤 방법이든 완전 무료입니다!** 🎉

원하는 방식으로 선택하세요!
