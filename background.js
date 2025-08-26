// Redirects the user to /options.html to set the Gemini API-key
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(["geminiApiKey"], (result) => {
    chrome.tabs.create({ url: "options.html" });
  });
});
