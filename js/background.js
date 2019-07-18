let noRedirectToken = 'zctf420otaqimwn9lx8m';

chrome.tabs.query({url: '*://www.youtube.com/*'}, function (tabs) {
    tabs.forEach(function (tab) {
        chrome.tabs.insertCSS(tab.id, {
            file: 'css/youtube.css'
        });
        chrome.tabs.executeScript(tab.id, {
            file: 'js/replaceThumbnails.js'
        })
    })
});

chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        if (!details.url.includes(`&noRedirectToken=${noRedirectToken}`)) {
            return {redirectUrl: details.url.replace('hqdefault.jpg', 'hq1.jpg')};
        }
    },
    {
        urls: ['https://i.ytimg.com/vi/*/hqdefault.jpg?*'],
        types: ['image']
    },
    ['blocking']
);

chrome.webRequest.onHeadersReceived.addListener(
    function (details) {
        if (details.statusCode === 404) {
            return {redirectUrl: details.url.replace('hq1.jpg', 'hqdefault.jpg') + `&noRedirectToken=${noRedirectToken}`};
        }
    },
    {
        urls: ['https://i.ytimg.com/vi/*/hq1.jpg?*'],
        types: ['image']
    },
    ['blocking']
);
