# PlacementTutor

A full-stack mentorship booking platform where students book 1:1 sessions with verified industry mentors — pick a slot, pay securely, get a meeting link.

**Live:** https://placement-tutor-gamma.vercel.app

### Demo accounts
| Role | Email | Password |
|---|---|---|
| Student | student@demo.com | student123 |
| Mentor | mentor@test.com | mentor123 |
| Admin | admin@pttutor.com | admin123 |

Payments run in Razorpay **test mode** — use card `5267 3181 8797 5449`, CVV `123`, expiry `12/27`, OTP `1111`.

---

## Stack
**Frontend:** React (Vite), Tailwind CSS, Framer Motion — deployed on Vercel
**Backend:** Node.js, Express, Mongoose — deployed on Render
**Database:** MongoDB Atlas
**Other:** JWT auth, bcrypt, Razorpay, Cloudinary, Google OAuth

## Features

**Authentication** — dual login (email + password, or email OTP), Google sign-in, JWT sessions, and role-based access across three roles: student, mentor, admin.

**Atomic slot booking** — mentors define an availability window which is split into 15/30/60-minute bookable slots. Booking uses a single `findOneAndUpdate` to lock a slot for 7 minutes, so two students racing for the same slot can never both win. Expired locks are stolen lazily rather than swept by a cron job.

**Payments** — Razorpay checkout with server-side HMAC signature verification before a booking is confirmed. Abandoned payments release the slot automatically.

**Mentor verification** — 4-step onboarding wizard with photo and document uploads to Cloudinary, followed by an admin approval queue. Approved mentors accept terms once, then reach their dashboard; rejected mentors can resubmit.

**Cancellation** — students can cancel up to 10 minutes before a session; the slot returns to the pool and the mentor's earnings are reversed.

**Privacy** — mentor contact details are masked publicly and unlocked only for students with a confirmed booking.

## Engineering notes

**A production index bug.** Bookings had a plain unique index on `slot`, which seemed correct until the cancellation feature shipped: a cancelled booking still occupied the index, so nobody could rebook that slot (`E11000`). Fixed with a partial unique index scoped to confirmed bookings only, migrated live:

```js
bookingSchema.index(
  { slot: 1 },
  { unique: true, partialFilterExpression: { status: "confirmed" } }
);
```

**Ghost accounts from an untrimmed email.** The OTP endpoint doubled as signup, so an email with a trailing space created a second account that looked identical to the first in the database. Fixed by trimming and lowercasing at both the schema and controller level, and by separating sign-in intent from signup intent so unknown emails now return a clear error instead of silently creating a user.

**Mobile scroll performance.** The animated background was transitioning `background-position` on three full-screen gradients, repainting the entire viewport every frame. Scoping the animation and backdrop blur to desktop only made mobile scrolling smooth.

## Running locally

```bash
# server
cd server && npm install && npm run dev   # :5000

# client
cd client && npm install && npm run dev   # :5173
```

`server/.env` needs: `MONGO_URI`, `JWT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `CLOUDINARY_*`, `CLIENT_URL`.
