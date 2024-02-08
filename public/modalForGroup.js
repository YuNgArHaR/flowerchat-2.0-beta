import { auth, db, storage } from "./config.js";
import {
  query,
  orderBy,
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  limit,
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { generateRandomString } from "./generateRandomString.js";

async function openModalForGroup(userId) {
  const modal = document.getElementById(`myModal-for-group`);
  let modalContent = modal.querySelector(".modal-content");
  let oldModalContent = modalContent.querySelector("#list-of-users");
  if (oldModalContent) {
    modalContent.removeChild(oldModalContent);
  }
  let chatsDiv = document.createElement("div");
  chatsDiv.setAttribute("id", "list-of-users");
  console.log("opened");
  const chatsCollectionRef = collection(db, `users/${userId}/chats`);
  const sortedByDate = query(chatsCollectionRef, orderBy("date", "desc"));
  let snapshot = await getDocs(sortedByDate);
  let i = 0;
  let maxDocs = snapshot.docs.length;
  snapshot.forEach((chat) => {
    let friendsDataRef = doc(db, `users/${chat.id}`);

    getDoc(friendsDataRef).then((friendDoc) => {
      if (friendDoc.exists()) {
        let friendData = friendDoc.data();
        let chatId = chat.id;
        let friendPfp = friendData.pfp;
        let friendName = friendData.username;
        let friendStatus = friendData.status;
        const chatElement = document.createElement("div");
        chatElement.classList.add("chat-item");
        chatElement.setAttribute("id", `chat-el-${chatId}`);

        const pfpElement = document.createElement("div");
        pfpElement.classList.add("friend-pfp");

        const pfp = document.createElement("img");
        pfp.src = friendPfp;
        pfpElement.appendChild(pfp);
        chatElement.appendChild(pfpElement);

        const chatInfoElement = document.createElement("div");
        chatInfoElement.classList.add("chat-info");

        const chatHeaderElement = document.createElement("div");
        chatHeaderElement.classList.add("chat-header");

        const friendNameElement = document.createElement("p");
        friendNameElement.classList.add("friend-name");

        friendNameElement.textContent = friendName;

        chatHeaderElement.appendChild(friendNameElement);

        chatInfoElement.appendChild(chatHeaderElement);

        const chatTextElement = document.createElement("div");
        chatTextElement.classList.add("chat-text");

        const lastMessageElement = document.createElement("p");
        lastMessageElement.classList.add("chats-last-message");
        lastMessageElement.textContent = friendStatus;
        const checkbox = document.createElement("input");
        checkbox.id = "myCheckbox";
        checkbox.value = `${chatId}`;
        checkbox.type = "checkbox";
        checkbox.addEventListener("change", changeButton);
        chatTextElement.appendChild(lastMessageElement);
        chatInfoElement.appendChild(chatTextElement);

        chatElement.appendChild(chatInfoElement);
        chatElement.appendChild(checkbox);
        chatsDiv.appendChild(chatElement);
      }
    });

    i++;
    if (i === maxDocs) {
      modalContent.appendChild(chatsDiv);
      modal.style.display = "block";
    }
  });
  document
    .getElementById(`closeModalButton-for-group`)
    .addEventListener("click", closeModalForGroup);
  document
    .getElementById("create-group-button")
    .addEventListener("click", () => createGroup(userId));
}

// Функция для закрытия модального окна
function closeModalForGroup() {
  const modal = document.getElementById(`myModal-for-group`);

  modal.style.display = "none";
}

function changeButton() {
  let checkboxes = document.querySelectorAll("#myCheckbox");
  let createButton = document.getElementById("create-group-button");
  let groupNameInput = document.getElementById("group-name-input");

  let atLeastOneUserPicked = [...checkboxes].some(
    (checkbox) => checkbox.checked
  );
  let groupNameNotEmpty = groupNameInput.value.trim() !== "";
  // createButton.disabled = !(atLeastOneUserPicked && groupNameNotEmpty);
}

async function createGroup(userId) {
  let usersToAdd = getCheckboxValues();
  usersToAdd.push(userId);

  let groupNameInput = document.getElementById("group-name-input");
  let groupName = groupNameInput.value.trim() || "Группа";

  let groupId = generateRandomString(20);
  let currentDate = new Date();
  let groupData = {
    date: currentDate.toISOString(),
    file: "",
    last_message: "Группа создана",
    senderId: "",
    type: "group",
    groupImage:
      "https://firebasestorage.googleapis.com/v0/b/business-ffdc9.appspot.com/o/usersGroup.png?alt=media&token=52d516c5-f1d7-4458-ada3-6d2db1c21054",
    groupName: groupName,
    users: usersToAdd,
  };
  usersToAdd.forEach((user) => {
    let groupRef = `users/${user}/chats/${groupId}`;
    let docRef = doc(db, groupRef);

    setDoc(docRef, groupData);
  });
  closeModalForGroup();
}

function getCheckboxValues() {
  let selectedValues = [];
  let checkboxes = document.querySelectorAll("#myCheckbox");

  checkboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      selectedValues.push(checkbox.value);
    }
  });

  return selectedValues;
}

export { openModalForGroup, closeModalForGroup };
