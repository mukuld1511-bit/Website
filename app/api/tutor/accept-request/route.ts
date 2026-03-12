/**
 * app/api/tutor/accept-request/route.ts
 *
 * Called by the tutor's dashboard when they click "Accept" on a lesson request.
 * 1. Validates the caller is the tutor (via Firebase ID token)
 * 2. Updates the tutorRequest status → "accepted"
 * 3. Creates a new chatSession document
 * 4. Writes a system message into the session
 * 5. Writes sessionId back onto the tutorRequest
 * 6. Returns { sessionId } to the client
 *
 * Client usage (from dashboard):
 *   const res = await fetch("/api/tutor/accept-request", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
 *     body: JSON.stringify({ requestId }),
 *   });
 *   const { sessionId } = await res.json();
 *   router.push(`/connect/chat/${sessionId}`);
 */

import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// ── Firebase Admin init ──────────────────────────────────────────────────────
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
    }),
  });
}
const db   = getFirestore();
const auth = getAuth();

// ── Handler ──────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // 1. Verify ID token
    const authHeader = req.headers.get("Authorization") ?? "";
    const idToken    = authHeader.replace("Bearer ", "").trim();
    if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await auth.verifyIdToken(idToken);
    const callerUid = decoded.uid;

    // 2. Parse body
    const { requestId } = await req.json();
    if (!requestId) return NextResponse.json({ error: "requestId required" }, { status: 400 });

    // 3. Fetch tutorRequest
    const reqRef  = db.collection("tutorRequests").doc(requestId);
    const reqSnap = await reqRef.get();
    if (!reqSnap.exists) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    const reqData = reqSnap.data()!;

    // 4. Verify caller is the tutor
    if (reqData.toTutorUserId !== callerUid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 5. Fetch tutor profile to get booking link
    const tutorSnap = await db.collection("tutorProfiles")
      .where("userId", "==", callerUid)
      .limit(1)
      .get();

    const tutorProfile = tutorSnap.empty ? null : tutorSnap.docs[0].data();

    // 6. Fetch student info
    let studentName   = reqData.fromUserName ?? "Student";
    let studentAvatar = reqData.fromUserPhoto ?? "";

    try {
      const studentRecord = await auth.getUser(reqData.fromUserId);
      studentName   = studentRecord.displayName ?? studentName;
      studentAvatar = studentRecord.photoURL    ?? studentAvatar;
    } catch { /* user may not exist in auth */ }

    // 7. Create chatSession
    const sessionRef = db.collection("chatSessions").doc();
    const sessionId  = sessionRef.id;

    await sessionRef.set({
      requestId,
      tutorId:          reqData.toTutorId,
      tutorUserId:      callerUid,
      tutorName:        tutorProfile?.name      ?? "Tutor",
      tutorAvatar:      tutorProfile?.avatar    ?? "",
      tutorColor:       tutorProfile?.color     ?? "#a78bfa",
      tutorBookingLink: tutorProfile?.bookingLink ?? "",
      tutorPlatform:    tutorProfile?.platform   ?? "Calendly",
      studentId:        reqData.fromUserId,
      studentName,
      studentAvatar,
      subject:          reqData.subject,
      status:           "active",
      createdAt:        FieldValue.serverTimestamp(),
    });

    // 8. System message: session opened
    await db
      .collection("chatSessions")
      .doc(sessionId)
      .collection("messages")
      .add({
        senderId:    "system",
        senderName:  "System",
        senderAvatar:"",
        text:        `✅ Session accepted! ${tutorProfile?.name ?? "Your tutor"} is ready to help you with "${reqData.subject}". Say hi and get started!`,
        type:        "system",
        createdAt:   FieldValue.serverTimestamp(),
      });

    // 9. Update tutorRequest → accepted + sessionId
    await reqRef.update({
      status:    "accepted",
      sessionId,
      acceptedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ sessionId }, { status: 200 });

  } catch (err: any) {
    console.error("[accept-request]", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}


/**
 * ────────────────────────────────────────────────────────────────────
 * FIRESTORE SECURITY RULES — add to firestore.rules
 * ────────────────────────────────────────────────────────────────────
 *
 * match /tutorRequests/{reqId} {
 *   allow read:   if request.auth != null &&
 *                    (request.auth.uid == resource.data.fromUserId ||
 *                     request.auth.uid == resource.data.toTutorUserId);
 *   allow create: if request.auth != null;
 *   allow update: if request.auth.uid == resource.data.toTutorUserId;
 * }
 *
 * match /tutorProfiles/{profileId} {
 *   allow read:   if true;
 *   allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
 *   allow update: if request.auth != null && request.auth.uid == resource.data.userId;
 * }
 *
 * match /chatSessions/{sessionId} {
 *   allow read, write: if request.auth != null &&
 *                         (request.auth.uid == resource.data.tutorUserId ||
 *                          request.auth.uid == resource.data.studentId);
 *
 *   match /messages/{msgId} {
 *     allow read:   if request.auth != null &&
 *                      (request.auth.uid == get(/databases/$(database)/documents/chatSessions/$(sessionId)).data.tutorUserId ||
 *                       request.auth.uid == get(/databases/$(database)/documents/chatSessions/$(sessionId)).data.studentId);
 *     allow create: if request.auth != null &&
 *                      (request.auth.uid == get(/databases/$(database)/documents/chatSessions/$(sessionId)).data.tutorUserId ||
 *                       request.auth.uid == get(/databases/$(database)/documents/chatSessions/$(sessionId)).data.studentId) &&
 *                      request.resource.data.senderId == request.auth.uid;
 *   }
 * }
 *
 * ────────────────────────────────────────────────────────────────────
 * FIRESTORE COMPOSITE INDEXES NEEDED (create in Firebase Console)
 * ────────────────────────────────────────────────────────────────────
 *
 * Collection: tutorRequests
 *   fromUserId ASC | createdAt DESC
 *   toTutorUserId ASC | createdAt DESC
 *
 * Collection: chatSessions/{id}/messages
 *   createdAt ASC
 *
 * ────────────────────────────────────────────────────────────────────
 * .env.local additions needed
 * ────────────────────────────────────────────────────────────────────
 *
 * FIREBASE_PROJECT_ID=zenith-platform-50b72
 * FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@zenith-platform-50b72.iam.gserviceaccount.com
 * FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
 *
 * Get these from Firebase Console → Project Settings → Service Accounts → Generate New Private Key
 */
