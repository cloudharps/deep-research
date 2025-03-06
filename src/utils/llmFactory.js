const config = require("../config/config");
const { ChatOpenAI } = require("@langchain/openai");
const {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} = require("@langchain/google-genai");

// llm 모델 인스턴스
function createLLM(purpose, provider = config.global.defaultProvider) {
  const temperature = config.models.temperature[purpose];

  if (provider === "gemini") {
    return new ChatGoogleGenerativeAI({
      modelName: config.models.gemini.modelName,
      temperature: temperature,
      apiKey: config.models.gemini.apiKey,
    });
  } else {
    // OpenRouter
    return new ChatOpenAI({
      model: config.models.openrouter.modelName,
      temperature: temperature,
      apiKey: config.models.openrouter.apiKey,
      configuration: {
        baseURL: config.models.openrouter.baseURL,
      },
    });
  }
}

// 임베딩 모델 인스턴스 (현재는 Google 모델만 지원)
function createEmbeddingModel() {
  return new GoogleGenerativeAIEmbeddings({
    modelName: config.models.embedding.name,
    apiKey: config.models.embedding.apiKey,
  });
}

module.exports = {
  createLLM,
  createEmbeddingModel,
};
