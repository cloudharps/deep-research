# Deep Research

이 프로젝트는 OpenAI의 Deep Research, Grok의 Deep Search와 같은 LLM을 활용한 심층 검색 기능을 구현하는 것을 목표로 하는 프로젝트입니다. 사용자 질문에 대해 웹을 탐색하고, 관련 정보를 수집하여 정확하고 포괄적인 답변을 제공합니다.

## 주요 기능

- **질문 의도 분석**: 사용자 질문의 의도를 분석하여 최적의 검색 쿼리를 생성
- **웹 검색 및 콘텐츠 추출**: 생성된 쿼리로 웹 검색을 수행하고 관련 내용 추출
- **답변 생성**: 수집된 정보를 바탕으로 포괄적인 답변 생성
- **답변 평가 및 개선**: 생성된 답변의 품질을 평가하고 필요시 추가 검색을 통해 개선

## 동작 로직

1. 사용자 질문을 LLM을 통해 분석하여 검색 쿼리(기본 쿼리 및 보조 쿼리) 생성
2. 생성된 쿼리로 DuckDuckGo를 통해 웹 검색 수행
3. 검색 결과에서 웹 페이지의 주요 콘텐츠 추출
4. 추출된 콘텐츠를 벡터화하여 저장
5. 사용자 질문과 관련된 콘텐츠를 검색하여 답변 생성
6. 생성된 답변의 품질 평가 (10점 만점 기준)
7. 만족스러운 답변이 아닐 경우, 부족한 정보를 식별하고 추가 검색 수행
8. 최대 시도 횟수 내에서 답변 품질이 향상될 때까지 반복
9. 최종 답변 및 참고 자료 출처 제공

## 사용된 라이브러리

- **LangChain**: LLM과의 상호작용 및 체인 생성
- **duck-duck-scrape**: DuckDuckGo 스크래핑 라이브러리 
- **axios**: HTTP 요청
- **jsdom** & **@mozilla/readability**: 웹 페이지 파싱 및 콘텐츠 추출
- **dotenv**: 환경 변수 관리

## 환경 설정

### 필요한 API 키

- **OpenRouter API Key**: LLM 접근을 위한 API 키
- **Google API Key**: 임베딩 모델 접근을 위한 API 키 

### .env 파일 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음과 같이 설정하세요:

```
OPENROUTER_API_KEY=your_openrouter_api_key
GOOGLE_API_KEY=your_google_api_key
```

## 설치 및 실행

### 사전 요구사항

- Node.js (v16 이상 권장)
- npm 또는 yarn

### 설치 방법

1. 저장소 클론:

```bash
git clone https://github.com/yourusername/deep-research.git
cd deep-research
```

2. 의존성 설치:

```bash
npm install
# 또는
yarn install
```

3. `.env` 파일 설정 (위 환경 설정 참조)

### 실행 방법

기본 명령어:

```bash
node src/index.js "당신의 질문"
```

예시:

```bash
node src/index.js "gpt 4.5의 성능을 평가해줘"
```

## 프로젝트 구조

```
deep-research/
├── src/
│   ├── ai/
│   │   ├── analyzeQuestion.js   # 질문 분석
│   │   ├── evaluateAnswer.js    # 답변 평가
│   │   └── generateAnswer.js    # 답변 생성
│   ├── config/
│   │   └── config.js           # 설정 파일
│   ├── tools/
│   │   └── webResearch.js      # 웹 검색 및 콘텐츠 추출
│   └── index.js                # 메인 실행 파일
├── .env                        # 환경 변수
├── package.json
└── README.md
```

## 커스터마이징

`src/config/config.js` 파일에서 다음 설정을 변경할 수 있습니다:

- 사용할 LLM 모델
- 모델 온도(temperature) 설정
- 임베딩 모델 선택
- API 엔드포인트 및 구성

## 라이선스

MIT

## 기여 방법

이슈 및 PR은 언제나 환영합니다!
