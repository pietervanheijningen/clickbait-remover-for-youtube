chrome.runtime.onInstalled.addListener(function ({reason}) {
    if (reason === 'install') {
        // default values
        chrome.storage.sync.set({
            preferred_thumbnail_file: 'hq1',
            video_title_format: 'capitalize_first_letter'
        })
    }
});

chrome.storage.sync.get(['preferred_thumbnail_file'], function (storage) {

    if (storage.preferred_thumbnail_file === undefined) { // shitty fix
        storage.preferred_thumbnail_file = "hq1"
    }

    setupThumbnailRedirectListeners(storage.preferred_thumbnail_file);

    chrome.tabs.query({url: '*://www.youtube.com/*'}, function (tabs) {
        tabs.forEach(function (tab) {
            chrome.scripting.executeScript({
                    target: {
                        tabId: tab.id
                    },
                    files: ['js/youtube.js']
                }
                ,function () {
                    chrome.tabs.sendMessage(tab.id, {
                        'preferred_thumbnail_file': {
                            newValue: storage.preferred_thumbnail_file
                        }
                    });
                }
            )
        })

        chrome.storage.onChanged.addListener(function (changes) {
            if (changes.preferred_thumbnail_file !== undefined) {
                setupThumbnailRedirectListeners(changes.preferred_thumbnail_file.newValue);
            }

            chrome.tabs.query({url: '*://www.youtube.com/*'}, function (tabs) {
                tabs.forEach(function (tab) {
                    chrome.tabs.sendMessage(tab.id, changes);
                })
            });
        });
    });
});

function setupThumbnailRedirectListeners(preferredThumbnailFile) {
    if (preferredThumbnailFile === 'hqdefault') {
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [1]
        })
    } else {
        chrome.declarativeNetRequest.updateDynamicRules({
            addRules: [
                {
                    "id": 1,
                    "priority": 1,
                    "action": {
                        "type": "redirect",
                        "redirect": {
                            "regexSubstitution": `https://i.ytimg.com/\\1/\\2/${preferredThumbnailFile}.jpg\\5`
                        }
                    },
                    "condition": {
                        "regexFilter": "^https://i.ytimg.com/(vi|vi_webp)/(.*)/(default|hqdefault|mqdefault|sddefault|hq720)(_custom_[0-9]+)?.jpg(.*)",
                        "resourceTypes": [
                            "image"
                        ]
                    }
                }
            ],
            removeRuleIds: [1]
        })
    }
}
