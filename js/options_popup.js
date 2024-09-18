let optionKeys = ['preferred_thumbnail_file', 'preferred_thumbnail_resolution', 'video_title_format'];

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

const textElements = document.querySelectorAll('[data-localize]');
textElements.forEach((e) => {
  const ref = e.dataset.localize;
  if (ref) {
     const translated= ref.replace(/__MSG_(\w+)__/g, (match, theGroup) => chrome.i18n.getMessage(theGroup));
    if (translated) {
      e.innerText = translated;
    }
  }
});

let donateButton = document.getElementById('donatebutton');

donateButton.onclick = function () {
    document.getElementById('settings').remove();
    donateButton.remove();
    document.getElementById('donate').style.display = 'block';
}

document.getElementById('paypallink').onclick = function () {
    chrome.tabs.create({url: 'https://paypal.me/pietervanheijningen'})
}
