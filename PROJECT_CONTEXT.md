# SYNTHE — Full Project Context (For AI Assistants)

## What Is This?
**Synthe** is a full-stack web platform for 3D designers, AR/VR developers, and AutoCAD engineers.
It acts as a marketplace + social platform where creators can upload, sell, and showcase their work.
Live URL: **https://synthe-nu.vercel.app**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Auth | Firebase Authentication |
| Database | Firebase Firestore (all metadata, user records, chat messages) |
| File Storage (large) | **Supabase Storage** (models bucket + thumbnails bucket — public) |
| File Storage (profiles) | Cloudinary (profile images only) |
| Payments | Razorpay |
| Hosting | Vercel (Hobby plan) |
| 3D Viewer | Three.js + three-stdlib (GLTFLoader, OBJLoader, OrbitControls) |

---

## Key Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://xmzkuyhltvoiummebxxm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<JWT anon key from Supabase dashboard>
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dq5mkuj9y
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=zenith-cloud
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_SQmHdHYmCoWkBT
RAZORPAY_KEY_SECRET=<server-side only>
```
Firebase config is hardcoded in `lib/firebase.ts`.

---

## Project Structure

```
app/
  page.tsx                  # Home page — hero, stats, models carousel
  upload/page.tsx           # Upload page (3D models, AR/VR builds) → Supabase
  gallery/
    page.tsx                # Gallery listing (3D, AR, VR tabs + filter)
    [modelId]/page.tsx      # Model detail page — 3D viewer, comments, purchase
  autocad/page.tsx          # AutoCAD models gallery
  connect/page.tsx          # Developers marketplace
  developer/[id]/page.tsx   # Individual developer profile
  requests/
    open/page.tsx           # Browse open project requests
    post/page.tsx           # Post a new project request
  project-chat/[chatId]/    # Real-time project negotiation chat
  dashboard/
    admin/page.tsx          # Admin panel (models, users, applications, certs)
    user/page.tsx           # Client dashboard
    developer/page.tsx      # Developer dashboard
  profile/page.tsx          # Edit profile (uses Cloudinary for avatar)
  certification/page.tsx    # Apply for certification badge
  gyop/page.tsx             # GYOP feature page
  collaborators/page.tsx    # Collaborators showcase page
  join/                     # Join as developer flow
  login/ signup/            # Auth pages

lib/
  firebase.ts               # Firebase init (Auth, Firestore, Storage)
  supabase.ts               # Supabase client init (for file storage)
  cloudinary.ts             # Cloudinary upload helper (profile images only)
  razorpay.ts               # Razorpay payment initiator
  checkAccess.ts            # Access control helper for paid models

app/components/
  Navbar.tsx                # Top navigation bar
  Footer.tsx                # Footer
  gallery/
    UploadModel.tsx         # Quick upload modal in gallery page
```

---

## Key Features

### 1. Upload System
- **Route:** `/upload`
- Supports: **3D Models** (GLB, GLTF, OBJ, FBX, DWG, DXF up to 500MB) and **AR/VR Builds** (ZIP up to 2GB)
- Files stored in **Supabase Storage** (`models` bucket for files, `thumbnails` bucket for images)
- Metadata stored in **Firebase Firestore** `models` collection
- Supports free or paid listings with Razorpay monetisation

### 2. Gallery
- Route: `/gallery`
- Multi-tab: 3D Models | AR Builds | VR Builds
- In-browser **3D viewer** using Three.js (GLB/GLTF/OBJ supported)
- Comments system, Like/views counter, Download tracking
- Paid model access gated via Razorpay purchase

### 3. Developer Connect
- Route: `/connect`
- Browse verified developers
- Chat / Hire / Book Tutoring sessions
- Project requests marketplace

### 4. Admin Panel
- Route: `/dashboard/admin`
- Manage models (view/delete), users (change roles), developer applications, certifications
- Live stats: total models, users, pending actions

### 5. Payments
- Razorpay integration for model purchases and project funding
- 15% platform fee + 2% Razorpay fee applied
- `api/verify-payment/route.ts` handles signature verification server-side

### 6. Authentication
- Firebase Auth (Email/Password + Google)
- Roles: `user`, `developer`, `admin` stored in Firestore `users` collection

---

## Firestore Collections

| Collection | Description |
|---|---|
| `models` | All uploaded 3D models, AR/VR builds |
| `users` | User profiles, roles, stats |
| `developerApplications` | Applications to join as developer |
| `certificationRequests` | Certification badge requests |
| `projectRequests` | Open project requests from clients |
| `projectChats` | Real-time project chat rooms |
| `purchases` | Model purchase records |

---

## Current Issues Being Fixed (as of March 2026)

1. **Supabase upload failing** — The `anon` key in `.env.local` is currently a `sb_publishable_...` format key (new Supabase format). The correct key is a **JWT `eyJ...` anon key** from Supabase Dashboard → Settings → API → "anon public". Once this is updated + Vercel env vars updated + redeployed, uploads will work fully.

2. **Vercel deployment stuck** — A Vercel deployment got stuck in "Initializing" blocking new code from going live. Solution: Cancel it in Vercel Dashboard → Deployments.

3. **Downloads** — Download URLs point to Supabase public URLs. The download button in `gallery/[modelId]/page.tsx` now handles both Supabase and legacy Cloudinary URLs.

---

## Design System
- Light theme throughout (white/gray-50 backgrounds)
- Tailwind CSS utility classes
- Inter/system font
- Blue-600 as primary accent colour
- Rounded corners (`rounded-2xl`, `rounded-xl`) everywhere
- Subtle `shadow-sm` + `border border-gray-200` cards

---

## Deployment
- Pushed to GitHub (`main` branch) → auto-deployed on Vercel
- Environment variables must be set in Vercel Project Settings → Environment Variables (`.env.local` is not pushed to GitHub)
