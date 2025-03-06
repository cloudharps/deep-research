require("dotenv").config();

module.exports = {
  // 전역 설정
  global: {
    // 기본 LLM 제공자: "openrouter" 또는 "gemini"
    defaultProvider: "openrouter",
    // defaultProvider: "gemini",
  },

  // 모델 설정
  models: {
    // 제공자별 LLM 모델 설정
    openrouter: {
      modelName: "google/gemini-2.0-flash-thinking-exp:free",
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    },
    gemini: {
      modelName: "gemini-1.5-pro", // Gemini API용 모델명
      apiKey: process.env.GEMINI_API_KEY,
    },
    // 공통 설정
    temperature: {
      analyzer: 0.3, // 질문 분석
      generator: 0.3, // 답변 생성
      evaluator: 0.2, // 답변 평가
    },
    // 임베딩 모델 설정 
    embedding: {
      name: "text-embedding-004",
      apiKey: process.env.GEMINI_API_KEY,
    },
  },
};
