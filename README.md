# Neon Auth - Next.js Template App

[Deploy to Vercel](https://vercel.com/new/clone?demo-description=Next.js%20template%20with%20Neon%20Auth%2C%20Stripe%20payments%2C%20Upstash%20KV%2C%20Qstash%20background%20jobs%2C%20and%20shadcn%2Fui%20components&demo-title=Neon%20Auth%20Next.js%20Template&env=NEXT_PUBLIC_STACK_PROJECT_ID,NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,STACK_SECRET_SERVER_KEY,DATABASE_URL,STRIPE_SECRET_KEY,STRIPE_WEBHOOK_SECRET,KV_URL,KV_REST_API_READ_ONLY_TOKEN,KV_REST_API_TOKEN,KV_REST_API_URL,QSTASH_NEXT_SIGNING_KEY,QSTASH_CURRENT_SIGNING_KEY,QSTASH_URL,QSTASH_TOKEN&envDescription=How%20to%20get%20these%20environment%20variables&envLink=https%3A%2F%2Fgithub.com%2Fjacobparis%2Fneon-auth-nextjs-stripe-template%23environment-variables&project-name=neon-auth-nextjs-stripe-template&repository-name=neon-auth-nextjs-stripe-template&repository-url=https%3A%2F%2Fgithub.com%2Fjacobparis%2Fneon-auth-nextjs-stripe-template&from=templates&stores=%5B%7B%22type%22%3A%22postgres%22%7D%2C%7B%22integrationSlug%22%3A%22upstash%22%2C%22type%22%3A%22integration%22%7D%2C%7B%22integrationSlug%22%3A%22upstash%22%2C%22productSlug%22%3A%22upstash-qstash%22%2C%22type%22%3A%22integration%22%7D%5D&skippable-integrations=1)

## Authentication

This app uses NeonAuth and StackAuth for user management.

The StackAuth docs suggest to call `stackServerApp.getUser()` in middleware but that's prohibitively slow: 400ms to each request

Instead, just check the JWT in the cookie as an access token.

Accessing the user in a server component is also prohibitively slow for the same reason, so instead use the React hooks which are cached and won't slow down navigation.

## Updating user info

StackAuth provides two ways to update user information:

- server-side, via `user.setDisplayName()`
- client-side, via `useUser().setDisplayName()`

Unfortunately, neither of these are capable of updating the UI before the network request completes. For that reason, I've moved the StackProvider into a CustomStackProvider function in `/stack.tsx` and `/stack-client.tsx`.

This keeps the user in React state and updates it optimistically when changing any of the profile details, then falling back to the server version after the request completes.

As a simple reproduction, I would expect the following official code to update immediately

```ts
const stack = useStackApp()
const user = stack.useUser()

return (
  <div>
    <p> {user.displayName} </p>
    <input type="text" onBlur={(event) => user.setDisplayName(event.target.value)} />
  </div>
)
```

Replacing `stack.useUser()` wiht the custom `useUser()` implements this expectation.

This also provides an entrypoint to add client side validation to the setDisplayName function, which StackAuth leaves unprotected for users to set up to 100kB of text.

This is not real security as the server endpoint for this remains accessible to the user, so we must trim the displayName at all times before displaying.

## Stripe

```bash
stripe listen --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,customer.subscription.paused,customer.subscription.resumed,customer.subscription.pending_update_applied,customer.subscription.pending_update_expired,customer.subscription.trial_will_end,invoice.paid,invoice.payment_failed,invoice.payment_action_required,invoice.upcoming,invoice.marked_uncollectible,invoice.payment_succeeded,payment_intent.succeeded,payment_intent.payment_failed,payment_intent.canceled \
  --forward-to localhost:3000/api/webhooks/stripe
```

this will give you a webhook signing secret you can pass to .env
