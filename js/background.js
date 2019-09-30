let ytApiKey = 'AIzaSyAyFeqAt42kno9Oemp4_2G9s14DvIEBJOc';
let noRedirectToken = 'zctf420otaqimwn9lx8m';
let redirectListener = null;
let error404Listener = null;
let externalServerListener = null;
let dontReplaceChannelIds = [
    'UC_E4px0RST-qFwXLJWBav8Q', //business casual
    'UCXuqSBlHAE6Xw-yeJA0Tunw', //ltt
    'UC-lHJZR3Gqxm24_Vd_AJ5Yw', //pewdiepie
];

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

                let videoId = details.url
                    .replace('https://i.ytimg.com/vi/', '')
                    .replace(/\/(hqdefault|mqdefault).*/, '');

                let http = new XMLHttpRequest();
                http.open(
                    'GET',
                    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${ytApiKey}`,
                    false
                );
                http.send();
                let response = JSON.parse(http.responseText);

                if (!dontReplaceChannelIds.includes(response.items[0].snippet.channelId) &&
                    !details.url.includes(`&noRedirectToken=${noRedirectToken}`)
                ) {
                    return {redirectUrl: details.url.replace(/(hqdefault|mqdefault).jpg/, `${preferredThumbnailFile}.jpg`)};
                }
            },
            {
                urls: [
                    'https://i.ytimg.com/vi/*/hqdefault.jpg*',
                    'https://i.ytimg.com/vi/*/mqdefault.jpg*'
                ],
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
