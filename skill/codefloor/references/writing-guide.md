# Writing guide

## Node descriptions

1–3 sentences, present tense, facts from the code only:

1. What the module does.
2. What it owns (data, state, a contract) or who calls it.
3. One notable constraint or design decision, if any.

Good: "Owns the booking lifecycle (pending, confirmed, cancelled). Places a short-lived inventory hold, then confirms when a payment.succeeded event arrives."

Avoid: speculation ("probably"), marketing ("powerful"), restating the name ("The booking service is the service for bookings"), file lists, secrets or internal URLs.

## Labels

- Node label: human name, 1–3 words ("Booking service", "Auth context").
- Edge label: what travels on it ("verify token", "bookings", "payment events"). Leave empty for plain imports.

## Flows

- `name`: what the user or system is doing ("Create booking").
- `description`: one sentence with the start and the outcome.
- Step `label`: imperative, 8 words max ("Verify signature").
- Step `detail`: one sentence explaining what happens at that node and why.
- A node may appear more than once; consecutive steps on the same node are fine when something different happens.
