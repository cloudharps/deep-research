const { analyzeQuestion } = require("./analyzeQuestion");
const { searchUrls, extractContent } = require("./webResearch");
const { generateAnswer } = require("./generateAnswer");
const { Document } = require("langchain/document");

async function deepResearch(userQuestion, searchLimit = 5, contentLimit = 3) {
  try {
    console.log("🔍 심층 리서치 시작:");
    console.log(`질문: "${userQuestion}"\n`);

    // 1. 사용자 질문 의도 분석
    console.log("1️⃣ 질문 분석 중...");
    const analysis = await analyzeQuestion(userQuestion);
    const mainQuery = analysis["검색 쿼리"]["기본 쿼리"];
    const auxiliaryQueries = analysis["검색 쿼리"]["보조 쿼리"];
    
    console.log(`🔹 파악된 의도: ${analysis["의도 파악"]["질문의 의도"]}`);
    console.log(`🔹 검색 쿼리: ${mainQuery}`);

    // 2. 검색 수행 및 자료 수집
    console.log("\n2️⃣ 웹 검색 및 자료 수집 중...");
    
    // 메인 쿼리 검색
    const searchResults = await searchUrls(mainQuery, searchLimit);
    console.log(`🔹 ${searchResults.length}개의 검색 결과를 찾았습니다.`);
    
    // 콘텐츠 추출
    const contents = [];
    
    for (let i = 0; i < Math.min(searchResults.length, contentLimit); i++) {
      const result = searchResults[i];
      console.log(`🔹 (${i + 1}/${contentLimit}) ${result.title} 콘텐츠 추출 중...`);
      
      try {
        const extractedContent = await extractContent(result.url);
        if (extractedContent) {
          contents.push({
            title: extractedContent.title,
            content: extractedContent.textContent,
            url: result.url,
            length: extractedContent.length
          });
        }
      } catch (error) {
        console.error(`  ❌ 콘텐츠 추출 실패: ${error.message}`);
      }
    }
    
    console.log(`🔹 총 ${contents.length}개의 콘텐츠 추출 완료`);
    
    // 추출된 콘텐츠가 없는 경우 보조 쿼리 시도
    if (contents.length === 0 && auxiliaryQueries.length > 0) {
      console.log("🔹 메인 쿼리로 콘텐츠 추출 실패, 보조 쿼리 시도 중...");
      
      for (const auxQuery of auxiliaryQueries) {
        console.log(`🔹 보조 쿼리 검색: "${auxQuery}"`);
        const auxResults = await searchUrls(auxQuery, searchLimit);
        
        if (auxResults.length > 0) {
          const extractedContent = await extractContent(auxResults[0].url);
          if (extractedContent) {
            contents.push({
              title: extractedContent.title,
              content: extractedContent.textContent,
              url: auxResults[0].url,
              length: extractedContent.length
            });
            break; // 하나의 콘텐츠만 추출하고 중단
          }
        }
      }
    }
    
    // 3. 답변 생성
    if (contents.length === 0) {
      console.log("\n❌ 검색 결과 없음: 답변을 생성할 수 없습니다.");
      return {
        analysis: analysis,
        answer: "검색 결과가 없어 답변을 생성할 수 없습니다. 다른 질문을 시도해주세요."
      };
    }
    
    console.log("\n3️⃣ 답변 생성 중...");
    
    // Document 객체로 변환
    const documents = contents.map(item => 
      new Document({
        pageContent: item.content,
        metadata: {
          title: item.title,
          url: item.url,
          length: item.length
        }
      })
    );
    
    // 답변 생성
    const answer = await generateAnswer(userQuestion, documents);
    
    console.log("\n✅ 답변 생성 완료!");
    
    return {
      analysis: analysis,
      sources: contents.map(c => ({ title: c.title, url: c.url })),
      answer: answer
    };
    
  } catch (error) {
    console.error("Deep Research 중 오류 발생:", error);
    throw error;
  }
}

module.exports = { deepResearch };

if (require.main === module) {
  const userQuestion = process.argv[2] || "gpt 4.5의 성능을 평가해줘";
  
  (async () => {
    try {
      const result = await deepResearch(userQuestion);
      
      console.log("\n================================================");
      console.log("질문:", userQuestion);
      console.log("------------------------------------------------");
      console.log("답변:");
      console.log(result.answer);
      console.log("------------------------------------------------");
      console.log("참고 자료:");
      result.sources.forEach((source, index) => {
        console.log(`${index + 1}. ${source.title}`);
        console.log(`   ${source.url}`);
      });
      console.log("================================================");
    } catch (error) {
      console.error("프로그램 실행 중 오류 발생:", error);
    }
  })();
}