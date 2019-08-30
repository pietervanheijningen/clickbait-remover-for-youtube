let noRedirectToken = 'zctf420otaqimwn9lx8m';
let redirectListener = null;
let error404Listener = null;
let youtubeTabIdsByPageId = {};
let enabledPages = {};

// <executed_on_extension_enabled>
chrome.storage.sync.get(['preferred_thumbnail_file', 'enabled_pages'], function (storage) {

    setupThumbnailRedirectListeners(storage.preferred_thumbnail_file);

    chrome.tabs.query({url: '*://www.youtube.com/*'}, function (tabs) {
        tabs.forEach(function (tab) {
            chrome.tabs.executeScript(tab.id, {file: 'js/youtube.js'}, function () {
                chrome.tabs.sendMessage(tab.id, {
                    'preferred_thumbnail_file': {
                        newValue: storage.preferred_thumbnail_file
                    }
                });
            });
        })
    });

    enabledPages = storage.enabled_pages;
});
// </executed_on_extension_enabled>

chrome.runtime.onInstalled.addListener(function ({reason}) {
    let defaultValues = {
        preferred_thumbnail_file: 'hq1',
        video_title_format: 'capitalize_first_letter',
        enabled_pages: {
            homepage: true,
            trending: true,
            subscriptions: true,
            library: true,
            history: true,
            channel_pages: true,
            playlists: true,
            search_results: true,
            sidebar: true
        }
    };

    if (reason === 'install') {
        chrome.storage.sync.set(defaultValues)
    } else if (reason === 'update') {
        chrome.storage.sync.get(Object.keys(defaultValues), function (storage) {
            for (let defaultValuesKey in defaultValues) {
                if (storage[defaultValuesKey] === undefined) {
                    chrome.storage.sync.set({
                        [defaultValuesKey]: defaultValues[defaultValuesKey]
                    })
                }
            }
        })
    }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    youtubeTabIdsByPageId[sender.tab.id] = youtubeUrlToPageId(request.url);
    sendResponse(isYoutubePageEnabledFromTabId(sender.tab.id));
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
    if (youtubeTabIdsByPageId[tabId] !== undefined) {
        if (changeInfo.status === 'loading') {
            if (changeInfo.url !== undefined) {
                youtubeTabIdsByPageId[tabId] = youtubeUrlToPageId(changeInfo.url);
            }
        }

        if (changeInfo.title !== undefined) {
            chrome.storage.sync.get(['video_title_format'], function (storage) {
                chrome.tabs.sendMessage(tabId, {
                    'video_title_format': {
                        newValue: isYoutubePageEnabledFromTabId(tabId) ? storage.video_title_format : 'default'
                    }
                })
            })
        }
    }
});

chrome.storage.onChanged.addListener(function (changes) {
    if (changes.enabled_pages !== undefined) {
        enabledPages = changes.enabled_pages.newValue
    }

    if (changes.preferred_thumbnail_file !== undefined) {
        removeThumbnailRedirectListeners();
        setupThumbnailRedirectListeners(changes.preferred_thumbnail_file.newValue);
    }

    chrome.tabs.query({url: '*://www.youtube.com/*'}, function (tabs) {
        tabs.forEach(function (tab) {
            if (isYoutubePageEnabledFromTabId(tab.id)) {
                if (changes.enabled_pages !== undefined) {
                    chrome.storage.sync.get(['preferred_thumbnail_file', 'video_title_format'], function (storage) {
                        chrome.tabs.sendMessage(tab.id, {
                            'preferred_thumbnail_file': {
                                newValue: storage.preferred_thumbnail_file
                            },
                            'video_title_format': {
                                newValue: storage.video_title_format
                            }
                        });
                    })
                } else {
                    chrome.tabs.sendMessage(tab.id, changes);
                }
            } else {
                chrome.tabs.sendMessage(tab.id, {
                    'preferred_thumbnail_file': {
                        newValue: 'hqdefault'
                    },
                    'video_title_format': {
                        newValue: 'default'
                    }
                });
            }
        })
    });
});

function setupThumbnailRedirectListeners(preferredThumbnailFile) {
    if (preferredThumbnailFile !== 'hqdefault') {
        chrome.webRequest.onBeforeRequest.addListener(
            redirectListener = function (details) {
                if (!details.url.includes(`&noRedirectToken=${noRedirectToken}`)) {
                    if (isYoutubePageEnabledFromTabId(details.tabId)) {
                        return {redirectUrl: details.url.replace('hqdefault.jpg', `${preferredThumbnailFile}.jpg`)};
                    } else {
                        return {} // todo: not sure if this is right, just want the request to continue on like nothing happened
                    }
                }
            },
            {
                urls: ['https://i.ytimg.com/vi/*/hqdefault.jpg*'],
                types: ['image']
            },
            ['blocking']
        );

        chrome.webRequest.onHeadersReceived.addListener(
            error404Listener = function (details) {
                if (details.statusCode === 404) {
                    return {redirectUrl: details.url.replace(`${preferredThumbnailFile}.jpg`, 'hqdefault.jpg') + `&noRedirectToken=${noRedirectToken}`};
                }
            },
            {
                urls: [`https://i.ytimg.com/vi/*/${preferredThumbnailFile}.jpg*`],
                types: ['image']
            },
            ['blocking']
        );
    }
}

function removeThumbnailRedirectListeners() {
    if (redirectListener !== null) {
        chrome.webRequest.onBeforeRequest.removeListener(redirectListener);
    }
    if (error404Listener !== null) {
        chrome.webRequest.onHeadersReceived.removeListener(error404Listener);
    }
}

function isYoutubePageEnabledFromTabId(tabId) {
    if (youtubeTabIdsByPageId[tabId] !== undefined) {
        if (enabledPages[youtubeTabIdsByPageId[tabId]] !== undefined) {
            if (enabledPages[youtubeTabIdsByPageId[tabId]] === 'unknown') {
                return true;
            }
            return enabledPages[youtubeTabIdsByPageId[tabId]]
        }
    }

    return false
}

function youtubeUrlToPageId(url) {
    let path = (new URL(url)).pathname.replace(/\/+$/, '');
    if (path === '') {
        return 'homepage'
    } else if (path === '/feed/trending') {
        return 'trending'
    } else if (path === '/feed/subscriptions') {
        return 'subscriptions'
    } else if (path === '/feed/library') {
        return 'library'
    } else if (path === '/feed/history') {
        return 'history'
    } else if (path === '/watch') {
        return 'sidebar'
    } else if (path === '/playlist') {
        return 'playlist'
    } else if (path === '/results') {
        return 'search_results'
    } else if (path.match('\/(user|channel)\/.*')) {
        return 'channel_pages'
    } else {
        return 'unknown';
    }
}
