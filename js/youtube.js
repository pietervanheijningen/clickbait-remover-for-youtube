let styleElement = null;
let hasThumbnailBeenReplacedBefore = false;
let hasBeenHqdefaultBefore = true;

chrome.storage.sync.get(['video_title_format'], function ({video_title_format}) {
    if (video_title_format !== 'default') {
        updateCSS(video_title_format);
    }
});

chrome.runtime.onMessage.addListener(function (message) {
    Object.keys(message).forEach(function (change) {
        switch (change) {
            case 'preferred_thumbnail_file':
                let imgElements = document.getElementsByTagName('img');
                let imgToSearch = null;

                if (hasThumbnailBeenReplacedBefore) {
                    imgToSearch = message[change].oldValue
                } else {
                    imgToSearch = 'hqdefault';
                    hasBeenHqdefaultBefore = true;
                }

                for (let i = 0; i < imgElements.length; i++) {
                    if (imgElements[i].src.match(`https://i.ytimg.com/vi/.*/${imgToSearch}.jpg?.*`)) {

                        let url = imgElements[i].src.replace(`${imgToSearch}.jpg`, `${message[change].newValue}.jpg`);

                        if (hasBeenHqdefaultBefore) {
                            url += '&stringtokillcache'
                        }

                        imgElements[i].src = url;
                    }
                }

                if (message[change].newValue === 'hqdefault') {
                    hasBeenHqdefaultBefore = true;
                }

                hasThumbnailBeenReplacedBefore = true;
                break;
            case 'video_title_format':
                updateCSS(message[change].newValue);
                break;
        }
    })
});

function updateCSS(option) {

    let appendingElement = false;

    if (styleElement === null) {
        appendingElement = true;
        styleElement = document.createElement('style');
    }

    switch (option) {
        case 'lowercase':
            styleElement.innerHTML = '#video-title,.ytp-videowall-still-info-title{text-transform:lowercase;}';
            break;
        case 'capitalize_first_letter':
            styleElement.innerHTML = '#video-title{text-transform:lowercase;display:block!important;}#video-title::first-letter{text-transform:uppercase;}';
            break;
        case 'default':
            styleElement.remove();
            styleElement = null;
            break;
    }

    if (appendingElement) {
        document.head.appendChild(styleElement);
    }
}
