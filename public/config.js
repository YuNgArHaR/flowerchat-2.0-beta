import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBs2C3XR20o_Nas2TJOGBxs13vCPtR6_30",
  authDomain: "ch4t-e60c8.firebaseapp.com",
  projectId: "ch4t-e60c8",
  storageBucket: "ch4t-e60c8.appspot.com",
  messagingSenderId: "586669327747",
  appId: "1:586669327747:web:ac1331ae0949340aaae2b6",
};

const app = initializeApp(firebaseConfig);

const db = getFirestore();
const auth = getAuth(app);
const storage = getStorage();

export { auth, db, storage };
