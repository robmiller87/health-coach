# Health Coach MVP

Open-source MVP for a WhatsApp-based health coach using WHOOP data and an LLM coaching layer.

## Goal

Prove the infrastructure loop:

```text
WhatsApp message → backend → WHOOP data/sample data → LLM coach → WhatsApp reply
```

This is an MVP skeleton, not a finished product.

## Current status

Implemented:

- Mock WHOOP summary
- Basic coaching logic
- HTTP backend with `/health` and `/coach`
- Local test script

Next integrations:

- WHOOP OAuth + real API data
- WhatsApp Cloud API or Twilio WhatsApp webhook
- Groq/OpenAI-compatible model call

## Quick start

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

## Environment variables

Copy `.env.example` to `.env` when adding real integrations.

```bash
cp .env.example .env
```

## Team task split

### Enzo — WHOOP/API

- Review WHOOP API docs
- Confirm OAuth scopes/endpoints for recovery, sleep, strain
- Test one WHOOP API request
- Share sample JSON

### Arthur — WhatsApp/backend

- Choose WhatsApp path: Meta Cloud API, Twilio, or sandbox
- Set up webhook receiver
- Prove receiving and sending one WhatsApp message

### Robert — product/model

- Define first coach behaviours
- Test Groq/open-source model path
- Draft system prompt and response format

## License

MIT — see `LICENSE`.
