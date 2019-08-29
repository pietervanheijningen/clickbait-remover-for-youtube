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

chrome.storage.sync.get('enabled_pages', function (storage) {
    for (let tile of document.getElementsByClassName('pageSelectorTile')) {
        if (storage.enabled_pages[tile.id]) {
            tile.classList.add('activeTile');
            document.getElementById(`checkbox_${tile.id}`).checked = true;
        }

        tile.addEventListener('click', function () {
            storage.enabled_pages[tile.id] = !tile.classList.contains('activeTile');
            tile.classList.toggle('activeTile');
            document.getElementById(`checkbox_${tile.id}`).checked = storage.enabled_pages[tile.id];

            chrome.storage.sync.set({'enabled_pages': storage.enabled_pages});
        })
    }
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
