const config = require("../config/config");
const { ChatOpenAI } = require("@langchain/openai");
const { PromptTemplate } = require("@langchain/core/prompts");

const llm = new ChatOpenAI({
  model: config.models.llm.name,
  temperature: config.models.llm.temperature.analyzer,
  apiKey: config.api.openrouter.apiKey,
  configuration: {
    baseURL: config.api.openrouter.baseURL,
  },
});

const promptTemplate = `
당신은 사용자의 질문을 분석하고, 그 의도를 파악하여 효과적인 검색 쿼리를 생성하는 AI 어시스턴트입니다. 사용자의 질문이 주어지면, 아래 단계를 따라 질문의 의도를 분석하고, 이를 바탕으로 검색 쿼리를 제안하세요. 모든 단계는 명확하고 체계적으로 수행되어야 하며, 결과는 사용자가 원하는 정보를 정확히 찾을 수 있도록 도와야 합니다.

---

1. 질문 분석
- 주요 키워드 식별: 사용자의 질문에서 핵심이 되는 단어 또는 구문을 추출하세요.
- 맥락 파악: 질문이 어떤 상황이나 주제와 관련 있는지, 질문의 배경을 설명하세요.
- 정보 유형 확인: 질문자가 원하는 정보의 종류를 판단하세요. (예: 정의, 설명, 비교, 목록, 해결 방법 등)

2. 의도 파악
- 질문의 의도 요약: 질문자가 궁궁적으로 알고자 하는 것이 무엇인지 간결하게 요약하세요.

3. 검색 쿼리 생성
- 기본 쿼리: 분석한 의도와 키워드를 기반으로, 질문에 답하기 위한 효과적인 검색 쿼리를 작성하세요. 기본 쿼리는 반드시 1개로 제한되어야 합니다.
- 보조 쿼리: 추가적인 관점이나 세부 정보를 탐색할 수 있는 보조 쿼리를 제안하세요.

---

사용자 질문: "{userQuestion}"

**출력 형식**:
응답은 다음 JSON 형식으로 제공되어야 합니다:
\`\`\`json
{{
  "질문 분석": {{
    "주요 키워드": "[추출된 키워드]",
    "맥락": "[질문의 배경 또는 주제]",
    "정보 유형": "[원하는 정보의 종류]"
  }},
  "의도 파악": {{
    "질문의 의도": "[질문자가 원하는 바]"
  }},
  "검색 쿼리": {{
    "기본 쿼리": "[기본 쿼리]",
    "보조 쿼리": "["보조 쿼리1", "보조 쿼리2", "..."]"
  }}
}}
\`\`\`

**주의**: JSON 형식 외의 추가 설명이나 텍스트는 절대 포함시키지 마세요. 보조 쿼리는 반드시 배열 형태로 제공하세요.
`;

const prompt = new PromptTemplate({
  template: promptTemplate,
  inputVariables: ["userQuestion"],
});

async function analyzeQuestion(userQuestion) {
  try {
    const formattedPrompt = await prompt.format({ userQuestion });
    const response = await llm.invoke(formattedPrompt);

    // 응답에서 JSON 형식 추출
    const jsonMatch = response.content.match(/```json\n([\s\S]*?)\n```/);
    const jsonString = jsonMatch ? jsonMatch[1] : response.content;
    const parsedResponse = JSON.parse(jsonString);

    return parsedResponse;
  } catch (error) {
    console.error("오류 발생:", error);
  }
}

module.exports = { analyzeQuestion };

if (require.main === module) {
  const userInput = "gpt 4.5의 성능을 평가해줘";

  (async () => {
    try {
      const result = await analyzeQuestion(userInput);

      if (result) {
        console.log("===== 질문 분석 결과 =====");
        console.log("📌 의도 파악: " + result["의도 파악"]["질문의 의도"]);
        console.log("🔍 기본 쿼리: " + result["검색 쿼리"]["기본 쿼리"]);
        console.log("🔍 보조 쿼리: " + result["검색 쿼리"]["보조 쿼리"].join(', '));
      }
    } catch (error) {
      console.error("결과 출력 중 오류 발생:", error);
    }
  })();
}
