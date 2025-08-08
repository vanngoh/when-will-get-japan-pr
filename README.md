# When will get Japanese PR? 🇯🇵
> A machine which predicts when will you get your Japanese PR

## Features

- **Multi-language Support**: Available in English (en-US), Traditional Chinese (zh-TW), and Simplified Chinese (zh-CN)
- **Language Switcher**: Easy language switching via dropdown in the title area
- **Automatic Language Detection**: Detects browser language preferences
- **Permanent Residency Prediction**: Predicts when you can get Japanese Permanent Residency based on your application date

## Languages Supported

- 🇺🇸 **English (en-US)**: Default language
- 🇹🇼 **Traditional Chinese (zh-TW)**: 繁體中文
- 🇨🇳 **Simplified Chinese (zh-CN)**: 简体中文

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Internationalization

The application uses Nuxt's built-in i18n module for internationalization. Translation files are located in the `i18n/locales/` directory:

- `i18n/locales/en-US.json` - English translations
- `i18n/locales/zh-TW.json` - Traditional Chinese translations
- `i18n/locales/zh-CN.json` - Simplified Chinese translations

To add a new language:
1. Add the locale configuration to `nuxt.config.ts`
2. Create a new translation file in `i18n/locales/`
3. Update the LanguageSwitcher component if needed