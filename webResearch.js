const DDG = require("duck-duck-scrape");
const axios = require("axios");
const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");

async function searchUrls(query, limit = 10) {
  try {
    const searchResults = await DDG.search(query, {
      safeSearch: DDG.SafeSearchType.STRICT,
    });

    // 검색 결과 추출
    const results = searchResults.results
      .filter((result) => result.url)
      .slice(0, limit)
      .map((result) => ({
        title: result.title,
        url: result.url,
      }));

    return results;
  } catch (error) {
    console.error("검색 중 오류 발생:", error.message);
  }
}

async function extractContent(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    // HTML 파싱
    const dom = new JSDOM(response.data, { url });
    const document = dom.window.document;

    // Readability로 주요 콘텐츠 추출
    const reader = new Readability(document);
    const article = reader.parse();

    if (!article) {
      throw new Error("콘텐츠를 추출할 수 없습니다");
    }

    return {
      title: article.title,
      textContent: article.textContent,
      length: article.textContent.length,
    };
  } catch (error) {
    console.error(`${url}에서 콘텐츠 추출 중 오류 발생:`, error.message);
  }
}

module.exports = {
  searchUrls,
  extractContent,
};

if (require.main === module) {
  (async () => {
    try {
      const searchQuery = "gpt 4.5 성능 평가"; // 검색어

      // 검색 테스트
      console.log(`🔍 검색어: "${searchQuery}"`);
      console.log("검색 결과를 가져오는 중...");
      const searchResults = await searchUrls(searchQuery, 5); // 최대 5개의 검색 결과만 가져옴

      console.log(`\n총 ${searchResults.length}개의 검색 결과를 찾았습니다.`);
      searchResults.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.title}`);
        console.log(`   URL: ${result.url}`);
      });

      // 콘텐츠 추출 테스트
      const testUrl = searchResults[0].url;
      console.log(`\n\n🔗 URL: ${testUrl}`);
      console.log("콘텐츠를 추출하는 중...");
      const content = await extractContent(testUrl);
      console.log(content.title);

      // 콘텐츠 미리보기 (처음 100자만)
      const previewText = content.textContent.substring(0, 100);
      console.log(`${previewText}...`);
    } catch (error) {
      console.error("\n테스트 중 오류가 발생했습니다:", error);
    }
  })();
}
