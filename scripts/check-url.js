import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCW8weSCRl-_g6f1nrgEockzMao415x1JU",
  authDomain: "zenith-platform-50b72.firebaseapp.com",
  projectId: "zenith-platform-50b72",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const snap = await getDocs(collection(db, "models"));
  const models = snap.docs.map(d => ({id: d.id, ...d.data()}));
  
  const cad = models.filter(m => ["dwg", "dxf"].includes(m.fileType?.toLowerCase()));
  console.log("Found CAD models:", cad.length);
  cad.forEach(c => {
    console.log(`[${c.id}] ${c.title} -> ${c.modelUrl}`);
  });
  process.exit(0);
}

run().catch(console.error);
