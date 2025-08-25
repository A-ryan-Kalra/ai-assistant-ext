const summarizeEl = document.getElementById("summarize");
const detailEl = document.getElementById("details");

summarizeEl.addEventListener("click", () => {
  const resultEl = document.getElementById("result");
  const summaryType = document.getElementById("summary-type").value;

  const textContent = resultEl?.textContent;
  resultEl.innerHTML = `<div class="loader"></div>`;

  chrome.storage.sync.get(["geminiApiKey"], ({ geminiApiKey }) => {
    if (!geminiApiKey) {
      resultEl.textContent = "No Api Key set. Please add one";
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.tabs.sendMessage(
        tab.id,
        { type: summaryType === "others" ? "GET_CONTEXT" : "GET_ARTICLE_TEXT" },
        async (props) => {
          const text = props?.text?.trim() ?? textContent;

          if (!text && summaryType !== "others") {
            resultEl.textContent = "Couldn't extract text from this page.";
            return;
          }
          try {
            const summary = await getGeminiSummary(
              text,
              summaryType,
              geminiApiKey
            );

            resultEl.textContent = summary;
          } catch (error) {
            resultEl.textContent = "Gemini error occured: " + error?.message;
          }
        }
      );
    });
  });
});

async function getGeminiSummary(rawText, type, apiKey) {
  const max = 20000;
  // const text = rawText.length > max ? rawText.slice(0, max) + "...." : rawText;
  const text = rawText;
  const promptMap = {
    brief: `Summarize in 2-3 sentence:\n\n${text}`,
    detailed: `Give a detailed summary:\n\n${text}`,
    bullets: `Summarize in 5-7 bullet points (start each line with "- "):\n\n${text}`,
    others: `${detailEl?.value}\n ${text}`,
  };
  const prompt = promptMap[type] || promptMap.brief;
  console.log("prompt", prompt);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey,
      },
      method: "POST",
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );
  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error?.message) || "Request failed";
  }
  const data = await res.json();

  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No Summary";
}

document.getElementById("copy-btn").addEventListener("click", () => {
  const text = document.getElementById("result").textContent.trim();

  if (!text) return;
  navigator.clipboard
    .writeText(text)
    .then(() => {
      const button = document.getElementById("copy-btn");
      const old = button.textContent;
      button.textContent = "Copied";
      setTimeout(() => (button.textContent = old), 1000);
    })
    .catch((err) => console.error("error occured", err));
});
document.getElementById("paste-btn").addEventListener("click", async () => {
  await copyfromClipboard();
});

async function copyfromClipboard() {
  const button = document.getElementById("paste-btn");
  const old = button.textContent;
  try {
    const paste = await navigator.clipboard.readText();
    button.textContent = "Pasted";
    document.getElementById("result").textContent = paste;
    setTimeout(() => (button.textContent = old), 1000);
  } catch (error) {
    if (error.name === "NotAllowedError") {
      button.textContent = "Not Allowed";
      setTimeout(() => (button.textContent = old), 1000);
    } else {
      button.textContent = "Unexpected Error";
      setTimeout(() => (button.textContent = old), 1000);
    }
  }
}
document.getElementById("summary-type").addEventListener("change", (event) => {
  if (event.target.value === "others") {
    document.getElementById("details").style.display = "block";
  }
});
