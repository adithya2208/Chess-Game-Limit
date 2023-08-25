var blockUi = () => {
  var classesToCull = [
    "lobby__app lobby__app-pools",
    "lobby__spotlights",
    "lobby__table",
    "lobby__tournaments-simuls",
    "follow-up",
  ];
  var blacklistedURLs = ["https://lichess.org/tournament"];

  for (let i in classesToCull) {
    let node = document.getElementsByClassName(classesToCull[i])[0];
    if (node != undefined) {
      if (classesToCull[i] == "follow-up") {
        if (node.childElementCount == 3) {
          node.firstChild.remove();
          node.firstChild.remove();
        }
      } else node.remove();
    }
  }

  try {
    document.getElementById("topnav").firstElementChild.remove();
  } catch (error) {}

  if (blacklistedURLs.includes(window.location.href)) {
    window.location = "https://lichess.org/";
  }
};

var getGamesCount = async (username) => {
  console.debug(`Fetching for ${username}`);
  var toReturn = await fetch(`https://lichess.org/api/user/${username}`, {
    method: "GET",
  });
  toReturn = await toReturn.json();
  console.debug(`Current games count is ${toReturn.count.all}`);
  return toReturn.count.all;
};

var set = (key, val) => {
  console.debug(`Setting ${key} to ${val}`);
  return chrome.storage.local.set({ [key]: val });
};

var get = async (key) => {
  var toReturn = await chrome.storage.local.get(key);
  console.debug(`Getting ${key} with a value of ${toReturn[key]}`);
  return toReturn[key];
};

var waitForElm = (selector) => {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
};

get("username").then((username) => {
  get("limit").then((limit) => {
    if (username != undefined && limit != undefined) {
      get("lastFetchTime").then((lastFetchTime) => {
        var currentTime = new Date();
        if (lastFetchTime == undefined) {
          console.debug("First run");
          lastFetchTime = currentTime.toString();
          set("lastFetchTime", lastFetchTime);
          getGamesCount(username).then((count) => set("lastFetchCount", count));
        }
        lastFetchTime = new Date(Date.parse(lastFetchTime));
        if (currentTime - lastFetchTime > 86400000) {
          console.debug("A day has passed");
          set("lastFetchTime", currentTime.toString());
          getGamesCount(username).then((count) => set("lastFetchCount", count));
        }
        getGamesCount(username).then((currentCount) => {
          get("lastFetchCount").then((lastFetchCount) => {
            if (currentCount - lastFetchCount >= limit) {
              console.debug("Limit reached!");
              blockUi();
            }
          });
        });
      });
    }
  });
});

waitForElm(".follow-up").then((elem) => {
  console.debug("Game terminated");
  blockUi();
});
