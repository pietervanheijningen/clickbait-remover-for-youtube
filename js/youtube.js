chrome.storage.sync.get(['video_title_format'], function ({video_title_format}) {
    if (video_title_format !== 'default') {
        let node = document.createElement('style');

        switch (video_title_format) {
            case 'lowercase':
                node.innerHTML = '#video-title,.ytp-videowall-still-info-title{text-transform:lowercase;}';
                break;
            case 'capitalize_first_letter':
                node.innerHTML = '#video-title{text-transform:lowercase;display:block!important;}#video-title::first-letter{text-transform:uppercase;}';
                break;
        }

        document.head.appendChild(node);
    }
});
