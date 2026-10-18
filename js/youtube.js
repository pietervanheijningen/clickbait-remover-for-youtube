if (typeof window.styleElement === 'undefined') { // shitty way to detect if script was already injected, todo: find a better way to do this.
    window.styleElement = null;

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
                    updateThumbnails(
                        message[change].newValue === undefined ? 'hq1' : message[change].newValue
                    );
                    break;
                case 'video_title_format':
                    updateCSS(message[change].newValue);
                    break;
            }
        })
    });

    function updateCSS(option) {

        let appendingElement = false;

        if (window.styleElement === null) {
            appendingElement = true;
            window.styleElement = document.createElement('style');
        }

        switch (option) {
            case 'lowercase':
                //language=CSS
                window.styleElement.innerHTML = `
                #video-title,
                .ytLockupMetadataViewModelTitle,
                .yt-lockup-metadata-view-model__title,
                .yt-lockup-metadata-view-model-wiz__title,
                .ytp-videowall-still-info-title,
                .large-media-item-metadata > a > h3 > span,
                .media-item-metadata > a > h3 > span,
                .compact-media-item-headline > span {
                    text-transform: lowercase;
                }
            `;
                break;
            case 'capitalize_first_letter':
                //language=CSS
                window.styleElement.innerHTML = `
                #video-title,
                .ytLockupMetadataViewModelTitle,
                .yt-lockup-metadata-view-model__title,
                .yt-lockup-metadata-view-model-wiz__title,
                .ytp-videowall-still-info-title,
                .large-media-item-metadata > a > h3 > span,
                .media-item-metadata > a > h3 > span,
                .compact-media-item-headline > span {
                    text-transform: lowercase;
                    display: block !important;
                }

                #video-title::first-letter,
                .ytLockupMetadataViewModelTitle::first-letter,
                .yt-lockup-metadata-view-model__title::first-letter,
                .yt-lockup-metadata-view-model-wiz__title::first-letter,
                .ytp-videowall-still-info-title::first-letter,
                .large-media-item-metadata > a > h3 > span::first-letter,
                .media-item-metadata > a > h3 > span::first-letter,
                .compact-media-item-headline > span::first-letter {
                    text-transform: uppercase;
                }
            `;
                break;
            case 'capitalise_words':
                //language=CSS
                window.styleElement.innerHTML = `
                #video-title,
                .ytLockupMetadataViewModelTitle,
                .yt-lockup-metadata-view-model__title,
                .yt-lockup-metadata-view-model-wiz__title,
                .ytp-videowall-still-info-title,
                .large-media-item-metadata > a > h3 > span,
                .media-item-metadata > a > h3 > span,
                .compact-media-item-headline > span {
                    text-transform: lowercase;
                    display: block !important;
                }

                #video-title::first-line,
                .ytLockupMetadataViewModelTitle::first-line,
                .yt-lockup-metadata-view-model__title::first-line,
                .yt-lockup-metadata-view-model-wiz__title::first-line,
                .ytp-videowall-still-info-title::first-line,
                .large-media-item-metadata > a > h3 > span::first-line,
                .media-item-metadata > a > h3 > span::first-line,
                .compact-media-item-headline > span::first-line {
                    text-transform: capitalize;
                }
            `;
                break;
            case 'default':
                window.styleElement.remove();
                window.styleElement = null;
                break;
        }

        if (appendingElement) {
            document.head.appendChild(window.styleElement);
        }
    }

    /*
     * Cover or frame file name inside a thumbnail URL, e.g. ".../vi/<id>/hq720_custom_2.jpg"
     * or ".../vi_webp/<id>/hqdefault.webp". Group 1 = name (+ _custom_N), group 2 = extension.
     * Chapter frames ("hqdefault_26000.jpg") do not match: "_26000" is not "_custom_N".
     * Must stay in sync with the DNR rule in background.js.
     */
    const THUMBNAIL_FILE = /\/(?:vi|vi_webp)\/[^/]+\/((?:hq1|hq2|hq3|default|hqdefault|mqdefault|sddefault|hq720)(?:_custom_[0-9]+)?)\.(jpg|webp)/;

    /** Replaces the file name of a thumbnail URL found in `text`, keeping its extension. */
    function swapThumbnailFile(text, newImage) {
        return text.replace(THUMBNAIL_FILE, function (match, name, extension) {
            return match.slice(0, match.length - name.length - extension.length - 1) + `${newImage}.${extension}`;
        });
    }

    // Called when the user changes the preferred image in the popup: images already on
    // screen were fetched before the new DNR rule, so their URLs are rewritten here.
    function updateThumbnails(newImage) {
        let imgElements = document.getElementsByTagName('img');

        for (let i = 0; i < imgElements.length; i++) {
            if (/^https:\/\/i9?\.ytimg\.com\//.test(imgElements[i].src) && THUMBNAIL_FILE.test(imgElements[i].src)) {

                let url = swapThumbnailFile(imgElements[i].src, newImage);

                // Forces a new request (and thus the redirect) instead of the cached image.
                if (!url.match('.*stringtokillcache')) {
                    url += (url.includes('?') ? '&' : '?') + 'stringtokillcache'
                }

                imgElements[i].src = url;
            }
        }

        let backgroundImgElements = document.querySelectorAll('.ytp-videowall-still-image, .iv-card-image');

        for (let i = 0; i < backgroundImgElements.length; i++) {
            let styleAttribute = backgroundImgElements[i].getAttribute('style');

            if (styleAttribute && /https:\/\/i9?\.ytimg\.com\//.test(styleAttribute) && THUMBNAIL_FILE.test(styleAttribute)) {

                let newStyleAttribute = swapThumbnailFile(styleAttribute, newImage);

                if (!newStyleAttribute.match('.*stringtokillcache.*')) {
                    // messes up existing query parameters that might be there, but that's ok.
                    newStyleAttribute = newStyleAttribute.replace(/"\);$/, '?stringtokillcache");')
                }

                backgroundImgElements[i].style = newStyleAttribute;
            }
        }
    }
}
