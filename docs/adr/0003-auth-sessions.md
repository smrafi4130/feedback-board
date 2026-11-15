# ADR-0003: Session cookies with server-side session rows

**Status:** Accepted

## Decision

- Passwords hashed with **scrypt** from the Node standard library (salted, memory-hard, no native dependency).
- Login creates a random session token stored in a `sessions` table and set as an **httpOnly, SameSite=Lax, Secure-in-production** cookie. The cookie carries no user data, only the opaque token.
- `getCurrentUser()` resolves the cookie to a user and is wrapped in React `cache()` so repeated calls in one request hit the database once.
- Authorization (e.g. admin-only status changes) is enforced **in the server action**, never trusted from the client; the UI only hides controls the user cannot use.

## Consequences

- An XSS payload cannot read the token from JavaScript (httpOnly), and sessions can be revoked by deleting the row.
- Trade-off: each authenticated request does a session lookup. For higher traffic, cache sessions or use signed, short-lived tokens with a refresh — out of scope here.
