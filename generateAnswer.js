require("dotenv").config();
const { ChatOpenAI } = require("@langchain/openai");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { Document } = require("langchain/document");
const { createRetrievalChain } = require("langchain/chains/retrieval");
const {
  createStuffDocumentsChain,
} = require("langchain/chains/combine_documents");
const { ChatPromptTemplate } = require("@langchain/core/prompts");

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

    // 문서들을 임베딩하여 벡터 스토어에 저장
    const vectorStore = await MemoryVectorStore.fromDocuments(
      documents,
      embeddings
    );

    // 벡터 스토어를 retriever로 변환
    const retriever = vectorStore.asRetriever();

    // 프롬프트 템플릿
    const prompt = ChatPromptTemplate.fromTemplate(`
    다음 컨텍스트를 기반으로 질문에 답변해주세요.

    컨텍스트: {context}
    
    질문: {input}
    
    답변:
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
        "LangChain은 LLM 기반 애플리케이션 개발을 위한 라이브러리입니다.",
    }),
    new Document({
      pageContent:
        "RAG는 Retrieval Augmented Generation의 약자로, 검색 결과를 활용하여 답변을 생성하는 방식입니다.",
    }),
    new Document({
      pageContent:
        "JavaScript 환경에서도 LangChain을 통해 LLM을 쉽게 활용할 수 있습니다.",
    }),
  ];

  const query = "RAG 방식이란 무엇이며, LangChain과의 관계는 무엇인가요?";

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
