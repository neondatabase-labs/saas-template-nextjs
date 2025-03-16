# Neon Auth - Next.js Template App

## Authentication

This app uses NeonAuth and StackAuth for user management.

The StackAuth docs suggest to call `stackServerApp.getUser()` in middleware but that's prohibitively slow: 400ms to each request

Instead, just check the JWT in the cookie as an access token.

Accessing the user in a server component is also prohibitively slow for the same reason, so instead use the React hooks which are cached and won't slow down navigation.
