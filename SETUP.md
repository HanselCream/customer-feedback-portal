# Review Gating Page - Multi-Store Setup Guide

This review gating page is designed to work for multiple stores using URL parameters. No need to create separate websites!

## How to Use

### Basic URL Structure

Share this link format with each of your stores:

```
https://yourdomain.com/?businessName=YourStoreName&logoUrl=https://...&googleReviewUrl=https://...
```

### URL Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `businessName` | Your store/business name | `businessName=Pizza%20Palace` |
| `logoUrl` | URL to your store logo | `logoUrl=https://example.com/logo.png` |
| `googleReviewUrl` | Google Maps review link | `googleReviewUrl=https://g.page/your-business` |
| `rewardCode` | Discount code (optional) | `rewardCode=SAVE15` |
| `rewardText` | Reward description (optional) | `rewardText=15%25%20off%20your%20next%20order` |
| `rewardExpiry` | Expiry message (optional) | `rewardExpiry=60%20days` |

### Example Links for Multiple Stores

**Store 1: Coffee Shop**
```
https://yourdomain.com/?businessName=Brew%20Haven&logoUrl=https://example.com/brew-haven.png&googleReviewUrl=https://g.page/brewhaven
```

**Store 2: Pizzeria**
```
https://yourdomain.com/?businessName=Tony%27s%20Pizza&logoUrl=https://example.com/tonys-pizza.png&googleReviewUrl=https://g.page/tonys-pizza
```

**Store 3: Gym**
```
https://yourdomain.com/?businessName=FitMax%20Gym&logoUrl=https://example.com/fitmax.png&googleReviewUrl=https://g.page/fitmaxgym&rewardCode=FITFREE&rewardText=1%20free%20class
```

## URL Encoding Tips

Since URLs need proper encoding:
- Spaces → `%20`
- `&` (inside text) → `%26`
- `%` → `%25`
- Apostrophes usually work as-is

Use online URL encoders if unsure: https://www.urlencoder.org

## Default Fallback Values

If you don't provide a parameter, these defaults are used:

- `businessName` = "Your Business"
- `logoUrl` = "https://via.placeholder.com/80"
- `googleReviewUrl` = "https://google.com/maps/place/your-business"
- `rewardCode` = "SAVE10"
- `rewardText` = "10% off your next visit"
- `rewardExpiry` = "30 days"

## Sharing with Stores

1. Create the full URL with each store's details
2. Shorten it with a URL shortener (bit.ly, tinyurl, etc.) if desired
3. Share the link in your emails, texts, QR codes, or receipts
4. Each store sees their own branding and messaging!

## API Integration

The page calls two optional API endpoints:

- `POST /api/suggest-review` — Generates review suggestions
- `POST /api/feedback` — Handles feedback submission

Implement these to fully enable the features, or they'll use fallback behavior.
