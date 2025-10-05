# Установка расширения в Firefox

## Проблемы, которые были исправлены:

1. **API совместимость**: Заменен `chrome.scripting.executeScript` на `chrome.tabs.executeScript` для Firefox
2. **DeclarativeNetRequest**: Заменен на `webRequest` API для Firefox
3. **Права доступа**: Обновлены права в `firefox_manifest.json`
4. **Отдельный background script**: Создан `background_firefox.js` для Firefox

## Как установить:

1. Откройте Firefox
2. Перейдите в `about:debugging`
3. Нажмите "Этот Firefox"
4. Нажмите "Загрузить временное дополнение"
5. Выберите файл `firefox_manifest.json` из папки расширения

## Файлы для Firefox:

- `firefox_manifest.json` - манифест для Firefox (Manifest V2)
- `js/background_firefox.js` - background script для Firefox
- Остальные файлы остаются теми же

## Проверка работы:

1. Откройте YouTube
2. Расширение должно заменить миниатюры видео
3. Проверьте настройки через иконку расширения

## Возможные проблемы:

- Если расширение не загружается, проверьте консоль разработчика на ошибки
- Убедитесь, что используете `firefox_manifest.json`, а не `manifest.json`
- Проверьте, что все файлы находятся в правильных папках
