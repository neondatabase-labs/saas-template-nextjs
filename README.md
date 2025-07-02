# SaaS Starter Kit (Next.js)

## Setup

### .env file

Create a `.env` file by copying the example `.env.example` file:

```bash
cp .env.example .env
```

### Neon Postgres and Auth

You can either setup your Neon database through the Neon dashboard or through Vercel's database integration. If you're setting up Neon through the Vercel Integration, it will create a new Vercel-managed organization and project for you on neon.tech.

Below are the steps for setting up your Neon database through the Neon dashboard.

#### Neon dashboard

Create a new Neon project on `https://console.neon.tech/` and copy the database URL for the `DATABASE_URL` environment variable.

Next, navigate to the `Auth` tab and enable Neon Auth. Copy-paste the environment variables from the `Configuration` tab into the `.env` file.

```txt
# Neon Auth environment variables for Next.js
NEXT_PUBLIC_STACK_PROJECT_ID=
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=
STACK_SECRET_SERVER_KEY=
```

### Optional: RLS (Row Level Security)

Enable RLS in the Neon dashboard. You have to do this through the Neon dashboard regardless of how you setup your database (Vercel Integration or Neon dashboard).

First, navigate to the `Auth` tab. In the `Configuration` section, click `Claim in Stack Auth`. Set up your Neon Auth project in StackAuth.

In the StackAuth dashboard, navigate to the `Settings` tab. Copy the `JWKS URL`.

Navigate back to the Neon dashboard and navigate to your Neon project > `Settings` > `RLS` > `Setup authentication provider`. Paste the `JWKS URL` into the `JWKS URL` field.

Finally, follow the `Set up Stack Auth with Neon RLS` instructions in the Neon dashboard.

### Drizzle

Run `npm run db:generate` to generate the initial database migration files.

Next, run `npm run db:push` to push the migration files to the database.

If the migration fails, it is likely because you have not enabled RLS in the Neon dashboard. Make sure to follow the `Set up Stack Auth with Neon RLS` instructions in the Neon dashboard.

### Stripe

#### Stripe account and secret key

First, create a new Stripe account or use an existing one on `https://dashboard.stripe.com/`. Enter a sandbox or test mode and create a new test product.

Navigate to the `Developers` settings and `API keys` section. Copy the `Secret key` and paste it into the `.env` file as the `STRIPE_SECRET_KEY` environment variable.

#### Stripe product and price

Create a new product and price in the Stripe dashboard. Copy the `Price ID` and paste it into the `.env` file as the `STRIPE_PRO_PRICE_ID` environment variable.

```txt
STRIPE_PRO_PRICE_ID=
```

Currently, there is only one price (subscription). You can easily extend this setup to include multiple prices by adding them to the `getPlansFlag` function in `lib/stripe/plans.ts`.

#### Stripe webhook listener

Run `npm run dev:stripe` to start the Stripe webhook listener. This will listen for events from Stripe and forward them to the Next.js app. Copy-paste the webhook signing secret into the `.env` file (`STRIPE_WEBHOOK_SECRET`):

```bash
npm run dev:stripe
```

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

The project should now locally via `npm run dev`. You'll still see some errors in the console because you're still missing required environment variables.

### Vercel

Push your code to a new GitHub repository. Then navigate to `https://vercel.com/new` and select your GitHub repository to create a new Vercel project.

The initial deployment will fail because you're still missing required environment variables.

Setup a custom domain or copy the default domain created by Vercel and add it to the trusted domains in either the StackAuth dashboard or the Neon dashboard > `Auth` > `Configuration`.

#### Protection Bypass for Automation

In the Vercel dashboard, navigate to `Settings` > `Deployment Protection` and add a new secret in the `Protection Bypass for Automation` section. Copy-paste the secret into the `.env` file as the `VERCEL_AUTOMATION_BYPASS_SECRET` environment variable. This is required for QStash to work in Preview environments.

```txt
VERCEL_AUTOMATION_BYPASS_SECRET=
```

### Vercel Integration - Upstash QStash

Navigate to the new Vercel project and select the `Storage` tab to setup QStash for background jobs.

Select `Upstash` > `QStash` and create a new QStash instance.

Copy the code snippet displayed in the `QStash` tab into the `.env` file:

```txt
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=
QSTASH_TOKEN=
QSTASH_URL=
```

## Deployment

Once you have the setup complete, you can copy-paste your `.env` file in the Vercel dashboard's `Settings` > `Environment Variables` section and deploy your project.

Make sure to update the `NEXT_PUBLIC_ORIGIN` environment variable to your custom domain for production (instead of `http://localhost:3000`).

## Development

Run the development server, including the Stripe webhook listener:

```bash
npm run dev
```
