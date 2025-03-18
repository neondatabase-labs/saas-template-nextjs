# Neon Auth - Next.js Template App

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
