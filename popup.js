document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("login-btn");
    const reloadBtn = document.getElementById("reload-btn");
    const deckList = document.getElementById("deck-list");

    chrome.cookies.get({ url: "https://swudb.com", name: ".AspNetCore.Identity.Application" }, (cookie) => {
        if (!cookie) {
            loginBtn.style.display = "block";
            reloadBtn.style.display = "none";
            deckList.innerHTML = "";
        } else {
            loginBtn.style.display = "none";
            chrome.storage.local.get(['cachedDecks'], function(result) {
                if (result.cachedDecks) {
                    reloadBtn.style.display = "block";
                }
            });
            loadDecks();
        }
    });

    loginBtn.onclick = () => {
        chrome.tabs.create({ url: "https://swudb.com/account/login" });
    };

    reloadBtn.onclick = () => {
        performReload();
    };
});

function performReload() {
    const reloadBtn = document.getElementById("reload-btn");
    reloadBtn.disabled = true;
    reloadBtn.textContent = "Updating...";
    chrome.runtime.sendMessage("fetchDecks", response => {
        if (!response.fromCache) {
            reloadBtn.disabled = false;
            reloadBtn.textContent = "Reload decks";
        }
    });
}

function loadDecks() {
    const deckList = document.getElementById("deck-list");
    const reloadBtn = document.getElementById("reload-btn");

    function displayDecks(decks, isFromCache) {
        // Clear existing decks
        deckList.innerHTML = "";

        if (decks.length === 0) {
            deckList.innerHTML = "<p>No decks found or not logged in.</p>";
            return;
        }

        decks.forEach(deck => {
            const button = document.createElement("button");
            button.className = "deck";

            const container = document.createElement("div");
            container.style.display = "flex";
            container.style.alignItems = "center";
            container.style.gap = "10px";

            if (deck.leaderImage) {
                const leaderImg = document.createElement("img");
                leaderImg.src = deck.leaderImage;
                leaderImg.style.width = "50px";
                leaderImg.style.height = "auto";
                leaderImg.alt = "Leader";
                container.appendChild(leaderImg);
            }

            if (deck.baseImage) {
                const baseImg = document.createElement("img");
                baseImg.src = deck.baseImage;
                baseImg.style.width = "50px";
                baseImg.style.height = "auto";
                baseImg.alt = "Base";
                container.appendChild(baseImg);
            }

            const title = document.createElement("span");
            title.textContent = deck.baseTitle;
            title.style.flex = "1";
            container.appendChild(title);

            button.onclick = () => {
                const fullUrl = `https://swudb.com${deck.href}`;
                navigator.clipboard.writeText(fullUrl).then(() => {
                    button.classList.add('copying');
                    setTimeout(() => {
                        button.classList.remove('copying');
                    }, 1000);
                });
            };

            button.appendChild(container);
            deckList.appendChild(button);
        });

        if (isFromCache) {
            reloadBtn.style.display = "block";
        }
    }

    // Listen for updates from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === "decksUpdated") {
            displayDecks(message.decks, false);
            reloadBtn.disabled = false;
            reloadBtn.textContent = "Reload decks";
        }
    });

    // Initial load from cache only
    chrome.storage.local.get(['cachedDecks'], function(result) {
        if (result.cachedDecks) {
            displayDecks(result.cachedDecks, true);
        } else {
            // If no decks in cache, automatic reload
            reloadBtn.style.display = "block";
            performReload();
        }
    });
}