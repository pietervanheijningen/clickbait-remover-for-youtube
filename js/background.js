chrome.runtime.onInstalled.addListener(function ({reason}) {
    if (reason === 'install') {
        // default values
        chrome.storage.sync.set({
            preferred_thumbnail_file: 'hq1',
            video_title_format: 'capitalize_first_letter'
        })
    }
});

self.addEventListener('activate', function () {

    chrome.storage.sync.get(['preferred_thumbnail_file'], function (storage) {

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
})

function setupThumbnailRedirectListeners(preferredThumbnailFile) {
    if (preferredThumbnailFile === 'hqdefault') {
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [1,2,3]
        })
    } else {
        const ruleId = parseInt(preferredThumbnailFile.match(/\d+/)[0])

        chrome.declarativeNetRequest.updateDynamicRules({
            addRules: [
                {
                    "id": ruleId,
                    "priority": 1,
                    "action": {
                        "type": "redirect",
                        "redirect": {
                            "regexSubstitution": `https://i.ytimg.com/\\1/\\2/${preferredThumbnailFile}.jpg\\4`
                        }
                    },
                    "condition": {
                        "regexFilter": "^https://i.ytimg.com/(vi|vi_webp)/(.*)/(default|hqdefault|mqdefault|sddefault|hq720).jpg(.*)",
                        "resourceTypes": [
                            "image"
                        ]
                    }
                }
            ],
            removeRuleIds: [1,2,3]
        })
    }
}
