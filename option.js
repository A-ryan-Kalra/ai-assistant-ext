document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(["geminiApiKey"], ({ geminiApiKey }) => {
    if (geminiApiKey) {
      document.getElementById("api-key").value = geminiApiKey;
    }
  });
  document.getElementById("save-button").addEventListener("click", () => {
    const apiKey = document.getElementById("api-key-inp").value.trim();
    if (!apiKey) return;

    document.getElementById("success-message").style.display = "block";
  });
});
