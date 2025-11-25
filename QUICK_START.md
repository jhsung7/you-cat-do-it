# ⚡ 빠른 배포 가이드

## 🚀 3단계로 배포하기

### 1️⃣ **코드를 GitHub에 올리기**

```bash
git init
git add .
git commit -m "Ready for deployment"
git remote add origin https://github.com/YOUR_USERNAME/you-cat-do-it-v1.git
git push -u origin main
```

---

### 2️⃣ **Render에 백엔드 배포**

1. https://render.com 가입 (GitHub 계정으로)
2. "New +" → "Web Service" 클릭
3. 저장소 연결: `you-cat-do-it-v1`
4. 설정:
   ```
   Root Directory: backend
   Build Command: npm install
   Start Command: npm start
   ```
5. 환경 변수 추가:
   ```
   GEMINI_API_KEY=당신의_API키
   FRONTEND_URL=https://YOUR_USERNAME.github.io/you-cat-do-it-v1
   ```
6. "Create Web Service" 클릭
7. 배포 완료! URL 복사 (예: `https://cat-health-backend.onrender.com`)

---

### 3️⃣ **GitHub Pages에 프론트엔드 배포**

```bash
# 백엔드 URL 설정
cd frontend
echo "VITE_API_URL=https://당신의백엔드URL.onrender.com" > .env.production

# gh-pages 설치 & 배포
npm install -D gh-pages
npm run deploy
```

그다음 GitHub에서:
1. Settings → Pages
2. Source: `gh-pages` 브랜치 선택
3. Save!

**완료! 🎉**
```
https://YOUR_USERNAME.github.io/you-cat-do-it-v1/
```

---

## 🔄 **업데이트 하는 법**

### 백엔드 업데이트:
```bash
cd backend
# 코드 수정
git add .
git commit -m "Update"
git push
# Render가 자동 재배포
```

### 프론트엔드 업데이트:
```bash
cd frontend
# 코드 수정
npm run deploy
```

---

## ✅ **체크리스트**

배포 전:
- [ ] GitHub 저장소 생성
- [ ] Gemini API 키 준비
- [ ] Render 계정 생성

배포 후:
- [ ] 백엔드 health check: `curl 백엔드URL/health`
- [ ] 프론트엔드 접속 확인
- [ ] AI Chat 테스트
- [ ] 개발자 도구에서 API 키 노출 안 되는지 확인

---

## 🐛 **문제 해결**

| 문제 | 해결 |
|------|------|
| 404 에러 | vite.config.ts의 base 경로 확인 |
| CORS 에러 | FRONTEND_URL 환경변수 확인 |
| AI 응답 없음 | Render 슬립 (30초 기다림) |
| 빌드 실패 | Render Logs 확인 |

---

## 📞 **도움말**

자세한 가이드: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

문제 발생 시:
1. Render Dashboard → Logs
2. GitHub Actions → Build logs
3. Browser DevTools → Console
