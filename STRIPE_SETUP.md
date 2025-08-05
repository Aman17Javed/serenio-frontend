# Stripe Setup Guide for Projects

## 🎯 Project Setup (Recommended)

### Option 1: Test Mode (Perfect for Projects)
- ✅ **No business verification required**
- ✅ **No bank details needed**
- ✅ **Works immediately**
- ✅ **Perfect for demos and portfolios**

1. **Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)**
2. **Stay in "Test" mode** (default)
3. **Copy your test keys:**
   - Publishable Key: `pk_test_...`
   - Secret Key: `sk_test_...`

### Option 2: Production Mode (For Real Business)
- ⚠️ **Requires business verification**
- ⚠️ **Needs bank account details**
- ⚠️ **Requires business documentation**
- ✅ **Real payments processed**

1. **Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)**
2. **Switch to "Live" mode** (toggle in top right)
3. **Complete business verification**
4. **Copy your production keys:**
   - Publishable Key: `pk_live_...`
   - Secret Key: `sk_live_...`

## 🔧 Environment Variables Setup

### Backend (.env file)
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Other required variables
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
```

### Frontend (.env file)
```env
# Stripe Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Backend API
REACT_APP_API_URL=https://serenio-production.up.railway.app
```

## 🌐 Webhook Setup

### For Production (Real Payments)
1. **Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)**
2. **Click "Add endpoint"**
3. **Enter your webhook URL:**
   ```
   https://your-backend-domain.com/api/webhook
   ```
4. **Select events:**
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.succeeded`
   - `charge.failed`
5. **Copy the webhook secret to your .env file**

### For Test Mode (Projects)
- ✅ **No webhook setup required for demo mode**
- ✅ **Frontend simulates payment success**
- ✅ **Perfect for project demonstrations**

## ✅ Testing

### Test Mode (Recommended for Projects)
- ✅ **Use test card**: `4242 4242 4242 4242`
- ✅ **Any future expiry date**
- ✅ **Any 3-digit CVC**
- ✅ **No real charges**
- ✅ **Perfect for demos**

### Production Mode
- ⚠️ **Use real credit cards**
- ⚠️ **Start with small amounts**
- ⚠️ **Real charges will be processed**

## 🚨 Important Notes

### Security
- **Never commit API keys to Git**
- **Use environment variables**
- **Keep webhook secrets secure**
- **Test thoroughly before going live**

### Demo Mode Features
- **Toggle in PaymentForm component**
- **Simulates payment success**
- **No real charges processed**
- **Perfect for project presentations**

### Production Checklist
- [ ] Business verification completed
- [ ] Bank account added
- [ ] Webhooks configured
- [ ] SSL certificate installed
- [ ] Error handling implemented
- [ ] Payment testing completed

## 🔗 Useful Links

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Webhook Testing](https://stripe.com/docs/webhooks/test)

## 📞 Support

For Stripe-related issues:
- [Stripe Support](https://support.stripe.com)
- [Stripe Community](https://community.stripe.com)

For project-specific issues:
- Check the project documentation
- Review error logs
- Test with demo mode first 