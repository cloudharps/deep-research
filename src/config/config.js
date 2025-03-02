require("dotenv").config();

module.exports = {
  // 모델 설정
  models: {
    llm: {
      name: "google/gemini-2.0-flash-thinking-exp:free",
      temperature: {
        analyzer: 0.3, // 질문 분석
        generator: 0.3, // 답변 생성
        evaluator: 0.2, // 답변 평가
      },
    },
    // 임베딩 모델
    embedding: {
      name: "text-embedding-004",
    },
  },

  // API 설정
  api: {
    openrouter: {
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    },
    google: {
      apiKey: process.env.GOOGLE_API_KEY,
    },
  },
};
