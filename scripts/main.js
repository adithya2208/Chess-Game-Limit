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

var checkIfLimitReached = async (username, limit) => {
  let currentCount = await getGamesCount(username);
  let lastFetchCount = await get("lastFetchCount");
  if (currentCount - lastFetchCount >= limit) {
    console.debug("Limit reached!");
    blockUi();
  }
};

var main = async () => {
  let username = await get("username");
  let limit = await get("limit");
  if (username != undefined && limit != undefined) {
    let lastFetchDate = await get("lastFetchDate");
    var currentDate = new Date().getDate();
    if (lastFetchDate == undefined) {
      console.debug("First run");
      lastFetchDate = currentDate;
      set("lastFetchDate", lastFetchDate);
      let count = await getGamesCount(username);
      set("lastFetchCount", count);
    }
    if (currentDate != lastFetchDate) {
      console.debug("A day has passed");
      set("lastFetchDate", currentDate);
      let count = await getGamesCount(username);
      set("lastFetchCount", count);
    }
    await checkIfLimitReached(username, limit);

    await waitForElm(".follow-up");
    console.debug("Game terminated");
    await checkIfLimitReached(username, limit);
  }
};

var displayHeader = async () => {
  let { lastFetchCount, username, limit } = await chrome.storage.local.get([
    "lastFetchCount",
    "username",
    "limit",
  ]);
  let count = await getGamesCount(username);
  var temp = document.createElement("div");
  var content = document.createTextNode(
    `LiChess Game Limit: ${count - lastFetchCount}/${limit}`
  );
  temp.appendChild(content);
  document.getElementsByClassName("site-buttons")[0].append(temp);
};

main();
displayHeader();
