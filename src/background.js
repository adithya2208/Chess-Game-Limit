chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.lichess) {
    console.debug("Inserting CSS");
    chrome.scripting.insertCSS({
      target: { tabId: sender.tab.id },
      files: ["src/limit.css"],
    });
  }
});
