chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(["geminiApiKey"], (result) => {
    chrome.tabs.create({ url: "options.html" });
  });
});
