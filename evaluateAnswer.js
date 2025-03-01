require("dotenv").config();
const { ChatOpenAI } = require("@langchain/openai");
const { ChatPromptTemplate } = require("@langchain/core/prompts");

const llm = new ChatOpenAI({
  model: "google/gemini-2.0-flash-thinking-exp-1219:free",
  temperature: 0.2,
  apiKey: process.env.OPENROUTER_API_KEY,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
});

async function evaluateAnswer(question, answer) {
  try {
    // 프롬프트 템플릿
    const evaluationPrompt = ChatPromptTemplate.fromTemplate(`
    당신은 매우 엄격한 답변 품질 평가자입니다. 
    사용자의 질문과 생성된 답변을 비교하여 답변의 적절성을 철저히 평가하세요.

    질문: {question}
    생성된 답변: {answer}

    다음 기준으로 답변을 세밀하게 평가하세요:
    1. 관련성(25%): 답변이 질문과 얼마나 관련이 있는지
    2. 정확성(30%): 답변이 얼마나 정확하고 검증 가능한 정보를 제공하는지
    3. 완전성(30%): 질문에 충분히 대답했는지, 중요한 정보가 누락되지 않았는지
    4. 명확성(15%): 답변이 이해하기 쉽고 명확한지

    점수 평가 지침:
    - 10점: 완벽함. 모든 측면에서 뛰어나며 개선의 여지가 전혀 없음
    - 9점: 매우 훌륭함. 단, 모든 정보가 검증 가능하고 출처가 명확할 때만 부여
    - 8점: 우수함. 약간의 개선점이 있으나 대체로 매우 좋음
    - 7점: 양호함. 몇 가지 부족한 점이 있으나 전반적으로 괜찮음
    - 6점 이하: 중요한 정보가 빠져있거나 정확성에 의문이 있는 경우

    엄격한 감점 기준:
    - 주요 주장에 대한 근거가 불충분하면 -2점
    - 중요한 정보 영역이 완전히 누락되면 -2점

    JSON 형식으로 다음 필드를 포함하여 응답하세요:
    {{
      "score": (1-10 사이의 전체 점수),
      "evaluation": (평가 설명),
      "isAdequate": (true/false, 8점 이상이면 true),
      "missingInfo": (부족한 정보 목록),
      "improvedQuery": (정보 부족 해결을 위한 하나의 개선된 검색 쿼리만 문자열로 제공)
    }}

    중요: improvedQuery 필드에는 반드시 하나의 검색 쿼리만 제공하세요. 여러 쿼리가 아닌 가장 효과적인 단일 쿼리를 작성하세요.
    `);

    // 평가 수행
    const evaluationResponse = await llm.invoke(
      await evaluationPrompt.format({
        question,
        answer,
      })
    );

    // JSON 추출
    const evaluationText = evaluationResponse.content;
    let evaluationResult;

    try {
      // JSON 형식으로 파싱
      evaluationResult = JSON.parse(
        evaluationText.replace(/```json|```/g, "").trim()
      );
    } catch (error) {
      console.error("JSON 파싱 오류:", error);
    }

    return evaluationResult;
  } catch (error) {
    console.error("답변 평가 중 오류 발생:", error);
  }
}

module.exports = { evaluateAnswer };

if (require.main === module) {
  (async () => {
    const question = "gpt 4.5의 성능을 평가해줘";
    const answer = `## GPT-4.5 성능 평가 보고서
**1. 서론**

GPT-4.5는 OpenAI에서 개발한 언어 모델로, 'Orion'이라는 명칭으로도 알려져 있습니다. 본 보고서는 현재까지 공개된 정보를 바탕으로 GPT-4.5의 성능을 객관적으로 평가하고자 합니다. 평가는 아카데믹 테스트와 AI 벤치마크 테스트 결과를 중심으로 이루어집니다.

**2. 아카데믹 테스트 성능**

GPT-4.5는 아카데믹 테스트에서 수학 및 과학 분야에서 뛰어난 능력을 보였습니다. 하지만, AI Reasoning 모델과 비교했을 때 상대적으로 낮은 성능을 나타냈습니다. 특히, AIME(American Invitational Mathematics Examination), GPQA(General Purpose Question Answering)와 같은 고난도 학술 문제 해결 능력 평가에서 DeepSeek의 R1 모델 및 OpenAI의 O3-mini 모델에 비해 낮은 점수를 기록했습니다. 이는 GPT-4.5가 특정 학문 분야에서는 강점을 보이지만, 고도의 추론 능력을 요구하는 영역에서는 경쟁 모델 대비 성능 개선의 여지가 있음을 시사합니다.

**3. AI 벤치마크 테스트 성능**

AI 벤치마크 테스트 중 에이전트 코딩 평가(Agentic Coding Evaluation)에서 GPT-4.5는 65%의 점수를 획득했습니다. 이는 준수한 성적이지만, 앤트로픽(Anthropic)의 클로드 소넷(Claude Sonnet) 3.7 모델이 기록한 67%에는 미치지 못하는 결과입니다. 해당 결과는 GPT-4.5의 코딩 능력 및 문제 해결 능력이 경쟁 모델과 유사하거나 다소 낮은 수준일 수 있음을 나타냅니다.

**4. 결론**

종합적으로 판단했을 때, GPT-4.5는 수학, 과학 분야에서 우수한 성능을 보이는 반면, AI Reasoning 모델과 비교하여 추론 능력에서는 상대적으로 약점을 드러냈습니다. 또한, 에이전트 코딩 평가 벤치마크에서는 클로드 소넷 3.7 모델보다 낮은 점수를 기록하며 코딩 능력 측면에서도 경쟁 모델 대비 우위를 점하지 못하는 것으로 평가됩니다.

**5. 정보의 한계 및 추가 정보 요청**

본 보고서는 제한적인 정보에 기반하여 작성되었으며, GPT-4.5의 전체적인 성능을 포괄적으로 평가하기에는 한계가 있습니다. GPT-4.5의 성능에 대한 보다 정확하고 심층적인 평가를 위해서는 다양한 벤치마크 테스트 결과, 실제 사용 사례 분석, 그리고 개발사에서 제공하는 추가적인 기술 정보가 필요합니다. 향후 더 많은 정보가 확보된다면, GPT-4.5의 성능을 더욱 상세하게 분석하고 평가할 수 있을 것입니다.`;

    const result = await evaluateAnswer(question, answer);
    console.log(result);
  })();
}
