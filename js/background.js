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
        return {redirectUrl: details.url.replace('hqdefault.jpg', 'hq2.jpg')};
    },
    {
        urls: ['https://i.ytimg.com/vi/*/hqdefault.jpg?*'],
        types: ['image']
    },
    ['blocking']
);
