# Миграция на Nocturna-Wheel v3.0.x

## История проблемы (версия 2.0.0)

При использовании библиотеки `@eaprelsky/nocturna-wheel` версии 2.0.0 для генерации астрологических карт возникала проблема с загрузкой SVG-иконок знаков зодиака и планет. Это приводило к множественным ошибкам в консоли и таймауту рендеринга (Error 504).

Типичные ошибки:
- `Zodiac sign icon not found: ./assets/svg/zodiac/zodiac-sign-*.svg`
- `Planet icon not found: ./assets/svg/zodiac/zodiac-planet-*.svg`

### Корневая причина (v2.0.0)

1. **Контекст выполнения**: Когда HTML загружается через Puppeteer с помощью `page.setContent()`, браузер не имеет доступа к файловой системе и не может загрузить локальные файлы по относительным путям.

2. **Поведение библиотеки**: Библиотека `nocturna-wheel` пытается загрузить иконки из пути `./assets/svg/zodiac/`, даже когда параметр `showIcons: false` установлен в конфигурации.

3. **Расположение файлов**: SVG-иконки находятся в `node_modules/@eaprelsky/nocturna-wheel/dist/assets/`, но библиотека ищет их относительно текущего контекста выполнения.

## ✅ Обновление на v3.0.1 (патч авторов библиотеки)

**Дата:** 14 ноября 2025  
**Версия библиотеки:** `@eaprelsky/nocturna-wheel` v3.0.1

Разработчики выпустили патч, который автоматически регистрирует inline IconProvider. Для миграции теперь достаточно:

1. Обновить зависимость:
   ```bash
   npm install @eaprelsky/nocturna-wheel@^3.0.1
   ```
2. В шаблоне подключить CDN/локальный бандл версии 3.0.1:
   ```html
   <script src="https://unpkg.com/@eaprelsky/nocturna-wheel@3.0.1/dist/nocturna-wheel.umd.js"></script>
   ```
3. Убедиться, что `wheelConfig.config.zodiacSettings/planetSettings.showIcons = true` и больше НИКАКОЙ ручной регистрации `IconProvider` не выполняется.

Никакие дополнительные шаги не требуются: v3.0.1 включает 35 data URLs прямо в UMD и сразу использует их и в браузере, и в Puppeteer.

---

## ℹ️ Архив: временный хак для v3.0.0

Если по каким-то причинам вы остались на 3.0.0, сохранён ниже прежний рецепт с инлайнингом (развернуть блок):

<details>
<summary>Инлайнинг библиотеки и IconProvider (только для v3.0.0)</summary>

### 1. Копирование библиотеки в проект

```bash
cp node_modules/@eaprelsky/nocturna-wheel/dist/nocturna-wheel.bundle.js src/templates/lib/
```

### 2. Inline встраивание в HTML

```javascript
const libPath = path.join(__dirname, '../templates/lib/nocturna-wheel.bundle.js');
const libCode = await fs.readFile(libPath, 'utf-8');
template = template.replace('<script src="/lib/nocturna-wheel.umd.js"></script>', `<script>\n${libCode}\n</script>`);
```

### 3. Регистрация IconProvider

```javascript
const inlineIconProvider = new NocturnaWheel.IconProvider({ basePath: 'inline://', useInline: true });
inlineIconProvider.setInlineData(NocturnaWheel.IconData);
NocturnaWheel.ServiceRegistry.register('iconProvider', inlineIconProvider);
```
</details>

## Результат миграции

✅ **Преимущества v3.0.1:**
1. **Устранение проблем с загрузкой**: Иконки встроены в код, нет сетевых запросов
2. **Упрощённая архитектура**: Меньше кода, убрана логика serving assets
3. **Работа из коробки**: Не требуется настройка путей к ассетам
4. **Лучшая производительность**: Нет задержек на загрузку внешних файлов
5. **Надежность**: Нет зависимости от файловой системы или HTTP-сервера

## Удалённая архитектура (v2.0.0, больше не нужна)

<details>
<summary>Старое решение для v2.0.0 (для справки)</summary>

### Статический сервер для иконок
```javascript
// src/app.js (v2.0.0 - БОЛЬШЕ НЕ НУЖНО)
app.use('/assets', express.static(path.join(__dirname, '../node_modules/@eaprelsky/nocturna-wheel/dist/assets')));
```

### Динамическая конфигурация путей
```javascript
// src/services/chartRenderer.service.js (v2.0.0 - БОЛЬШЕ НЕ НУЖНО)
getAssetBaseUrl() {
  if (config.publicUrl) {
    return `${config.publicUrl.replace(/\/$/, '')}/assets/`;
  }
  const hostNeedsFallback = !config.host || config.host === '0.0.0.0' || config.host === '::';
  const host = hostNeedsFallback ? '127.0.0.1' : config.host;
  return `http://${host}:${config.port}/assets/`;
}
```
</details>

## Рекомендации для v3.0.1

- ✅ Включите `showIcons: true` — теперь это действительно “просто работает”
- ✅ Дополнительные ассеты/статические маршруты не нужны
- ✅ Можно удалить временные файлы (`src/templates/lib/*`) и ручные патчи IconProvider
