let optionKeys = ['preferred_thumbnail_file', 'video_title_format'];

chrome.storage.sync.get(optionKeys, function (storage) {
    optionKeys.forEach(function (optionKey) {
        document.getElementsByName(optionKey).forEach(function (item) {

            if (storage[optionKey] === item.value) {
                item.checked = true;
            }

            item.addEventListener('input', function () {
                handleOptionSelection(optionKey, item.value)
            })
        });
    })
});

function handleOptionSelection(optionKey, value) {
    chrome.storage.sync.set({[optionKey]: value}, function () {
        // query all youtube tabs and apply the changes
    });
}
