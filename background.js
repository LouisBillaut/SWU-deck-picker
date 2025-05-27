chrome.runtime.onInstalled.addListener(() => {
    console.log("[SWUDB] Extension installed");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message === "fetchDecks") {
        openDecksTab(sendResponse);
        return true; // keep sendResponse async
    }
});

function openDecksTab(callback) {
    chrome.tabs.create({ url: "https://swudb.com/decks/", active: false }, function(tab) {
        const tabId = tab.id;

        // Wait 2 seconds for content to load
        setTimeout(() => {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: scrapeDecksFromPage
            }, (results) => {
                chrome.tabs.remove(tabId); // close the tab
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                    callback([]);
                } else {
                    callback(results[0].result || []);
                }
            });
        }, 2000);
    });
}

function scrapeDecksFromPage() {
    const anchors = Array.from(document.querySelectorAll('a[href^="/deck/"]'));
    const deckMap = new Map();

    anchors.forEach(anchor => {
        const deckId = anchor.getAttribute('href');

        // If it's link with title (class="text-xl font-semibold")
        if (anchor.classList.contains('text-xl')) {
            if (!deckMap.has(deckId)) {
                deckMap.set(deckId, {
                    baseTitle: anchor.textContent.trim(),
                    leaderImage: null,
                    baseImage: null,
                    href: deckId
                });
            } else {
                deckMap.get(deckId).baseTitle = anchor.textContent.trim();
            }
        }

        // If it's an image
        const img = anchor.querySelector('img');
        if (img) {
            const alt = img.getAttribute('alt');
            if (alt) {
                if (alt.includes('leader')) {
                    if (!deckMap.has(deckId)) {
                        deckMap.set(deckId, {
                            baseTitle: '',
                            leaderImage: img.src,
                            baseImage: null,
                            href: deckId
                        });
                    } else {
                        deckMap.get(deckId).leaderImage = img.src;
                    }
                } else if (alt.includes('base')) {
                    if (!deckMap.has(deckId)) {
                        deckMap.set(deckId, {
                            baseTitle: '',
                            leaderImage: null,
                            baseImage: img.src,
                            href: deckId
                        });
                    } else {
                        deckMap.get(deckId).baseImage = img.src;
                    }
                }
            }
        }
    });

    return Array.from(deckMap.values());
}