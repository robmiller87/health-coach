# 🫀 Health Coach

> A lightweight, open-source MVP for a **WhatsApp-based health coach** using **WHOOP data** and an **LLM coaching layer**.

The first goal is not to build the perfect health app. The first goal is to prove that we can connect the infrastructure and create a useful coaching loop.

```text
💬 WhatsApp message → 🧠 backend → 🫀 WHOOP data → 🤖 LLM coach → ✅ WhatsApp reply
```

## 🌱 Why this exists

Most people collect health data passively through devices like WHOOP, Garmin, Strava, Eight Sleep, or Apple Health. The data is useful, but it often stays trapped in dashboards.

This project explores whether a chat-based coach can turn that data into simple, practical daily decisions:

- 🏋️ Should I train hard today?
- 🧘 Should I recover instead?
- 😴 What did my sleep/recovery suggest?
- 🔁 What habit should I adjust today?
- 📈 How do food, sleep, strain, and recovery connect over time?

## 🎯 MVP definition

A user should be able to message a coach on WhatsApp and get a useful response based on:

1. 🫀 Their latest WHOOP data
2. 🎯 Their personal goal
3. 💬 Their message or context
4. 🤖 A lightweight LLM reasoning layer

Example:

> “Your recovery is low, sleep was short, and yesterday’s strain was high. Don’t do intervals today. Do 30–45 minutes Zone 2 or mobility, hydrate, get protein, and prioritize an early night.”

## 🧪 What we are testing first

### 🔧 Technical proof

- Can we connect to the WHOOP API?
- Can we receive and send WhatsApp messages?
- Can we combine health data + user input in a model prompt?
- Can we return a useful coaching reply?

### 💡 Product proof

- Does the advice feel specific enough to matter?
- Would we use it ourselves daily?
- Which first use case is strongest: performance, sleep, fat loss, or general health?
- Is this worth expanding beyond a prototype?

## 🚦 Current status

Implemented locally:

- ✅ Basic Node.js backend
- ✅ Provider layer with a normalized daily summary (`src/providers/`)
- ✅ Mock provider for development
- ✅ **Oura Ring provider** (API v2, personal access token)
- ✅ Simple coach function
- ✅ `/health` endpoint
- ✅ `/coach` endpoint
- ✅ Unit tests (`node --test`)

Next integrations:

- 🔜 WHOOP OAuth + real API data
- 🔜 WhatsApp Cloud API or Twilio WhatsApp webhook
- 🔜 Groq / open-source model call

## ⚡ Quick start

```bash
npm install
npm test
npm run dev
```

Test the local coach endpoint:

```bash
curl -X POST http://localhost:3000/coach \
  -H "content-type: application/json" \
  -d '{"message":"Should I train hard today?"}'
```

## 🔐 Environment variables

Copy `.env.example` to `.env` when adding real integrations:

```bash
cp .env.example .env
```

Planned variables:

- `WHOOP_CLIENT_ID`
- `WHOOP_CLIENT_SECRET`
- `WHOOP_REDIRECT_URI`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `GROQ_API_KEY`
- `GROQ_MODEL`

## 👥 Team responsibilities

### 🫀 Enzo — WHOOP / API

- Review WHOOP API documentation
- Confirm OAuth scopes and available endpoints
- Test recovery, sleep, and strain data retrieval
- Share a sample WHOOP JSON response

### 💬 Arthur — WhatsApp / backend

- Decide WhatsApp path: Meta Cloud API, Twilio, or sandbox
- Set up webhook receiver
- Prove receiving one message and sending one reply
- Help wire the backend into the WhatsApp flow

### 🧭 Robert — product / model

- Own MVP direction and scope
- Define the first useful coach behaviours
- Test Groq / open-source model path
- Draft the initial system prompt and response format

## 🏁 First milestone

The first milestone is an end-to-end demo:

```text
User sends WhatsApp message
→ backend receives it
→ backend fetches WHOOP data or sample data
→ LLM generates coaching reply
→ reply is sent back in WhatsApp
```

If we can do this, we have the foundation.

## 🚫 Non-goals for v0

To keep the first version small, we are not building:

- a native mobile app
- payment/subscription system
- medical diagnosis or clinical advice
- advanced macro/nutrition tracking
- full long-term coaching plans
- multi-device integrations beyond WHOOP

## 📄 License

MIT.
