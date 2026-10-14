<p align="center">
  <img src="docs/images/banner.png" alt="SafetyWatch banner: a red shield logo next to the project name on a dark navy background" width="100%" />
</p>

# SafetyWatch

**Community crime reporting, tracking and statistics.** File a report with or without an account, follow it with a tracking ID, and see verified incidents on a list, a map and charts.

[Live Demo](https://safetywatch.arvin.life)

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma_7-4169E1?logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Deployed on Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

## 📸 Screenshots

| Home | Home (mobile) |
|---|---|
| ![Home page with the headline "Contribute to a Safer Community" and buttons to report anonymously or view the crime map](docs/images/home-desktop.png) | <img src="docs/images/home-mobile.png" alt="Home page at phone width, with the navigation collapsed into a menu button" width="260" /> |

| Crime map | Statistics |
|---|---|
| ![Crime map centred on Mumbai with clustered report markers, crime type filters, a standard/satellite switch and a heatmap toggle](docs/images/crime-map-desktop.png) | ![Statistics page with a pie chart of crime types and a bar chart of the top crime locations](docs/images/statistics-desktop.png) |

| Crime reports | Report form |
|---|---|
| ![Paginated list of verified crime reports shown as cards with type, date, description and location](docs/images/crime-reports-desktop.png) | ![First step of the three-step report form: title, crime type, description, date and time, and evidence photos](docs/images/report-form-desktop.png) |

| Track a report | Login |
|---|---|
| ![Track Your Report page with a field for the 16-character tracking ID](docs/images/track-report-desktop.png) | ![Login page with email and password fields and a "Sign in with Google" button](docs/images/login-desktop.png) |

| Admin dashboard |
|---|
| ![Admin dashboard listing active reports with type, title, location, tracking ID, date, status and actions](docs/images/admin-dashboard-desktop.png) |

All screenshots show the demo data created by the seed script.

## ✨ Features

- **Report an incident** in three steps: details, location on a map, review. Signed-in users report under their name; everyone else, or anyone who chooses to, reports anonymously.
- **Evidence photos** (up to three), downscaled in the browser before upload. An optional "Extract Details from Image" button drafts the title, description and crime type from a photo.
- **Tracking ID** for every report, so the reporter can check its status later without an account.
- **Review workflow** for admins: pending → reviewing → verified or rejected → resolved. Admins can search, filter, sort and delete reports.
- **Public views** of verified reports: a paginated list (newest or nearest first), a map with clusters, a heatmap and a satellite layer, and statistics by type, location, month and hour.
- **Personal dashboard** listing your own reports; a report can be edited until an admin starts reviewing it.
- **Sign-in** with email and password or with Google.

## 🛠 Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Server Components, Server Actions), React 19, TypeScript
- PostgreSQL with [Prisma 7](https://www.prisma.io) (`@prisma/adapter-pg`)
- [Better Auth](https://www.better-auth.com) for email/password and Google sign-in
- [Vercel Blob](https://vercel.com/docs/vercel-blob) (private store) for evidence photos
- Gemini (`@google/genai`) for image analysis
- Tailwind CSS 4, Radix UI primitives, lucide-react icons, Motion, Sonner
- React Hook Form and Zod for forms and validation
- Leaflet and React Leaflet (marker clusters, heatmap), Recharts
- OpenStreetMap tiles and Nominatim for maps and address lookup

## 🚀 Getting started

**Prerequisites:** Node.js 20.19 or newer, npm, and a PostgreSQL database.

Clone and install:

```bash
git clone https://github.com/Arvin-Arun-Dcosta/SafetyWatch.git
```

```bash
cd SafetyWatch
```

```bash
npm install
```

Create your local environment file, then fill in the values (see [Environment variables](#-environment-variables)):

```bash
cp .env.example .env.local
```

Create the tables and load the admin account and demo reports:

```bash
npm run db:deploy
```

```bash
npm run db:seed
```

Start the development server at <http://localhost:3000>:

```bash
npm run dev
```

After the first setup, `./start.sh` does all of this in one step: it installs dependencies when needed, starts the local database container if you use one, applies pending migrations and runs the dev server. Pass `--seed` to load the admin account and demo reports as well.

```bash
./start.sh
```

Build for production:

```bash
npm run build
```

Serve the production build:

```bash
npm run start
```

### Local database

Any PostgreSQL works. With Docker:

```bash
docker run -d --name safetywatch-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=safetywatch -p 54329:5432 postgres:17
```

Then set `DATABASE_URL="postgresql://postgres:postgres@localhost:54329/safetywatch"` in `.env.local`.

### Admin account

Nobody can register as an admin. The seed script creates or promotes the account named in `ADMIN_EMAIL`:

- with `ADMIN_PASSWORD` set, the admin signs in with that email and password;
- without it, the admin signs in with Google using that email address.

Run `npm run db:seed` again to change the admin's password; it is safe to re-run.

### Other scripts

| Command | What it does |
|---|---|
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types, then `tsc --noEmit` |
| `npm run db:generate` | Generate the Prisma client (also runs after `npm install`) |
| `npm run db:migrate` | Create and apply a migration during development |
| `npm run db:deploy` | Apply pending migrations |
| `npm run db:seed` | Create the admin and demo data |
| `npm run db:studio` | Open Prisma Studio |

## 🔐 Environment variables

`.env.example` lists every variable. The app refuses to start while a required one is missing and prints which.

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | no | Public URL of the site, without a trailing slash. Used for metadata, `robots.txt`, the sitemap and the auth base URL. Set it to your own URL when you deploy; otherwise production builds default to the live demo's URL. Defaults to `http://localhost:3000` in development. Read at build time |
| `DATABASE_URL` | yes | PostgreSQL connection string (on Neon: the pooled URL, with `sslmode=verify-full`) |
| `DATABASE_URL_UNPOOLED` | no | Direct Neon URL used by the Prisma CLI for migrations. Falls back to `DATABASE_URL` |
| `BETTER_AUTH_SECRET` | yes | Session secret, at least 32 characters (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | no | Overrides the auth base URL. Defaults to `NEXT_PUBLIC_SITE_URL` |
| `GOOGLE_CLIENT_ID` | yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | yes | Google OAuth client secret. Redirect URI: `<site URL>/api/auth/callback/google` |
| `GEMINI_API_KEY` | yes | Server-side key for image analysis |
| `GEMINI_MODEL` | no | Defaults to `gemini-3.5-flash-lite` |
| `BLOB_READ_WRITE_TOKEN` | yes | Read-write token of a **private** Vercel Blob store |
| `APP_TIME_ZONE` | no | IANA time zone for incident times and statistics. Defaults to `Asia/Kolkata` |
| `ADMIN_EMAIL` | seed only | The account the seed script makes an admin |
| `ADMIN_PASSWORD` | seed only, optional | Password for the admin (12+ characters). Without it the admin signs in with Google |

## 📁 Project structure

```
prisma/
  schema.prisma     Database schema
  migrations/       SQL migrations
  seed.ts           Admin account and demo reports
public/             Map marker images and the hero background texture
src/
  app/              Routes (Server Components unless interactive), robots.txt, sitemap
  components/       UI, grouped by feature (report-form, maps, admin, ...)
  lib/              Shared code: env, site URL, auth, session, validation
  server/           Server-only code: report queries and actions, storage, image analysis
docs/images/        README screenshots
```

## 🛡 How access is enforced

- **Roles** live in the database. `role` cannot be set through sign-up or profile updates; only the seed script grants admin.
- **Every mutation** is a server action that checks the session and role and validates its input with Zod. Users can edit only their own pending reports; only admins change a status or delete a report.
- **Public pages** only query verified and resolved reports, and those queries never select the reporter's name or email. Reporter details are shown to the reporter and to admins.
- **Evidence photos** are stored in a private Blob store and served through a route that applies the same visibility rule as the report itself.
- **A tracking ID** shows the status and the reporter's own text for that one report, nothing else.

## ⚠️ Known limitations

- There is no email sending, so there is no email verification, password reset or status notification. Reporters check progress with their tracking ID.
- Anonymous report submission and image analysis are not rate-limited (sign-in and sign-up are).
- Addresses are looked up with the public OpenStreetMap Nominatim service, which has its own usage limits.

## 🌐 Deployment

The [live demo](https://safetywatch.arvin.life) runs on [Vercel](https://vercel.com). To deploy your own copy:

1. Import the repository into Vercel. The Next.js preset needs no custom build settings; `npm install` generates the Prisma client.
2. Create a PostgreSQL database (for example [Neon](https://neon.com)) and a **private** Vercel Blob store, and connect both to the project.
3. Add the required environment variables from the table above, and set `NEXT_PUBLIC_SITE_URL` to your site's URL.
4. In your Google OAuth client, add `<your site URL>/api/auth/callback/google` as an authorised redirect URI.
5. Apply the migrations once against the production database, with its URL in `DATABASE_URL`:

   ```bash
   npm run db:deploy
   ```

   Then create the admin account with `npm run db:seed`. The seed also adds demo reports.

6. Optionally add a custom domain under the project's Domains settings, then deploy.

## 📄 License

Released under the [MIT License](LICENSE). Copyright (c) 2026 Arvin Arun Dcosta.
