# SaaS Starter Kit (Next.js)

## Setup

### .env file

Create a `.env` file by copying the example `.env.example` file:

```bash
cp .env.example .env
```

### Neon Postgres and Auth
 
You can either setup your Neon database through the Neon dashboard or through Vercel's database integration.

#### Neon dashboard

Create a new Neon project on `https://console.neon.tech/` and copy the database URL for the `DATABASE_URL` environment variable.

Next, navigate to the `Auth` tab and enable Neon Auth. Copy-paste the environment variables from the `Configuration` tab into the `.env` file.

```txt
# Neon Auth environment variables for Next.js
NEXT_PUBLIC_STACK_PROJECT_ID=
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=
STACK_SECRET_SERVER_KEY=
```

### RLS (Row Level Security)

Enable RLS in the Neon dashboard. You have to do this through the Neon dashboard regardless of how you setup your database.

First, navigate to the `Auth` tab. In the `Configuration` section, click `Claim in Stack Auth`. Set up your Neon Auth project in StackAuth.

In the StackAuth dashboard, navigate to the `Settings` tab. Copy the `JWKS URL`.

Navigate back to the Neon dashboard and navigate to your Neon project > `Settings` > `RLS` > `Setup authentication provider`. Paste the `JWKS URL` into the `JWKS URL` field. 

Finally, follow the `Set up Stack Auth with Neon RLS` instructions in the Neon dashboard.

### Drizzle

Run `npm run db:generate` to generate the initial database migration files.

Next, run `npm run db:push` to push the migration files to the database.

### Stripe

#### Stripe CLI

Install and configure the Stripe CLI:

```bash
brew install stripe/stripe-cli/stripe
stripe login
```

Find more details in the [Stripe docs](https://docs.stripe.com/stripe-cli).

#### Stripe webhook listener

Run `npm run dev:stripe` to start the Stripe webhook listener. This will listen for events from Stripe and forward them to the Next.js app. Copy-paste the webhook signing secret into the `.env` file (`STRIPE_WEBHOOK_SECRET`):

```bash
npm run dev:stripe
```

Note: `npm run dev:stripe` is part of the `npm run dev` setup but you only have to retrieve the webhook signing secret once.
