const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { Document } = require("langchain/document");
const { createRetrievalChain } = require("langchain/chains/retrieval");
const {
  createStuffDocumentsChain,
} = require("langchain/chains/combine_documents");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { createLLM, createEmbeddingModel } = require("../utils/llmFactory");

const llm = createLLM("generator");

async function generateAnswer(
  query,
  documents,
  previousAnswer = "",
  improvementPoints = []
) {
  try {
    console.time("총 처리 시간");

    // 임베딩 모델 설정
    const embeddings = createEmbeddingModel();

    // 문서 분할기 생성
    console.time("문서 분할 시간");
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000, // 각 청크의 최대 크기
      chunkOverlap: 200, // 청크 간 겹치는 부분 (문맥 유지 목적)
      separators: ["\n\n", "\n", ".", "!", "?", ",", " ", ""], // 분할 우선순위
    });

    const splitDocuments = await textSplitter.splitDocuments(documents);
    console.timeEnd("문서 분할 시간");
    console.log(
      `원본 문서 ${documents.length}개가 ${splitDocuments.length}개의 청크로 분할되었습니다.`
    );

    // 병렬 임베딩 처리
    console.time("임베딩 처리 시간");

    // 청크를 적절한 크기의 배치로 분할
    const BATCH_SIZE = 20; // 배치당 청크 수
    const batches = [];

    for (let i = 0; i < splitDocuments.length; i += BATCH_SIZE) {
      batches.push(splitDocuments.slice(i, i + BATCH_SIZE));
    }

    console.log(`${batches.length}개 배치로 나누어 병렬 처리합니다.`);

    // 각 배치를 병렬로 처리하고 결과 합치기
    // 첫 번째 배치로 벡터 스토어 초기화
    let vectorStore = await MemoryVectorStore.fromDocuments(
      batches[0],
      embeddings
    );

    if (batches.length > 1) {
      await Promise.all(
        batches.slice(1).map(async (batch, idx) => {
          console.log(`배치 ${idx + 2}/${batches.length} 처리 중...`);
          // 각 배치 임베딩 처리
          const batchVectors = await embeddings.embedDocuments(
            batch.map((doc) => doc.pageContent)
          );

          // 임베딩된 벡터를 기존 벡터 스토어에 추가
          await Promise.all(
            batch.map(async (doc, i) => {
              await vectorStore.addVectors([batchVectors[i]], [doc]);
            })
          );
        })
      );
    }

    console.timeEnd("임베딩 처리 시간");

    // 벡터 스토어를 retriever로 변환
    const retriever = vectorStore.asRetriever({
      k: 5, // 상위 5개의 관련 청크 검색
    });

    // 프롬프트 템플릿
    let promptTemplate = `
    당신은 객관적인 정보를 종합하여 보고서 형태로 제공하는 리서치 전문가입니다. 다음 정보를 바탕으로 사용자 질문에 대한 객관적이고 유익한 답변을 작성하세요.

    답변 작성 시 반드시 지켜야 할 지침:
    1. 주어진 참고 자료의 중요한 정보와 핵심 내용을 포함해서 답변하세요.
    2. "컨텍스트에 의하면"과 같은 표현은 사용하지 마세요.
    3. "저는", "제 경험에 의하면", "제가 보기에는" 등 개인적 경험이나 주관적 표현을 절대 사용하지 마세요.
    4. 객관적인 정보 전달자로서 사실과 데이터에 기반한 중립적 어조를 유지하세요.
    5. 필요 시 실제적이고 구체적인 예시와 단계별 조언을 포함하되, 객관적 사실에 근거해야 합니다.
    6. 답변은 논리적 흐름을 가지고 체계적으로 구성된 보고서 형태로 작성하세요.
    7. 제공된 정보만으로 질문에 답하기 어렵다면, 정보의 한계를 인정하고 알려진 내용과 함께 추가 정보를 요청하세요.`;

    // 이전 답변이 있는 경우 추가
    if (previousAnswer) {
      promptTemplate += `
    
    이전에 생성한 답변:
    ${previousAnswer}`;
    }

    // 개선점이 있는 경우 추가
    if (improvementPoints && improvementPoints.length > 0) {
      promptTemplate += `
    
    다음 항목들에 대한 정보를 추가하여 이전 답변을 개선하세요:
    ${improvementPoints
      .map((point, index) => `${index + 1}. ${point}`)
      .join("\n")}`;
    }

    // 컨텍스트 및 질문 추가
    promptTemplate += `

    참고 자료: {context}
    질문: {input}`;

    const prompt = ChatPromptTemplate.fromTemplate(promptTemplate);

    // 문서 결합 체인 생성
    const documentChain = await createStuffDocumentsChain({
      llm,
      prompt,
    });

    // 검색 체인 생성
    const chain = await createRetrievalChain({
      retriever,
      combineDocsChain: documentChain,
    });

    // 사용자 질문에 대한 응답 생성
    console.time("응답 생성 시간");
    const response = await chain.invoke({ input: query });
    console.timeEnd("응답 생성 시간");

    console.timeEnd("총 처리 시간");
    return response.answer;
  } catch (error) {
    console.error("답변 생성 중 오류 발생:", error);
    throw error;
  }
}

module.exports = { generateAnswer };

if (require.main === module) {
  const docs = [
    new Document({
      pageContent:
        "gpt 4.5는 OpenAI에서 개발한 언어 모델로 'Orion'이라는 이름으로도 알려져 있습니다.",
    }),
    new Document({
      pageContent:
        "AI 벤치마크 테스트에서 GPT-4.5는 에이전트 코딩 평가(Agentic Coding Evaluation)에서 65%의 점수를 기록하며 67%를 기록한 앤트로픽의 클로드 소넷(Sonnet) 3.7에 밀렸다",
    }),
    new Document({
      pageContent:
        "아카데믹 테스트에서 GPT-4.5는 수학, 과학 분야에서 뛰어났지만, AI Reasoning 모델과 비교했을때는 상대적으로 낮은 성과를 기록했습니다. 특히, AIME, GPQA 등의 학술적 문제에서 DeepSeek의 R1 모델이나 OpenAI의 O3-mini 모델보다 성능이 하락됐습니다.",
    }),
  ];

  const query = "gpt 4.5의 성능을 평가해줘";

  (async () => {
    try {
      console.log("질문:", query);
      console.log("답변 생성 중...");

      const answer = await generateAnswer(query, docs);

      console.log("\n=== 생성된 답변 ===");
      console.log(answer);
    } catch (error) {
      console.error("테스트 실행 중 오류 발생:", error);
    }
  })();
}
