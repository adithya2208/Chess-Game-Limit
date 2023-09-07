saveIt = (e) => {
  chrome.storage.local.set({ [e.target.id]: e.target.value });
};
document.addEventListener(
  "DOMContentLoaded",
  function () {
    chrome.storage.local.get(["username", "limit"]).then((val) => {
      if (val["username"] != undefined)
        document.querySelector("#username").value = val["username"];
      if (val["limit"] != undefined)
        document.querySelector("#limit").value = val["limit"];
    });
    document
      .querySelector("#username")
      .addEventListener("input", saveIt, false);
    document.querySelector("#limit").addEventListener("input", saveIt, false);
  },
  false
);
