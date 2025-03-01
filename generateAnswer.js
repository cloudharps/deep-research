require("dotenv").config();
const { ChatOpenAI } = require("@langchain/openai");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { Document } = require("langchain/document");
const { createRetrievalChain } = require("langchain/chains/retrieval");
const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");

const llm = new ChatOpenAI({
  model: "google/gemini-2.0-flash-thinking-exp:free", // 모델 설정
  temperature: 0.3,
  apiKey: process.env.OPENROUTER_API_KEY,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
});

async function generateAnswer(query, documents) {
  try {
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
      model: "text-embedding-004", // 임베딩 모델 설정
    });

    // 문서 분할기 생성 
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000, // 각 청크의 최대 크기 
      chunkOverlap: 200, // 청크 간 겹치는 부분 (문맥 유지 목적)
      separators: ["\n\n", "\n", ".", "!", "?", ",", " ", ""], // 분할 우선순위
    });

    const splitDocuments = await textSplitter.splitDocuments(documents);
    console.log(`원본 문서 ${documents.length}개가 ${splitDocuments.length}개의 청크로 분할되었습니다.`);

    // 분할된 문서들을 임베딩하여 벡터 스토어에 저장
    const vectorStore = await MemoryVectorStore.fromDocuments(
      splitDocuments, // 분할된 문서 사용
      embeddings
    );

    // 벡터 스토어를 retriever로 변환
    const retriever = vectorStore.asRetriever({
      k: 5, // 상위 5개의 관련 청크 검색
    });

    // 프롬프트 템플릿
    const prompt = ChatPromptTemplate.fromTemplate(`
    다음 컨텍스트를 기반으로 질문에 답변해주세요.

    컨텍스트: {context}
    질문: {input}
    `);

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
    const response = await chain.invoke({ input: query });

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
