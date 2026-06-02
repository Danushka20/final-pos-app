# Fonts

The app uses **Inter** (BizLink-style modern UI typography).

| File | Weight |
|------|--------|
| `Inter-Regular.ttf` | 400 |
| `Inter-Medium.ttf` | 500 |
| `Inter-SemiBold.ttf` | 600 |
| `Inter-Bold.ttf` | 700 |
| `Inter-ExtraBold.ttf` | 800 |

Configured in `src/theme/fonts.ts` (`USE_INTER_FONTS = true`).

After changing font files:

```bash
npm run link:fonts
npm run android
```

Inter files are sourced from [Google Fonts Inter variable](https://github.com/google/fonts/tree/main/ofl/inter).
