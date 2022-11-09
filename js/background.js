chrome.runtime.onInstalled.addListener(function ({reason}) {
    if (reason === 'install') {
        // default values
        chrome.storage.sync.set({
            preferred_thumbnail_file: 'hq1',
            video_title_format: 'capitalize_first_letter'
        })
    }
});

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
        });
    });
})

function setupThumbnailRedirectListeners(preferredThumbnailFile) {
    let options = ['hq1', 'hq2', 'hq3']

    if (preferredThumbnailFile === 'hqdefault') {
        chrome.declarativeNetRequest.updateEnabledRulesets({
            disableRulesetIds: options
        })
    } else {
        console.log(options.filter(x => x !== preferredThumbnailFile))
        console.log([preferredThumbnailFile])
        chrome.declarativeNetRequest.updateEnabledRulesets({
            disableRulesetIds: options.filter(x => x !== preferredThumbnailFile),
            enableRulesetIds: [preferredThumbnailFile]
        })
    }
}
