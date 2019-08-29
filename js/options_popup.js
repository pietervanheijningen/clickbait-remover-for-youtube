let optionKeys = ['preferred_thumbnail_file', 'video_title_format'];

chrome.storage.sync.get(optionKeys, function (storage) {
    optionKeys.forEach(function (optionKey) {
        document.getElementsByName(optionKey).forEach(function (item) {

            if (storage[optionKey] === item.value) {
                item.checked = true;
            }

            item.addEventListener('input', function () {
                chrome.storage.sync.set({[optionKey]: item.value});
            })
        });
    })
});

document.getElementById('pageSelectorTab').onclick = function () {
    this.classList.add('activeTab');
    document.getElementById('videoSettingsTab').classList.remove('activeTab');

    document.getElementById('videoSettings').classList.add('hidden');
    document.getElementById('pageSelector').classList.remove('hidden');
};

document.getElementById('videoSettingsTab').onclick = function () {
    this.classList.add('activeTab');
    document.getElementById('pageSelectorTab').classList.remove('activeTab');

    document.getElementById('pageSelector').classList.add('hidden');
    document.getElementById('videoSettings').classList.remove('hidden');
};
