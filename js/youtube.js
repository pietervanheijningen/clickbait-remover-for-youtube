let styleElement = null;
let hasThumbnailBeenReplacedBefore = false;

// <executed_on_content_script_loaded>
chrome.storage.sync.get(['video_title_format'], function ({video_title_format}) {
    // only running something for the css change, as the webRequest listeners should be live now.
    if (video_title_format !== 'default') {
        updateCSS(video_title_format);
    }
});
// </executed_on_content_script_loaded>

chrome.runtime.onMessage.addListener(function (message) {
    Object.keys(message).forEach(function (change) {
        switch (change) {
            case 'preferred_thumbnail_file':
                let imgElements = document.getElementsByTagName('img');
                let imgToSearch = null;
                let imgToReplace = null;
                let appendStringToKillCache = false;

                if (hasThumbnailBeenReplacedBefore) {
                    imgToSearch = message[change].oldValue
                } else {
                    imgToSearch = 'hqdefault'
                }

                if (message[change].newValue === undefined) {
                    imgToReplace = 'hq1'
                } else {
                    imgToReplace = message[change].newValue
                }
                if (hasThumbnailBeenReplacedBefore && message[change].newValue === 'hqdefault') {
                    appendStringToKillCache = true;
                }

                for (let i = 0; i < imgElements.length; i++) {
                    if (imgElements[i].src.match(`https://i.ytimg.com/vi/.*/${imgToSearch}.jpg?.*`)) {

                        let url = imgElements[i].src.replace(`${imgToSearch}.jpg`, `${imgToReplace}.jpg`);

                        if (appendStringToKillCache && !url.match('.*stringtokillcache')) {
                            url += '&stringtokillcache'
                        }

                        imgElements[i].src = url;
                    }
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
