document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("login-btn");
    const deckList = document.getElementById("deck-list");

    chrome.cookies.get({ url: "https://swudb.com", name: ".AspNetCore.Identity.Application" }, (cookie) => {
        if (!cookie) {
            loginBtn.style.display = "block";
            deckList.innerHTML = "";
        } else {
            loginBtn.style.display = "none";
            loadDecks();
        }
    });

    loginBtn.onclick = () => {
        chrome.tabs.create({ url: "https://swudb.com/account/login" });
    };
});


function loadDecks() {
    chrome.runtime.sendMessage("fetchDecks", (decks) => {
        const deckList = document.getElementById("deck-list");
        deckList.innerHTML = "";

        if (decks.length === 0) {
            deckList.innerHTML = "<p>No decks found or not logged in.</p>";
            return;
        }

        decks.forEach(deck => {
            const button = document.createElement("button");
            button.className = "deck";

            // Create container for images and title
            const container = document.createElement("div");
            container.style.display = "flex";
            container.style.alignItems = "center";
            container.style.gap = "10px";

            // Add leader image if exists
            if (deck.leaderImage) {
                const leaderImg = document.createElement("img");
                leaderImg.src = deck.leaderImage;
                leaderImg.style.width = "50px";
                leaderImg.style.height = "auto";
                leaderImg.alt = "Leader";
                container.appendChild(leaderImg);
            }

            // Add base image if exists
            if (deck.baseImage) {
                const baseImg = document.createElement("img");
                baseImg.src = deck.baseImage;
                baseImg.style.width = "50px";
                baseImg.style.height = "auto";
                baseImg.alt = "Base";
                container.appendChild(baseImg);
            }

            // Add deck title
            const title = document.createElement("span");
            title.textContent = deck.baseTitle;
            title.style.flex = "1";
            container.appendChild(title);

            // Add click handler to copy deck URL
            button.onclick = () => {
                const fullUrl = `https://swudb.com${deck.href}`;
                navigator.clipboard.writeText(fullUrl).then(() => {
                    alert("Deck link copied to clipboard!");
                });
            };

            button.appendChild(container);
            deckList.appendChild(button);
        });
    });
}