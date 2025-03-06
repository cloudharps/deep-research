# 📝 Deep Research

이 프로젝트는 OpenAI와 Google의 Deep Research, xAI의 Deep Search와 같은 LLM을 활용한 심층 검색 기능을 구현하는 것을 목표로 합니다. 사용자 질문에 대해 웹을 탐색하고, 관련 정보를 수집하여 답변을 제공합니다.

<!-- ## 핵심 기술

### RAG (Retrieval Augmented Generation)

이 프로젝트는 RAG 아키텍처를 기반으로 하여 웹에서 검색한 관련 정보를 LLM의 지식과 결합합니다. RAG는 다음 단계로 구성됩니다:

- **검색(Retrieval)**: 사용자 질문과 관련된 웹 콘텐츠를 검색
- **증강(Augmentation)**: 검색된 콘텐츠를 LLM 프롬프트에 통합
- **생성(Generation)**: 증강된 프롬프트를 바탕으로 답변 생성

### 벡터 임베딩 및 시맨틱 검색

- 추출된 웹 콘텐츠를 임베딩 모델(Google의 text-embedding-004)을 통해 벡터화
- 벡터 유사도 검색으로 사용자 질문과 의미론적으로 가장 관련성 높은 콘텐츠를 식별
- MemoryVectorStore를 활용한 인메모리 벡터 데이터베이스 구현

### 병렬 임베딩 처리

- 대량의 문서 처리 성능 향상을 위한 병렬 임베딩 처리 구현
- 청크를 배치(Batch)로 분할하여 동시에 처리
- Promise.all을 사용한 동시 비동기 처리로 임베딩 속도 최적화

### 적응형 청킹(Adaptive Chunking)

- RecursiveCharacterTextSplitter를 이용한 지능적 문서 분할
- 의미적 경계(문단, 문장 등)를 고려하여 콘텐츠를 적절한 크기의 청크로 분할
- 청크 간 오버랩을 통해 문맥 손실 최소화

### 반복적 개선 프로세스

- 생성된 답변에 대한 품질 평가 및 점수화(1-10점)
- 충분하지 않은 경우, 부족한 정보 영역 자동 식별
- 개선된 검색 쿼리를 생성하여 추가 정보 수집
- 최대 시도 횟수 내에서 답변 품질이 임계값에 도달할 때까지 반복

### 웹 스크래핑 및 콘텐츠 추출

- DuckDuckGo를 통한 검색으로 최신 정보 획득
- @mozilla/readability 라이브러리를 활용한 웹 페이지의 주요 콘텐츠 추출
- 불필요한 요소(광고, 메뉴 등) 제거 및 핵심 콘텐츠 정제 -->

## 동작 로직

1. **사용자 질문 의도 분석**: 사용자의 질문을 분석하여 의도를 파악하고, 검색 쿼리를 생성합니다.
2. **검색 수행 및 자료 수집**: 생성된 쿼리로 웹 검색을 수행하고, 자료를 수집합니다.
3. **답변 생성 및 평가**: 수집된 자료에 기반하여 답변을 생성하고, 답변이 사용자 질문의 의도를 충족 시키는지 평가합니다. 생성된 답변이 평가 기준을 통과하면 최종 결과로 제공하고, 그렇지 않으면 검색 쿼리를 개선하여 2단계로 돌아갑니다. 이 과정은 최대 시도 횟수에 도달할 때까지 반복되며 답변을 개선합니다.

<!-- ## 사용된 라이브러리

- **LangChain**: LLM과의 상호작용 및 체인 생성
- **duck-duck-scrape**: DuckDuckGo 스크래핑 라이브러리
- **axios**: HTTP 요청
- **jsdom** & **@mozilla/readability**: 웹 페이지 파싱 및 콘텐츠 추출
- **dotenv**: 환경 변수 관리 -->

## 설치 및 실행

### 사전 요구사항

- Node.js
- npm 또는 yarn
- OpenRouter와 Google API Key

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

3. `.env` 파일 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음과 같이 설정하세요:

```
OPENROUTER_API_KEY=your_openrouter_api_key # (선택)
GEMINI_API_KEY=your_gemini_api_key  # Google AI Studio에서 발급받은 API 키 (필수)
```

### 실행 방법

두 가지 방법으로 프로그램을 실행할 수 있습니다:

#### 1. 명령줄 인자로 질문 입력

```bash
node src/index.js "당신의 질문"
```

예시:

```bash
node src/index.js "gpt 4.5의 성능을 평가해줘"
```

#### 2. 실행 후 터미널에서 질문 입력

```bash
node src/index.js
```

이후 터미널에 질문을 입력하세요:

```bash
검색하려는 질문을 입력하세요: gpt 4.5의 성능을 평가해줘
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

## 설정

`src/config/config.js` 파일에서 다음 설정을 변경할 수 있습니다:

- 사용할 LLM 모델 및 제공자 
- temperature 설정
- 임베딩 모델
- API 엔드포인트 및 구성

### LLM Provider 설정 

이 프로젝트는 다음 두 가지 LLM API를 지원합니다:

1. **OpenRouter API** (기본값)
   - 다양한 모델에 대한 통합 접근 제공
   - `google/gemini-2.0-flash-thinking-exp:free` 모델 기본 사용

2. **Google Gemini API**
   - Google AI Studio에서 제공하는 직접 API 접근
   - `gemini-1.5-pro` 모델 기본 사용

제공자를 변경하려면 `config.js` 파일에서 `defaultProvider` 값을 수정하세요:

```javascript
global: {
  // "openrouter" 또는 "gemini" 선택 가능
  defaultProvider: "openrouter",
  // defaultProvider: "gemini",
}
```

## 기타

- MIT 라이선스
- 이슈 및 PR은 언제나 환영합니다!
