const summarizeEl = document.getElementById("summarize");

summarizeEl.addEventListener("click", () => {
  const resultEl = document.getElementById("result");

  resultEl.textContent = "Extracting text...";
  console.log("Clicked");

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    console.log(tab);
    chrome.tabs.sendMessage(
      tab.id,
      { type: "GET_ARTICLE_TEXT" },
      ({ text }) => {
        resultEl.textContent = text ?? "No article text found.";
        //   ? text.slice(0, 300) + "..."
        //   : "No article text found.";
      }
    );
  });
});
