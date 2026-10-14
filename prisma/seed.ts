/**
 * Seeds one admin account and a set of realistic demo reports.
 *
 *   npm run db:seed
 *
 * Environment:
 *   DATABASE_URL    required
 *   ADMIN_EMAIL     required – the account that becomes the admin
 *   ADMIN_PASSWORD  optional – sets (or resets) the admin's password login.
 *                   Without it the admin signs in with Google using
 *                   ADMIN_EMAIL.
 *
 * The script is idempotent: demo rows are upserted by fixed keys.
 */
import { createHash } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";

import { PrismaClient } from "../src/generated/prisma/client";
import type { CrimeType, ReportStatus } from "../src/generated/prisma/enums";

for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // File is optional.
  }
}

const seedEnv = z
  .object({
    DATABASE_URL: z.string({ error: "DATABASE_URL is required" }).min(1),
    ADMIN_EMAIL: z.email({ error: "ADMIN_EMAIL must be a valid email address" }),
    ADMIN_PASSWORD: z
      .string()
      .min(12, { error: "ADMIN_PASSWORD must be at least 12 characters" })
      .max(128)
      .optional(),
  })
  .safeParse({
    DATABASE_URL: process.env.DATABASE_URL || undefined,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || undefined,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || undefined,
  });

if (!seedEnv.success) {
  console.error("Cannot seed:\n" + seedEnv.error.issues.map((i) => `  - ${i.message}`).join("\n"));
  process.exit(1);
}

const { DATABASE_URL, ADMIN_PASSWORD } = seedEnv.data;
const ADMIN_EMAIL = seedEnv.data.ADMIN_EMAIL.toLowerCase();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: DATABASE_URL }),
});

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

async function seedAdmin() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  const password = ADMIN_PASSWORD ? await hashPassword(ADMIN_PASSWORD) : null;

  if (!existing) {
    // emailVerified is set because the operator vouches for ADMIN_EMAIL. It is
    // also what lets a later Google sign-in with this address link to the row.
    const user = await prisma.user.create({
      data: { name: "SafetyWatch Admin", email: ADMIN_EMAIL, emailVerified: true, role: "ADMIN" },
    });
    if (password) {
      await prisma.account.create({
        // "credential" + the user id is Better Auth's convention for password logins.
        data: { providerId: "credential", accountId: user.id, userId: user.id, password },
      });
    }
    console.log(
      password
        ? `Created admin ${ADMIN_EMAIL} with a password login.`
        : `Created admin ${ADMIN_EMAIL}. Sign in with Google using that address.`,
    );
    return;
  }

  if (password) {
    // Setting the password proves ownership; existing sessions are dropped so
    // anyone else who held the account is signed out.
    await prisma.$transaction([
      prisma.account.upsert({
        where: { providerId_accountId: { providerId: "credential", accountId: existing.id } },
        create: { providerId: "credential", accountId: existing.id, userId: existing.id, password },
        update: { password },
      }),
      prisma.session.deleteMany({ where: { userId: existing.id } }),
      prisma.user.update({
        where: { id: existing.id },
        data: { role: "ADMIN", emailVerified: true },
      }),
    ]);
    console.log(`Promoted ${ADMIN_EMAIL} to admin and set its password.`);
    return;
  }

  if (!existing.emailVerified) {
    // An unverified password-only account could have been registered by
    // anyone, so it is never promoted silently.
    throw new Error(
      `${ADMIN_EMAIL} already exists with an unverified email. Set ADMIN_PASSWORD to take ` +
        "ownership of it, then run the seed again.",
    );
  }
  await prisma.user.update({ where: { id: existing.id }, data: { role: "ADMIN" } });
  console.log(`Promoted ${ADMIN_EMAIL} to admin.`);
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

/** Demo reporters. They have no login; they only own demo reports. */
const demoUsers = [
  { id: "demo-user-priya", name: "Priya Sharma", email: "priya.sharma@safetywatch.example" },
  { id: "demo-user-rahul", name: "Rahul Mehta", email: "rahul.mehta@safetywatch.example" },
  { id: "demo-user-ananya", name: "Ananya Iyer", email: "ananya.iyer@safetywatch.example" },
];

const places = [
  { address: "Station Road, Thane West, Thane, Maharashtra, 400601, India", city: "Thane", lat: 19.186, lng: 72.975 },
  { address: "Ghodbunder Road, Kasarvadavali, Thane, Maharashtra, 400615, India", city: "Thane", lat: 19.264, lng: 72.967 },
  { address: "Eastern Express Highway, Majiwada, Thane, Maharashtra, 400606, India", city: "Thane", lat: 19.2088, lng: 72.9716 },
  { address: "Linking Road, Bandra West, Mumbai, Maharashtra, 400050, India", city: "Mumbai", lat: 19.0607, lng: 72.8362 },
  { address: "Dadar Station, Dadar East, Mumbai, Maharashtra, 400014, India", city: "Mumbai", lat: 19.0186, lng: 72.8446 },
  { address: "Marine Drive, Churchgate, Mumbai, Maharashtra, 400020, India", city: "Mumbai", lat: 18.944, lng: 72.8231 },
  { address: "Andheri Kurla Road, Andheri East, Mumbai, Maharashtra, 400059, India", city: "Mumbai", lat: 19.1136, lng: 72.8697 },
  { address: "Powai Lake Promenade, Powai, Mumbai, Maharashtra, 400076, India", city: "Mumbai", lat: 19.1273, lng: 72.905 },
  { address: "Colaba Causeway, Colaba, Mumbai, Maharashtra, 400005, India", city: "Mumbai", lat: 18.915, lng: 72.8258 },
  { address: "LBS Marg, Kurla West, Mumbai, Maharashtra, 400070, India", city: "Mumbai", lat: 19.0726, lng: 72.8826 },
  { address: "SV Road, Borivali West, Mumbai, Maharashtra, 400092, India", city: "Mumbai", lat: 19.2307, lng: 72.8567 },
  { address: "Sector 17, Vashi, Navi Mumbai, Maharashtra, 400703, India", city: "Navi Mumbai", lat: 19.0771, lng: 72.9986 },
  { address: "Palm Beach Road, Nerul, Navi Mumbai, Maharashtra, 400706, India", city: "Navi Mumbai", lat: 19.033, lng: 73.0297 },
  { address: "Sector 7, Kharghar, Navi Mumbai, Maharashtra, 410210, India", city: "Navi Mumbai", lat: 19.0473, lng: 73.0699 },
  { address: "Fergusson College Road, Shivajinagar, Pune, Maharashtra, 411004, India", city: "Pune", lat: 18.5236, lng: 73.841 },
  { address: "MG Road, Camp, Pune, Maharashtra, 411001, India", city: "Pune", lat: 18.5158, lng: 73.878 },
  { address: "Hinjawadi Phase 1, Pune, Maharashtra, 411057, India", city: "Pune", lat: 18.5913, lng: 73.7389 },
  { address: "Station Road, Kalyan West, Kalyan, Maharashtra, 421301, India", city: "Kalyan", lat: 19.235, lng: 73.1305 },
  { address: "Manpada Road, Dombivli East, Dombivli, Maharashtra, 421201, India", city: "Dombivli", lat: 19.2167, lng: 73.086 },
  { address: "Mira Road East, Mira Bhayandar, Maharashtra, 401107, India", city: "Mira Bhayandar", lat: 19.2813, lng: 72.8686 },
];

const incidents: { crimeType: CrimeType; title: string; description: string }[] = [
  {
    crimeType: "THEFT",
    title: "Mobile phone snatched by two men on a motorcycle",
    description:
      "Two men on a black motorcycle slowed down beside me and the pillion rider grabbed my phone while I was on a call. They rode off towards the main junction. Neither was wearing a helmet and the number plate was partly covered.",
  },
  {
    crimeType: "THEFT",
    title: "Wallet stolen in a crowded local train",
    description:
      "My wallet was taken from my back pocket while boarding the evening train. I noticed a man pushing unusually hard at the door just before the train left. The wallet had my ID cards and around two thousand rupees.",
  },
  {
    crimeType: "THEFT",
    title: "Bicycle stolen from the society parking area",
    description:
      "A locked grey mountain bike was taken from the stilt parking overnight. The cable lock was cut and left behind. The security guard says the side gate was open for a delivery around midnight.",
  },
  {
    crimeType: "THEFT",
    title: "Laptop bag taken from a parked car",
    description:
      "The rear window of my car was broken and a laptop bag was taken from the back seat while I was inside the restaurant for about forty minutes. Two other cars in the same lane had broken windows as well.",
  },
  {
    crimeType: "BURGLARY",
    title: "Flat broken into while the family was away",
    description:
      "We returned from a weekend trip to find the main door latch forced open. Cupboards were emptied and gold jewellery and some cash are missing. Neighbours heard drilling noises on Saturday afternoon but assumed it was renovation work.",
  },
  {
    crimeType: "BURGLARY",
    title: "Shop shutter forced open overnight",
    description:
      "The shutter lock of a mobile accessories shop was cut during the night. Stock from the display counter and the cash drawer were cleared out. The CCTV unit inside the shop was also removed.",
  },
  {
    crimeType: "BURGLARY",
    title: "Attempted break-in through a kitchen window",
    description:
      "Around three in the morning someone tried to remove the grille of our ground-floor kitchen window. They ran when the lights came on. The grille is bent and there are tool marks on the frame.",
  },
  {
    crimeType: "ASSAULT",
    title: "Man assaulted during a parking dispute",
    description:
      "An argument over a parking space turned violent and one driver hit the other with a steering lock. The injured man was bleeding from the forehead and was taken to hospital by bystanders. The attacker left in a white hatchback.",
  },
  {
    crimeType: "ASSAULT",
    title: "Delivery rider beaten by a group outside a restaurant",
    description:
      "Four or five men surrounded a food delivery rider and punched him repeatedly after he asked them to move their bikes. He was left on the pavement with a swollen face. Staff from the restaurant witnessed the whole incident.",
  },
  {
    crimeType: "ASSAULT",
    title: "Woman harassed and pushed near the bus stop",
    description:
      "A man followed a woman from the bus stop, shouted at her and pushed her to the ground when she tried to walk away. He fled when shopkeepers intervened. She had a scraped elbow and was badly shaken.",
  },
  {
    crimeType: "FRAUD",
    title: "Fake KYC call emptied a savings account",
    description:
      "A caller claiming to be from the bank said my account would be frozen unless I updated my KYC. He sent a link and asked me to install a screen-sharing app. Within ten minutes three transfers were made from my account.",
  },
  {
    crimeType: "FRAUD",
    title: "Advance rent paid for a flat that does not exist",
    description:
      "I paid a token amount and one month's rent to a person who advertised a flat online. He kept delaying the visit and has now switched off his phone. The address in the listing turns out to be a commercial building.",
  },
  {
    crimeType: "FRAUD",
    title: "QR code scam at a street-side shop",
    description:
      "Someone pasted a different QR code sticker over the shop's payment code. Customers' payments were going to an unknown account for at least two days before the owner noticed the mismatch in his statements.",
  },
  {
    crimeType: "VANDALISM",
    title: "Parked cars scratched along the whole lane",
    description:
      "At least six cars parked on the lane have deep scratches along one side, apparently made with a key or a nail. It seems to have happened late at night. Residents say this is the second time this month.",
  },
  {
    crimeType: "VANDALISM",
    title: "Bus shelter glass smashed",
    description:
      "All three glass panels of the bus shelter were smashed and broken glass is spread across the footpath. A group of young men was seen throwing stones from the opposite side of the road shortly before.",
  },
  {
    crimeType: "VANDALISM",
    title: "Graffiti sprayed on a school compound wall",
    description:
      "Abusive slogans were spray-painted in red across the newly painted compound wall of the school. The paint is still fresh. The watchman reports seeing two people leave on a scooter at around five in the morning.",
  },
  {
    crimeType: "SUSPICIOUS_ACTIVITY",
    title: "Unknown men photographing houses in the lane",
    description:
      "Two men in a grey sedan have been driving slowly through the lane for three evenings in a row, stopping to photograph gates and entrances. When a resident asked what they were doing they drove away without answering.",
  },
  {
    crimeType: "SUSPICIOUS_ACTIVITY",
    title: "Unattended bag left near the station entrance",
    description:
      "A large black duffel bag has been lying beside the ticket counter since morning. Nobody nearby claims it. Station staff have been informed but the bag is still there and commuters are walking around it.",
  },
  {
    crimeType: "SUSPICIOUS_ACTIVITY",
    title: "Person trying door handles of parked cars",
    description:
      "A man in a dark hooded jacket was walking along the row of parked cars after midnight, trying each door handle. He moved on quickly when a dog started barking. This was captured on a building camera.",
  },
  {
    crimeType: "OTHER",
    title: "Illegal dumping of construction debris at night",
    description:
      "A tipper truck has been unloading construction debris on the open plot next to the nullah every night this week. The pile now blocks part of the road and the drain. The truck has no visible registration number.",
  },
  {
    crimeType: "OTHER",
    title: "Stray cattle causing accidents on the service road",
    description:
      "A group of cattle is left on the service road every evening and two motorcyclists have already been injured after hitting them in the dark. The owner is known locally but ignores requests to move them.",
  },
];

/** Deterministic pseudo-random numbers so re-seeding produces the same rows. */
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function pickStatus(roll: number): ReportStatus {
  if (roll < 0.52) return "VERIFIED";
  if (roll < 0.72) return "RESOLVED";
  if (roll < 0.84) return "PENDING";
  if (roll < 0.93) return "REVIEWING";
  return "REJECTED";
}

/** Incidents cluster in the evening and late night, as real reports tend to. */
function pickHour(roll: number): number {
  const hours = [0, 1, 2, 3, 7, 8, 9, 11, 13, 15, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23];
  return hours[Math.floor(roll * hours.length)];
}

async function seedDemoData() {
  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { id: user.id },
      create: { ...user, emailVerified: true },
      update: { name: user.name },
    });
  }

  const random = createRandom(20261011);
  const now = Date.now();
  const total = 64;

  for (let i = 0; i < total; i += 1) {
    const incident = incidents[i % incidents.length];
    const place = places[Math.floor(random() * places.length)];
    const status = pickStatus(random());
    const isAnonymous = random() < 0.35;
    const daysAgo = Math.floor(random() * 240) + 1;

    const incidentAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
    // Seed hours are chosen as India time (UTC+5:30).
    incidentAt.setUTCHours(pickHour(random()), Math.floor(random() * 4) * 15, 0, 0);
    incidentAt.setTime(incidentAt.getTime() - 5.5 * 60 * 60 * 1000);

    // Reports are filed between 1 and 30 hours after the incident.
    const createdAt = new Date(
      Math.min(now, incidentAt.getTime() + (1 + Math.floor(random() * 30)) * 60 * 60 * 1000),
    );

    const trackingId = createHash("sha256").update(`safetywatch-demo-${i}`).digest("hex").slice(0, 16);
    const data = {
      title: incident.title,
      description: incident.description,
      crimeType: incident.crimeType,
      status,
      location: place.address,
      city: place.city,
      // Jitter by up to ~400 m so markers do not stack exactly.
      latitude: Number((place.lat + (random() - 0.5) * 0.008).toFixed(6)),
      longitude: Number((place.lng + (random() - 0.5) * 0.008).toFixed(6)),
      incidentAt,
      isAnonymous,
      userId: isAnonymous ? null : demoUsers[i % demoUsers.length].id,
      actionDetails:
        status === "RESOLVED"
          ? "Local police station informed; case closed after follow-up with the reporter."
          : status === "REJECTED"
            ? "Could not be verified: duplicate of an earlier report."
            : null,
      createdAt,
    };

    await prisma.report.upsert({ where: { trackingId }, create: { trackingId, ...data }, update: data });
  }

  console.log(`Seeded ${demoUsers.length} demo reporters and ${total} demo reports.`);
}

async function main() {
  await seedAdmin();
  await seedDemoData();
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
