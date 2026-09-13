# 교실잇다 (ClassBridge)

> **Two classrooms, one shared journey.**  
> 시차와 시간표 제약 없이 각자의 속도로 영어로 교류하고, 교사는 과정중심평가 수행 근거를 한눈에 확인하는 비실시간 국제공동수업 웹앱

---

## 1. 프로젝트 개요

- **프로젝트명**: 교실잇다 (ClassBridge)
- **목적**: 한국(Korea Class)과 대만(Taiwan Class) 초등학교 간 비실시간 국제공동수업 지원 및 교사용 수행 평가 근거 관리
- **주요 기능**:
  - 교사용 범용 활동 제작기 (글쓰기, 선호 투표, 질문·답변)
  - 교사용 학생 작품 대시보드 (과제별 작품함 & 학생별 포트폴리오)
  - 활동 라이프사이클 관리 (공개, 마감, 안전 보관, 영구 삭제 위험 방지)
  - 학생 활동 목록 및 수행 화면 (영어 문장 틀, 선택적 영어 번역문 지원)
  - 3개 국어 다국어 인터페이스 (한국어, English, 繁體中文)
  - 개인정보 최소수집 원칙 (실명 비수집, 무작위 참여코드, 영문 닉네임)

---

## 2. 시연 및 보안 주의사항 (Important Notice)

> [!IMPORTANT]
> **본 배포본은 1차 점검 및 시연을 위한 LocalStorage 기반 MVP입니다.**

1. **데모용 인증 코드 안내**:
   - 앱 내 제공되는 학생 참여코드(예: `K7M4`, `T7A4`) 및 교사 코드(`K-TEACH-2026`, `T-TEACH-2026`)는 **실제 보안 인증이 아니며 시연용 프리셋**입니다.
   - 학생 화면에서 URL 파라미터 조작을 통해 교사 대시보드나 관리자 화면으로 진입하는 것을 클라이언트 라우트 가드로 차단하고 있으나, 이는 UI 수준의 접근 제한입니다.
2. **로컬 스토리지 데이터 격리 안내**:
   - 모든 활동 생성, 학생 제출물, 교사 관찰 메모, 댓글 등은 접속한 **사용자의 브라우저 LocalStorage에만 저장**됩니다.
   - **서로 다른 브라우저, 다른 기기, 시크릿 창 간에는 데이터가 공유되거나 동기화되지 않습니다.**
3. **개인정보 보호 준수**:
   - 실제 학생 성명, 학교 식별 정보, 학번, 사진 등 민감한 개인정보는 일절 수집·저장하지 않습니다.
4. **향후 Firebase 로드맵**:
   - 정식 버전에서는 Firebase Authentication(Google 로그인 및 Teacher/Admin 커스텀 클레임)과 Cloud Firestore Security Rules를 통해 서버 수준의 엄격한 역할 기반 접근 제어(RBAC) 및 양국 실시간 데이터 동기화가 적용됩니다.

---

## 3. 로컬 실행 방법

### 의존성 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm run dev
```
기본 로컬 주소: `http://localhost:5173/`

### 프로덕션 빌드 및 미리보기
```bash
npm run build
npm run preview
```

---

## 4. Vercel 배포 설정 (Vercel Deployment)

Vercel에 연결하여 배포할 때 다음 기본 설정을 확인하세요.

- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### SPA 새로고침 및 라우팅 설정
본 앱은 URL 쿼리 파라미터(`?view=...`, `?lang=...`)를 활용하여 화면을 전환합니다. 브라우저 새로고침이나 직접 URL 입력 시에도 정상 작동하도록 프로젝트 루트의 `vercel.json`에 SPA rewrite 설정이 포함되어 있습니다.

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 5. 빠른 시연 계정 안내 (Demo Presets)

| 역할 | 구분 | 식별 코드 / 닉네임 | 설명 |
| :--- | :--- | :--- | :--- |
| **교사** | Korea Class | `K-TEACH-2026` | 한국 학급 교사 대시보드 (활동 제작/관리/작품함) |
| **교사** | Taiwan Class | `T-TEACH-2026` | 대만 학급 교사 대시보드 |
| **학생** | Korea Class | `K7M4` / Sunny | 한국 학급 학생 활동 및 제출 |
| **학생** | Korea Class | `K2R7` / Leo | 한국 학급 학생 활동 및 제출 |
| **학생** | Taiwan Class | `T7A4` / Alice | 대만 학급 학생 활동 및 제출 |
| **학생** | Taiwan Class | `T2K8` / Kevin | 대만 학급 학생 활동 및 제출 |
| **교류방** | 공통 | `BRIDGE2026` | 배정된 국제 교류방 코드 |
