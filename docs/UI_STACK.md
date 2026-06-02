# POS Mobile — UI library stack

Curated libraries used in **suitable places** for a modern professional POS app:

| Library | Used for | In this project |
|---------|----------|-----------------|
| **Gluestack UI** | Buttons, inputs, cards, badges, forms | `PrimaryButton`, `AuthInput`, `StatCard`, `Badge` |
| **NativeWind** | Fast layout, spacing, utility classes | `ScreenContainer`, feature pills, glass backgrounds |
| **Lottie** | Smooth JSON animations | Opening & login screens |
| **Lucide** | Consistent modern icons | All screens |
| **Linear Gradient** | Hero revenue card, opening background | `HeroRevenueCard`, `OpeningScreen` |
| **React Navigation** | Auth + app flows | `AuthNavigator`, `AppNavigator` |

## Not added (avoid conflicts)

- **Tamagui / Paper / UI Kitten / Elements** — duplicate theme systems with Gluestack
- **Gifted Chat / Maps** — add when building chat or map features
- **Restyle** — Gluestack tokens already cover design system needs

## Screens

- **Opening** — Lottie + gradient + NativeWind feature chips + Gluestack CTAs
- **Login** — Glass card (Gluestack Box) + form controls + Lottie
- **Dashboard** — Gradient hero, stats grid, quick actions, recent sales with badges, pull-to-refresh, Laravel `/pos/dashboard` API
