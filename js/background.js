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

console.log('started');
