const summarizeEl = document.getElementById("summarize");

summarizeEl.addEventListener("click", () => {
  const resultEl = document.getElementById("result");
  const summaryType = document.getElementById("summary-type").value;

  resultEl.innerHTML = `<div class="loader"></div>`;

  chrome.storage.sync.get(["geminiApiKey"], ({ geminiApiKey }) => {
    if (!geminiApiKey) {
      resultEl.textContent = "No Api Key set. Click the gear icon to add one.";
      return;
    }
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.tabs.sendMessage(
        tab.id,
        { type: "GET_ARTICLE_TEXT" },
        async ({ text }) => {
          if (!text) {
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
  const text = rawText.length > max ? rawText.slice(0, max) + "...." : rawText;
  const promptMap = {
    brief: `Summarize in 2-3 sentence:\n\n${text}`,
    detailed: `Give a detailed summary:\n\n${text}`,
    bullets: `Summarize in 5-7 bullet points (start each line with "- "):\n\n${text}`,
    others: text,
  };
  const prompt = promptMap[type] || promptMap.brief;
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
  navigator.clipboard.writeText(text).then(() => {
    const button = document.getElementById("copy-btn");
    const old = button.textContent;
    button.textContent = "Copied";
    setTimeout(() => (button.textContent = old), 1000);
  });
});
document.getElementById("paste-btn").addEventListener("click", async () => {
  await copyfromClipboard();
});

async function copyfromClipboard() {
  const button = document.getElementById("paste-btn");
  const old = button.textContent;
  try {
    await navigator.clipboard.readText().then((paste) => {
      button.textContent = "Pasted";
      document.getElementById("result").textContent = paste;
      setTimeout(() => (button.textContent = old), 1000);
    });
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
