let noRedirectToken = 'zctf420otaqimwn9lx8m';
let redirectListener = null;
let error404Listener = null;

// <executed_on_extension_enabled>
chrome.storage.sync.get(['preferred_thumbnail_file'], function (storage) {

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

chrome.storage.onChanged.addListener(function (changes) {
    if (changes.preferred_thumbnail_file !== undefined) {
        removeThumbnailRedirectListeners();
        setupThumbnailRedirectListeners(changes.preferred_thumbnail_file.newValue);
    }

    chrome.tabs.query({url: '*://www.youtube.com/*'}, function (tabs) {
        tabs.forEach(function (tab) {
            chrome.tabs.sendMessage(tab.id, changes);
        })
    });
});

function setupThumbnailRedirectListeners(preferredThumbnailFile) {
    if (preferredThumbnailFile !== 'hqdefault') {
        chrome.webRequest.onBeforeRequest.addListener(
            redirectListener = function (details) {
                if (!details.url.includes(`&noRedirectToken=${noRedirectToken}`)) {
                    return {redirectUrl: details.url.replace('hqdefault.jpg', `${preferredThumbnailFile}.jpg`)};
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
