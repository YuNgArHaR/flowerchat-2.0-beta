import { auth, db } from "./config.js";
import { loadChats } from "./loadChats.js";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { openModalForGroup, closeModalForGroup } from "./modalForGroup.js";

const registerButton = document.getElementById("register-btn");
const loginButton = document.getElementById("login-btn");
const logoutButton = document.getElementById("logout-btn");

registerButton.addEventListener("click", register);
loginButton.addEventListener("click", login);
logoutButton.addEventListener("click", logout);

async function register() {
  const emailInput = document.getElementById("email").value;
  const pass = document.getElementById("pass").value;
  const usernameInput = document.getElementById("username").value;

  let userCredential;

  try {
    userCredential = await createUserWithEmailAndPassword(
      auth,
      emailInput,
      pass
    );
  } catch (error) {
    alert(error);
  }

  const data = {
    id: userCredential.user.uid,
    email: emailInput,
    username: usernameInput,
    pfp: "https://firebasestorage.googleapis.com/v0/b/ch4t-e60c8.appspot.com/o/avatar.png?alt=media&token=5be0e341-6d30-4572-8145-dc6868eb44b1",
    status: "Online",
  };

  const newUserDoc = doc(db, `users/${userCredential.user.uid}`);
  try {
    const newDoc = await setDoc(newUserDoc, data);
    alert(`new user: ${userCredential.user.email}`);
  } catch (error) {
    console.log(error);
  }
}

async function login() {
  const emailInput = document.getElementById("login-email").value;
  const pass = document.getElementById("login-pass").value;

  try {
    userCredential = await signInWithEmailAndPassword(auth, emailInput, pass);
  } catch (error) {
    alert(error);
  }
}

async function logout() {
  await signOut(auth);
}

async function getUserData(userID) {
  try {
    const collectionRef = collection(db, "users");
    const docRef = doc(collectionRef, userID);
    if (document.visibilityState === "visible") {
      await updateDoc(docRef, { status: "Online" });
    }
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    } else {
      console.log("user does not exist!");
    }
  } catch (error) {
    console.log(error);
  }
}

onAuthStateChanged(auth, (user) => {
  if (user != null) {
    getUserData(user.uid).then((userData) => {
      console.log("logged in");
      document.getElementById("tab-container-id").style.display = "none";
      document.getElementById("content").style.display = "block";
      document.getElementById(
        "welcome-txt"
      ).innerHTML = `Добро пожаловать, ${userData["username"]}! (${userData["status"]})`;
      document.getElementById("splash-screen").style.display = "none";
      loadChats(user.uid);
      document.addEventListener("visibilitychange", () =>
        changeStatus(user.uid)
      );
      window.addEventListener("beforeunload", () => changeStatus(user.uid));
      document
        .getElementById("openGroupAddModalButton")
        .addEventListener("click", () => openModalForGroup(user.uid));
    });
    document
      .getElementById(`closeModalButton-for-group`)
      .addEventListener("click", closeModalForGroup);
  } else {
    console.log("no user");
    document.getElementById("content").style.display = "none";
    document.getElementById("tab-container-id").style.display = "flex";
    document.getElementById("splash-screen").style.display = "none";
  }
});

async function changeStatus(userId) {
  const collectionRef = collection(db, "users");
  const docRef = doc(collectionRef, userId);
  if (document.visibilityState === "visible") {
    try {
      await updateDoc(docRef, { status: "Online" });
    } catch (error) {
      console.log(error);
    }
  } else {
    try {
      await updateDoc(docRef, { status: "Offline" });
    } catch (error) {
      console.log(error);
    }
  }
}
