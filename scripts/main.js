var blockUi = () => {
  console.debug("Removing UI elements!");
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

var checkIfLimitReached = (username, limit) => {
  getGamesCount(username).then((currentCount) => {
    get("lastFetchCount").then((lastFetchCount) => {
      if (currentCount - lastFetchCount >= limit) {
        console.debug("Limit reached!");
        blockUi();
      }
    });
  });
};

get("username").then((username) => {
  get("limit").then((limit) => {
    if (username != undefined && limit != undefined) {
      get("lastFetchDate").then((lastFetchDate) => {
        var currentDate = new Date().getDate();
        if (lastFetchDate == undefined) {
          console.debug("First run");
          lastFetchDate = currentDate;
          set("lastFetchDate", lastFetchDate);
          getGamesCount(username).then((count) => set("lastFetchCount", count));
        }
        if (currentDate != lastFetchDate) {
          console.debug("A day has passed");
          set("lastFetchDate", currentDate);
          getGamesCount(username).then((count) => set("lastFetchCount", count));
        }

        checkIfLimitReached(username, limit);
      });
      waitForElm(".follow-up").then((elem) => {
        console.debug("Game terminated");
        checkIfLimitReached(username, limit);
      });
    }
  });
});

chrome.storage.local
  .get(["lastFetchCount", "username", "limit"])
  .then((val) => {
    getGamesCount(val["username"]).then((count) => {
      var temp = document.createElement("div");
      var content = document.createTextNode(
        `LiChess Game Limit: ${count - val["lastFetchCount"]}/${val["limit"]}`
      );
      temp.appendChild(content);
      document.getElementsByClassName("site-buttons")[0].append(temp);
    });
  });
