const { analyzeQuestion } = require("./ai/analyzeQuestion");
const { searchUrls, extractContent } = require("./tools/webResearch");
const { generateAnswer } = require("./ai/generateAnswer");
const { evaluateAnswer } = require("./ai/evaluateAnswer");
const { Document } = require("langchain/document");

async function deepResearch(userQuestion, searchLimit = 5, maxAttempts = 3) {
  try {
    console.log("🔍 Deep Research 시작:");
    console.log(`질문: "${userQuestion}"\n`);

    // 1. 사용자 질문 의도 분석
    console.log("1️⃣ 질문 분석 중...");
    const analysis = await analyzeQuestion(userQuestion);
    let mainQuery = analysis["검색 쿼리"]["기본 쿼리"];
    const auxiliaryQueries = analysis["검색 쿼리"]["보조 쿼리"];

    console.log(`🔹 파악된 의도: ${analysis["의도 파악"]["질문의 의도"]}`);
    console.log(`🔹 검색 쿼리: ${mainQuery}`);

    // 반복 처리용 변수
    let attempt = 1;
    let adequateAnswer = false;
    let finalAnswer = "";
    let finalSources = [];
    let evaluationResult = null;
    let currentAnswer = "";
    let currentSources = [];

    // 수집된 콘텐츠 및 소스 저장
    let allContents = [];
    let allSources = [];

    // 최대 시도 횟수까지 반복
    while (attempt <= maxAttempts && !adequateAnswer) {
      console.log(`\n🔄 시도 ${attempt}/${maxAttempts}`);

      if (attempt > 1) {
        console.log(`🔹 개선된 검색 쿼리: ${mainQuery}`);
      }

      // 2. 검색 수행 및 자료 수집
      console.log("\n2️⃣ 웹 검색 및 자료 수집 중...");

      // 메인 쿼리 검색
      const searchResults = await searchUrls(mainQuery, searchLimit);
      console.log(`🔹 ${searchResults.length}개의 검색 결과를 찾았습니다.`);

      // 콘텐츠 추출
      const contents = [];

      for (let i = 0; i < searchResults.length; i++) {
        const result = searchResults[i];
        console.log(
          `🔹 (${i + 1}/${searchResults.length}) ${
            result.title
          } 콘텐츠 추출 중...`
        );

        try {
          const extractedContent = await extractContent(result.url);
          if (extractedContent) {
            contents.push({
              title: extractedContent.title || result.title,
              content: extractedContent.textContent,
              url: result.url,
              length: extractedContent.textContent.length,
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
                title: extractedContent.title || auxResults[0].title,
                content: extractedContent.textContent,
                url: auxResults[0].url,
                length: extractedContent.textContent.length,
              });
              break; // 하나의 콘텐츠만 추출하고 중단
            }
          }
        }
      }

      // 이번 시도에서 추출한 콘텐츠가 없는 경우
      if (contents.length === 0) {
        // 누적된 콘텐츠도 없다면 실패 처리
        if (allContents.length === 0) {
          console.log("\n❌ 검색 결과 없음: 답변을 생성할 수 없습니다.");
          return {
            analysis: analysis,
            answer:
              "검색 결과가 없어 답변을 생성할 수 없습니다. 다른 질문을 시도해주세요.",
            attempts: attempt,
          };
        }

        console.log(
          "\n⚠️ 이번 시도에서 새로운 콘텐츠를 추출하지 못했습니다. 기존 콘텐츠만 사용합니다."
        );
      } else {
        // 새로운 콘텐츠를 누적 배열에 추가 (URL 기준 중복 제거)
        const newContents = contents.filter(
          (content) =>
            !allContents.some((existing) => existing.url === content.url)
        );

        if (newContents.length > 0) {
          console.log(
            `🔹 ${newContents.length}개의 새로운 콘텐츠를 추가합니다.`
          );
          allContents.push(...newContents);
          allSources.push(
            ...newContents.map((c) => ({ title: c.title, url: c.url }))
          );
        } else {
          console.log("🔹 모든 콘텐츠가 이미 수집된 것과 중복됩니다.");
        }
      }

      console.log(`🔹 총 ${allContents.length}개의 누적 콘텐츠 사용`);

      // 3. 답변 생성
      console.log("\n3️⃣ 답변 생성 중...");

      // 누적된 모든 Document 객체로 변환
      const documents = allContents.map(
        (item) =>
          new Document({
            pageContent: item.content,
            metadata: {
              title: item.title,
              url: item.url,
              length: item.length,
            },
          })
      );

      // 이전 답변과 개선점 전달 (두 번째 시도부터)
      let previousAnswer = "";
      let improvementPoints = [];

      if (attempt > 1 && evaluationResult) {
        previousAnswer = currentAnswer;
        improvementPoints = evaluationResult.missingInfo || [];
        console.log(
          "\n🔄 이전 답변과 개선점을 활용하여 새로운 답변 생성 중..."
        );
      }

      // 누적된 모든 콘텐츠를 사용하여 답변 생성
      currentAnswer = await generateAnswer(
        userQuestion,
        documents,
        previousAnswer,
        improvementPoints
      );
      currentSources = allSources;

      // 4. 답변 평가
      console.log("\n4️⃣ 답변 평가 중...");
      evaluationResult = await evaluateAnswer(userQuestion, currentAnswer);

      console.log(`🔹 평가 점수: ${evaluationResult.score}/10`);
      console.log(`🔹 평가: ${evaluationResult.evaluation}`);

      if (
        evaluationResult.missingInfo &&
        evaluationResult.missingInfo.length > 0
      ) {
        console.log("🔹 부족한 정보:");
        evaluationResult.missingInfo.forEach((info, idx) => {
          console.log(`  ${idx + 1}. ${info}`);
        });
      }

      // 답변이 적절한지 확인
      if (evaluationResult.isAdequate) {
        console.log("\n✅ 적절한 답변을 생성했습니다!");
        adequateAnswer = true;
        finalAnswer = currentAnswer;
        finalSources = currentSources;
      } else {
        console.log("\n⚠️ 답변이 충분하지 않습니다. 추가 검색을 시도합니다.");
        // console.log(`🔍 개선된 쿼리: "${evaluationResult.improvedQuery}"`);
        mainQuery = evaluationResult.improvedQuery;

        // 이번 시도의 결과를 저장 (최대 시도 횟수 도달 시 사용)
        if (attempt === maxAttempts || !evaluationResult.improvedQuery) {
          finalAnswer = currentAnswer;
          finalSources = currentSources;
        }

        attempt++;
      }
    }

    if (!adequateAnswer) {
      console.log(
        "\n⚠️ 최대 시도 횟수에 도달했습니다. 가장 좋은 답변을 반환합니다."
      );
    }

    console.log("\n✅ 답변 생성 완료!");

    return {
      analysis: analysis,
      sources: finalSources,
      answer: finalAnswer,
      evaluation: evaluationResult,
      attempts: attempt,
      totalSourceCount: allContents.length,
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
      const result = await deepResearch(userQuestion, 5, 3);

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
      console.log("------------------------------------------------");
      console.log(`시도 횟수: ${result.attempts}`);
      console.log(`최종 평가 점수: ${result.evaluation.score}/10`);
      console.log("================================================");
    } catch (error) {
      console.error("프로그램 실행 중 오류 발생:", error);
    }
  })();
}
