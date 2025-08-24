function getArticle() {
  const article = document.querySelector("article");

  if (article) {
    return article.innerText;
  }

  const paragraphs = Array.from(document.querySelector("p"));
  return paragraphs.map((para) => para.innerText).join("\n");
}

chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
  if (req.type === "GET_ARTICLE_TEXT") {
    const text = getArticle();

    sendResponse({ text });
  }
});
