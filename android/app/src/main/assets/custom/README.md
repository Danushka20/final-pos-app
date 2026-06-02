# Fonts

The app uses a **professional typography stack** by default:

| Platform | Font |
|----------|------|
| iOS | SF Pro (System) |
| Android | Roboto |

Configured in `src/theme/fonts.ts` and applied via Gluestack UI, buttons, inputs, and tabs.

## Optional: Inter (same as web dashboards)

1. Download [Inter](https://fonts.google.com/specimen/Inter) and add to this folder:

   - `Inter-Regular.ttf`
   - `Inter-Medium.ttf`
   - `Inter-SemiBold.ttf`
   - `Inter-Bold.ttf`

2. Set `USE_INTER_FONTS = true` in `src/theme/fonts.ts`

3. Link assets:

   ```bash
   npm run link:fonts
   npm run android
   ```
