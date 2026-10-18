chrome.runtime.onInstalled.addListener(function ({reason}) {
    if (reason === 'install') {
        // default values
        chrome.storage.sync.set({
            preferred_thumbnail_file: 'hq1',
            video_title_format: 'capitalize_first_letter'
        })
    }
});

// Registered at top level, not inside a callback: in Firefox MV3 the background is a
// non-persistent event page, and only listeners registered synchronously when the
// script starts can wake it up again after it has been suspended.
chrome.storage.onChanged.addListener(function (changes) {
    if (changes.preferred_thumbnail_file !== undefined) {
        setupThumbnailRedirectListeners(changes.preferred_thumbnail_file.newValue);
    }

    chrome.tabs.query({url: '*://www.youtube.com/*'}, function (tabs) {
        tabs.forEach(function (tab) {
            chrome.tabs.sendMessage(tab.id, changes);
        })
    });
});

chrome.storage.sync.get(['preferred_thumbnail_file'], function (storage) {

    if (storage.preferred_thumbnail_file === undefined) { // shitty fix
        storage.preferred_thumbnail_file = "hq1"
    }

    setupThumbnailRedirectListeners(storage.preferred_thumbnail_file);

    chrome.tabs.query({url: '*://www.youtube.com/*'}, function (tabs) {
        tabs.forEach(function (tab) {
            chrome.scripting.executeScript({
                    target: {
                        tabId: tab.id
                    },
                    files: ['js/youtube.js']
                }
                ,function () {
                    chrome.tabs.sendMessage(tab.id, {
                        'preferred_thumbnail_file': {
                            newValue: storage.preferred_thumbnail_file
                        }
                    });
                }
            )
        })
    });
});

/*
 * Redirects YouTube's cover thumbnails to the auto-generated frames hq1/hq2/hq3.
 *
 * Captured URL shapes (measured on youtube.com, 18/10/2026):
 *   https://i.ytimg.com/vi/<id>/hq720.jpg?sqp=...&rs=...      (grids, sidebar)
 *   https://i.ytimg.com/vi/<id>/hq720_custom_2.jpg?sqp=...     (A/B-tested covers)
 *   https://i.ytimg.com/vi_webp/<id>/hqdefault.webp            (playlists/mixes)
 *   https://i9.ytimg.com/vi/<id>/...                            (alternate host)
 * Groups: \1 = vi|vi_webp, \2 = video id, \3 = cover name, \4 = _custom_N,
 *         \5 = jpg|webp (kept, the frames exist in both formats), \6 = query string.
 * The signed `sqp`/`rs` query is carried over: the server ignores it for hq1/2/3.
 * Deliberately NOT captured: `hqdefault_<ms>.jpg` (chapter frames, already taken
 * from the video) and `an_webp/.../mqdefault_6s.webp` (animated hover previews).
 */
function setupThumbnailRedirectListeners(preferredThumbnailFile) {
    if (preferredThumbnailFile === 'hqdefault') {
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [1]
        })
    } else {
        chrome.declarativeNetRequest.updateDynamicRules({
            addRules: [
                {
                    "id": 1,
                    "priority": 1,
                    "action": {
                        "type": "redirect",
                        "redirect": {
                            "regexSubstitution": `https://i.ytimg.com/\\1/\\2/${preferredThumbnailFile}.\\5\\6`
                        }
                    },
                    "condition": {
                        "regexFilter": "^https://i9?\\.ytimg\\.com/(vi|vi_webp)/([^/]+)/(default|hqdefault|mqdefault|sddefault|hq720)(_custom_[0-9]+)?\\.(jpg|webp)(.*)",
                        "resourceTypes": [
                            "image"
                        ]
                    }
                }
            ],
            removeRuleIds: [1]
        })
    }
}
