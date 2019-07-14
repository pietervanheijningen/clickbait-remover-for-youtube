let imgElements = document.getElementsByTagName('img');

for (let i = 0; i < imgElements.length; i++) {
    if (imgElements[i].src.match('https://i.ytimg.com/vi/.*/hqdefault.jpg?.*')) {
        imgElements[i].src = imgElements[i].src.replace('hqdefault.jpg', 'hq1.jpg')
    }
}
