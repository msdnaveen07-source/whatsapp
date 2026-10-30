# WhatsApp Connect CRM 🚀

Production-ready multi-tenant WhatsApp CRM and 2-way messaging SaaS built using the **official Meta WhatsApp Cloud API / Graph API** with Next.js, TypeScript, Tailwind CSS, and Prisma ORM.

> **Important**: This application connects directly to the official Meta Graph API (`https://graph.facebook.com/v21.0/`). It does not rely on third-party aggregators (Twilio, WATI, Interakt, Gupshup).

---

## Key Features

- **Multi-Tenant Architecture**: Data isolation per organization (`organization_id`) across contacts, conversations, messages, templates, campaigns, credentials, users, and audit logs.
- **2-Way Chat Inbox**: Real-time incoming message streaming via Server-Sent Events (SSE). Support for sending text, media, and template messages with delivery status checkmarks (Sent, Delivered, Read, Failed).
- **Meta Webhook Handling**: Signature validation using HMAC-SHA256 (`X-Hub-Signature-256`), raw `hub.challenge` GET verification, and event deduplication.
- **Template Manager**: Visual template builder with dynamic `{{1}}`, `{{2}}` variables, required example values, side-by-side WhatsApp smartphone preview, direct Meta Graph API submission (`POST /{WABA_ID}/message_templates`), and status synchronization.
- **Broadcast Campaigns**: Audience broadcast manager with target contact selection, dynamic variable mapping, and live progress bars (Sent, Delivered, Read, Failed).
- **Setup Wizard & Diagnostics**: Step-by-step Meta developer setup guide (Steps 1–9), connection testing tool, and webhook diagnostic page.
- **Dual Execution Mode**: Supports live Meta Cloud API credentials as well as a built-in local development mock mode (`WHATSAPP_MOCK_MODE=true`).

---

## Tech Stack

- **Framework**: Next.js (App Router) with TypeScript
- **Styling**: Tailwind CSS, Lucide Icons
- **Database**: Prisma ORM (SQLite for instant zero-dependency local dev, fully compatible with PostgreSQL)
- **Real-Time**: Server-Sent Events (SSE)

---

## Getting Started

### 1. Prerequisites

- Node.js v18 or later
- npm or yarn

### 2. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Ensure your `.env` contains:

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_SECRET="whcrm_super_secret_jwt_key_2026"
DATABASE_URL="file:./dev.db"

# Set WHATSAPP_MOCK_MODE to "true" for local testing without Meta credentials
WHATSAPP_MOCK_MODE="true"

META_APP_ID="123456789012345"
META_APP_SECRET="0123456789abcdef0123456789abcdef"
META_ACCESS_TOKEN="EAAG..."
META_WABA_ID="100987654321098"
META_PHONE_NUMBER_ID="105432109876543"
META_GRAPH_API_VERSION="v21.0"
META_WEBHOOK_VERIFY_TOKEN="whcrm_verify_9f7d3a2c8b6e4a1f"
```

### 3. Install Dependencies & Initialize Database

```bash
# Install dependencies
npm install

# Push Prisma schema to SQLite database
npx prisma db push

# Seed initial organization, admin user, mock active conversations & templates
npx tsx prisma/seed.ts
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Meta WhatsApp Cloud API Setup Guide

Follow the step-by-step wizard in **Settings → Meta API Setup** inside the app:

1. **Create Meta Developer App**: Go to [developers.facebook.com](https://developers.facebook.com) and create a Business App.
2. **Add WhatsApp Product**: Add WhatsApp to your Meta App.
3. **Connect WABA**: Link your WhatsApp Business Account and add your phone number.
4. **Configure Webhook**:
   - **Callback URL**: `https://YOUR-DOMAIN.com/api/webhooks/whatsapp`
   - **Verify Token**: `whcrm_verify_9f7d3a2c8b6e4a1f` (or your custom secret from `.env`).
5. **Subscribe to Fields**: Enable the `messages` webhook field in Meta Developer Console.
6. **Enter Credentials**: Enter App ID, App Secret, System User Token, WABA ID, and Phone Number ID into **Settings → Meta API Setup**.

---

## Verifying Webhook Endpoints

### 1. Test Verification GET Endpoint

Meta calls this endpoint when configuring webhooks:

```bash
curl "http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=whcrm_verify_9f7d3a2c8b6e4a1f&hub.challenge=1158201431"
```

**Expected Response**: Plain text `1158201431` with HTTP Status `200`.

### 2. Test Inbound Webhook POST Event

Send a sample incoming message payload:

```bash
curl -X POST "http://localhost:3000/api/webhooks/whatsapp" \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": { "phone_number_id": "105432109876543" },
          "contacts": [{ "profile": { "name": "Test Customer" }, "wa_id": "14155559820" }],
          "messages": [{
            "from": "14155559820",
            "id": "wamid.test_001",
            "timestamp": "1700000000",
            "type": "text",
            "text": { "body": "Hello from Meta Webhook!" }
          }]
        }
      }]
    }]
  }'
```

**Expected Response**: `{"status":"EVENT_RECEIVED"}` with HTTP Status `200`. The message will instantly appear in the 2-Way Inbox via SSE!

---

## Project Structure

```
├── prisma/
│   ├── schema.prisma              # Database schema with multi-tenant isolation
│   └── seed.ts                    # Demo database populator
├── src/
│   ├── app/
│   │   ├── api/                   # REST & SSE API endpoints
│   │   │   ├── webhooks/whatsapp  # Meta webhook GET & POST handler
│   │   │   ├── whatsapp/           # Meta connection, templates, messaging API
│   │   │   ├── conversations/     # Chat inbox & SSE streaming
│   │   │   ├── contacts/          # Contacts CRUD & CSV Import/Export
│   │   │   └── campaigns/         # Broadcast campaign execution
│   │   ├── dashboard/             # SaaS Analytics Overview
│   │   ├── inbox/                 # 2-Way Chat Interface
│   │   ├── contacts/              # Contact Management
│   │   ├── templates/             # Meta Template Manager & Builder
│   │   ├── campaigns/             # Broadcast Campaigns
│   │   └── settings/              # WhatsApp Setup Wizard, Diagnostics & API Logs
│   ├── components/
│   │   └── layout/                # Sidebar & Header components
│   ├── services/
│   │   └── whatsapp/              # Graph API & Webhook business logic
│   └── lib/                       # Prisma client singleton & SSE event bus
```

---

## Production Deployment Notes

1. For production deployment, set `DATABASE_URL` to a PostgreSQL database string (e.g. `postgresql://user:pass@host:5432/dbname`) and change `provider = "postgresql"` in `prisma/schema.prisma`.
2. Set `WHATSAPP_MOCK_MODE="false"` to require real Meta Graph API validation.
3. Host the application on a public domain with SSL (`https://...`) so Meta can deliver webhook events to `/api/webhooks/whatsapp`.
