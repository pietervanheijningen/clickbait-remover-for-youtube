chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === 'install') {
        // default values
        chrome.storage.sync.set({
            preferred_thumbnail_file: 'hq1',
            video_title_format: 'capitalize_first_letter'
        })
    }
});

// Global variable to store current preferred thumbnail file
let currentPreferredThumbnail = 'hq1';

chrome.storage.sync.get(['preferred_thumbnail_file'], function (storage) {

    if (storage.preferred_thumbnail_file === undefined) { // shitty fix
        storage.preferred_thumbnail_file = "hq1"
    }

    setupThumbnailRedirectListeners(storage.preferred_thumbnail_file);

    chrome.tabs.query({url: '*://www.youtube.com/*'}, function (tabs) {
        if (chrome.runtime.lastError) {
            console.log('Tabs query error:', chrome.runtime.lastError);
            return;
        }
        
        tabs.forEach(function (tab) {
            // For Firefox, use chrome.tabs.executeScript instead of chrome.scripting.executeScript
            chrome.tabs.executeScript(tab.id, {
                file: 'js/youtube.js'
            }, function() {
                if (chrome.runtime.lastError) {
                    console.log('Script injection error:', chrome.runtime.lastError);
                    return;
                }
                chrome.tabs.sendMessage(tab.id, {
                    'preferred_thumbnail_file': {
                        newValue: storage.preferred_thumbnail_file
                    }
                }, function(response) {
                    if (chrome.runtime.lastError) {
                        console.log('Message send error:', chrome.runtime.lastError);
                    }
                });
            });
        })

        chrome.storage.onChanged.addListener(function (changes) {
            if (changes.preferred_thumbnail_file !== undefined) {
                setupThumbnailRedirectListeners(changes.preferred_thumbnail_file.newValue);
            }

            chrome.tabs.query({url: '*://www.youtube.com/*'}, function (tabs) {
                if (chrome.runtime.lastError) {
                    console.log('Tabs query error in storage listener:', chrome.runtime.lastError);
                    return;
                }
                
                tabs.forEach(function (tab) {
                    chrome.tabs.sendMessage(tab.id, changes, function(response) {
                        if (chrome.runtime.lastError) {
                            console.log('Message send error in storage listener:', chrome.runtime.lastError);
                        }
                    });
                })
            });
        });
    });
});

function setupThumbnailRedirectListeners(preferredThumbnailFile) {
    // Update global variable
    currentPreferredThumbnail = preferredThumbnailFile;
    
    // Remove existing listeners
    if (chrome.webRequest.onBeforeRequest.hasListener(thumbnailRedirectListener)) {
        chrome.webRequest.onBeforeRequest.removeListener(thumbnailRedirectListener);
    }
    
    if (preferredThumbnailFile === 'hqdefault') {
        // Don't add listener for default thumbnails
        return;
    }
    
    // Add webRequest listener for Firefox
    chrome.webRequest.onBeforeRequest.addListener(
        thumbnailRedirectListener,
        {
            urls: [
                "*://i.ytimg.com/*",
                "*://i9.ytimg.com/*"
            ],
            types: ["image"]
        },
        ["blocking"]
    );
}

function thumbnailRedirectListener(details) {
    const url = details.url;
    const regex = /^https:\/\/i9?\.ytimg\.com\/(vi|vi_webp)\/(.*)\/(default|hqdefault|mqdefault|sddefault|hq720)(_custom_[0-9]+)?\.jpg(.*)/;
    const match = url.match(regex);
    
    if (match && currentPreferredThumbnail !== 'hqdefault') {
        const newUrl = url.replace(/(hq1|hq2|hq3|hqdefault|mqdefault|hq720)(_custom_[0-9]+)?\.jpg/, `${currentPreferredThumbnail}.jpg`);
        return { redirectUrl: newUrl };
    }
    
    // Return undefined if no redirect needed
    return undefined;
}
