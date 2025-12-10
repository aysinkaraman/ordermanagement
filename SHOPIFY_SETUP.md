# 🛍️ Shopify Integration Setup Guide

## Overview
This guide will help you connect your Shopify store to Falcon Board to automatically import orders as cards.

## Prerequisites
- A Shopify store
- Admin access to your Shopify store
- Falcon Board installed and running

## Step 1: Create a Shopify Custom App

1. **Log in to your Shopify Admin** at `https://your-store.myshopify.com/admin`

2. **Navigate to Apps**
   - Click on "Settings" in the bottom left
   - Click on "Apps and sales channels"
   - Click "Develop apps"

3. **Create a new app**
   - Click "Create an app"
   - Name it "Falcon Board" or any name you prefer
   - Click "Create app"

4. **Configure API Access**
   - Click on "Configure Admin API scopes"
   - Enable the following scopes:
     - `read_orders` - To fetch order information
     - `read_products` - To get product details
     - `read_customers` - To access customer information
   - Click "Save"

5. **Install the app**
   - Click "Install app"
   - Confirm the installation

6. **Get your Access Token**
   - Go to "API credentials" tab
   - Click "Reveal token once" under "Admin API access token"
   - **IMPORTANT**: Copy this token immediately - you can only see it once!

## Step 2: Configure Falcon Board

1. **Update .env file**
   ```env
   SHOPIFY_SHOP_NAME=your-store.myshopify.com
   SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxx
   ```

2. **Restart your development server**
   ```bash
   npm run dev
   ```

## Step 3: Import Orders

### Manual Import
1. Log in to Falcon Board
2. Click the "🛍️ Import Shopify" button in the header
3. Confirm the import
4. Orders will be imported as cards in appropriate columns

### Order Status Mapping
- `pending` / `authorized` → **To Do**
- `partially_paid` / `paid` / `partially_fulfilled` → **In Progress**
- `fulfilled` → **Done**
- `refunded` / `voided` / `cancelled` → **Cancelled**

## Step 4: Set Up Webhooks (Optional - for real-time updates)

1. **In Shopify Admin**
   - Go to Settings → Notifications → Webhooks
   - Click "Create webhook"

2. **Configure Webhook**
   - Event: `Order creation`
   - Format: `JSON`
   - URL: `https://your-falcon-board-domain.com/api/shopify/orders`
   - API version: `2024-10`

3. **Save webhook**
   - Click "Save webhook"

## Features

### Order Cards Include:
- 📦 Order number
- 👤 Customer name
- 💰 Total amount
- 📅 Order date
- 📧 Customer email
- 📱 Customer phone
- 📦 Line items with quantities and prices
- 📍 Shipping address

### Auto-Generated Columns
If columns don't exist, they will be created automatically:
- **To Do** - New/pending orders
- **In Progress** - Processing orders
- **Done** - Fulfilled orders
- **Cancelled** - Cancelled/refunded orders

## Troubleshooting

### "Shopify credentials not configured"
- Make sure you've added `SHOPIFY_SHOP_NAME` and `SHOPIFY_ACCESS_TOKEN` to `.env`
- Restart your dev server after updating `.env`

### "Shopify API error"
- Verify your access token is correct
- Check that your app has the required API scopes
- Ensure your shop name includes `.myshopify.com`

### "Order already exists"
- Orders are only imported once (duplicate detection by order number)
- This is normal behavior

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit** your `.env` file to Git
2. **Keep your access token secure** - treat it like a password
3. **Use environment variables** in production (Vercel, Heroku, etc.)
4. **Implement webhook verification** for production (HMAC signature validation)
5. **Rate limiting** - Shopify has API rate limits, respect them

## Testing

### Test with Shopify's Test Orders
1. In Shopify Admin, create a test order
2. Import orders via Falcon Board
3. Verify the card appears with correct details

### Webhook Testing
Use tools like:
- [ngrok](https://ngrok.com/) for local webhook testing
- [Shopify's webhook testing tool](https://shopify.dev/docs/apps/webhooks/test)

## Support

For issues or questions:
- Check Shopify API documentation: https://shopify.dev/docs/api
- Review Falcon Board logs in the terminal
- Check browser console for frontend errors

---

**Happy importing! 🎉**
