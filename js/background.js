chrome.runtime.onInstalled.addListener(function ({reason}) {
    if (reason === 'install') {
        // default values
        chrome.storage.sync.set({
            preferred_thumbnail_file: '1',
            preferred_thumbnail_resolution: 'hq',
            video_title_format: 'capitalize_first_letter'
        })
    }
});

chrome.storage.sync.get(['preferred_thumbnail_file', 'preferred_thumbnail_resolution'], function (storage) {

    if (storage.preferred_thumbnail_file === undefined) { // shitty fix
        storage.preferred_thumbnail_file = "1"
    }
    if (storage.preferred_thumbnail_resolution === undefined) { // shitty fix
        storage.preferred_thumbnail_resolution = "hq"
    }

    setupThumbnailRedirectListeners(storage.preferred_thumbnail_file, storage.preferred_thumbnail_resolution);

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
                            newValue: `${storage.preferred_thumbnail_resolution}${storage.preferred_thumbnail_file}`
                        }
                    });
                }
            )
        })

        chrome.storage.onChanged.addListener(function (changes) {
            chrome.storage.sync.get(['preferred_thumbnail_file', 'preferred_thumbnail_resolution'], function (storage) {
                const preferred_thumbnail_file = changes.preferred_thumbnail_file?.newValue ?? storage.preferred_thumbnail_file ?? "1";
                const preferred_thumbnail_resolution = changes.preferred_thumbnail_resolution?.newValue ?? storage.preferred_thumbnail_resolution ?? "1";
                setupThumbnailRedirectListeners(preferred_thumbnail_file, preferred_thumbnail_resolution);
                chrome.tabs.query({url: '*://www.youtube.com/*'}, function (tabs) {
                    tabs.forEach(function (tab) {
                        chrome.tabs.sendMessage(tab.id, {
                            'preferred_thumbnail_file': {
                                newValue: `${preferred_thumbnail_resolution}${preferred_thumbnail_file}`
                            }
                        });
                    })
                });
            });

        });
    });
});

function setupThumbnailRedirectListeners(preferredThumbnailFile, preferredThumbnailResolution) {
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
                            "regexSubstitution": `https://i.ytimg.com/\\1/\\2/${preferredThumbnailResolution}${preferredThumbnailFile}.jpg\\5`
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
