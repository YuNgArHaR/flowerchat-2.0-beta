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
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import {
  getChatUi,
  loadChatHistory,
  handleImageInputChange,
  changeRecordButtonToSend,
  messageBlockText,
  friendMessageBlockText,
} from "./chat.js";
import { recordAudioMessage, cancelRecording } from "./voiceMessage.js";
import { showContextMenu, hideContextMenu } from "./contextMenu.js";
function loadChats(userID) {
  let deafultImg =
    "https://firebasestorage.googleapis.com/v0/b/business-ffdc9.appspot.com/o/deafultIMG.png?alt=media&token=b80a461a-7106-47f6-bd2d-5a65ab772b75";

  const chatsCollectionRef = collection(db, `users/${userID}/chats`);

  const sortedByDate = query(chatsCollectionRef, orderBy("date", "desc"));

  onSnapshot(sortedByDate, (snapshot) => {
    let i = 0;
    let maxDocs;
    let chatsParentDiv = document.getElementById("chat-el-location");
    let chatsDiv = document.getElementById("chats-history");
    let updatedChatsHistory = document.createElement("div");
    updatedChatsHistory.setAttribute("id", "chats-history");
    maxDocs = snapshot.docs.length;
    snapshot.forEach(async (chat) => {
      let chatData = chat.data();
      let friendPfp;
      let friendName;
      if (chatData.type) {
        if (chatData.type === "group") {
          console.log(chat.id);
          friendPfp = chatData.groupImage;
          friendName = chatData.groupName;
        }
      } else {
        console.log(`friend: ${chat.id}`);
        let friendsDataRef = doc(db, `users/${chat.id}`);
        await getDoc(friendsDataRef).then((friendDoc) => {
          let friendData = friendDoc.data();
          friendPfp = friendData.pfp;
          friendName = friendData.username;
        });
      }

      let time = chatData.date;
      let hours = new Date(time).getHours();
      let minutes = new Date(time).getMinutes();
      let formattedTime = `${String(hours).padStart(2, "0")}:${String(
        minutes
      ).padStart(2, "0")}`;
      const chatElement = document.createElement("div");
      chatElement.classList.add("chat-item");

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

      const lastMessageTimeElement = document.createElement("p");
      lastMessageTimeElement.classList.add("last-message-time");

      friendNameElement.textContent = friendName;
      lastMessageTimeElement.textContent = formattedTime;

      chatHeaderElement.appendChild(friendNameElement);
      chatHeaderElement.appendChild(lastMessageTimeElement);

      chatInfoElement.appendChild(chatHeaderElement);

      const chatTextElement = document.createElement("div");
      chatTextElement.classList.add("chat-text");

      const lastMessageElement = document.createElement("p");
      lastMessageElement.classList.add("chats-last-message");
      if (chatData.senderId === userID) {
        if (chatData.file !== "") {
          if (chatData.file.includes(".wav")) {
            lastMessageElement.innerHTML = "Вы: &#127925; Голосовое сообщение";
          } else if (chatData.file === "Пересланное сообщение") {
            lastMessageElement.innerHTML = "Вы: &#8618; Пересланное сообщение";
          } else {
            const imgElement = document.createElement("img");
            imgElement.setAttribute("src", deafultImg);
            lastMessageElement.textContent = "Вы: ";
            lastMessageElement.appendChild(imgElement);
            lastMessageElement.insertAdjacentText(
              "beforeend",
              ` ${chatData.last_message}`
            );
          }
        } else {
          lastMessageElement.textContent = `Вы: ${chatData.last_message}`;
        }
      } else {
        if (chatData.file !== "") {
          if (chatData.file.includes(".wav")) {
            lastMessageElement.innerHTML = "&#127925; Голосовое сообщение";
          } else if (chatData.file === "Пересланное сообщение") {
            lastMessageElement.innerHTML = "&#8618; Пересланное сообщение";
          } else {
            const imgElement = document.createElement("img");
            imgElement.setAttribute("src", deafultImg);
            lastMessageElement.appendChild(imgElement);
            lastMessageElement.insertAdjacentText(
              "beforeend",
              ` ${chatData.last_message}`
            );
          }
        } else {
          lastMessageElement.textContent = chatData.last_message;
        }
      }

      chatTextElement.appendChild(lastMessageElement);
      chatInfoElement.appendChild(chatTextElement);

      chatElement.appendChild(chatInfoElement);
      chatElement.addEventListener("click", () => openChat(chat.id, userID));

      updatedChatsHistory.appendChild(chatElement);
      i++;
      if (i === maxDocs) {
        chatsParentDiv.replaceChild(updatedChatsHistory, chatsDiv);
        chatsDiv.remove();
      }
    });
  });
}

function openChat(friendId, userId) {
  let friendDataRef = doc(db, `users/${friendId}`);
  onSnapshot(
    friendDataRef,
    (snapshot) => {
      if (snapshot.exists()) {
        let friendData = snapshot.data();
        let status = friendData.status;
        let friendName = friendData.username;
        chat.innerHTML = getChatUi(friendName, status, friendId, userId);
        loadChatHistory(friendId, userId);
        document.addEventListener("change", handleImageInputChange);
        document.addEventListener("input", changeRecordButtonToSend);
        document.addEventListener("click", recordAudioMessage);
        document.addEventListener("click", cancelRecording);
      } else {
        let groupDataRef = doc(db, `users/${userId}/chats/${friendId}`);
        onSnapshot(groupDataRef, (snapshot) => {
          if (snapshot.exists()) {
            let groupData = snapshot.data();
            let groupName = groupData.groupName;
            chat.innerHTML = getChatUi(groupName, "", friendId, userId);
            loadChatHistory(friendId, userId);
            document.addEventListener("change", handleImageInputChange);
            document.addEventListener("input", changeRecordButtonToSend);
            document.addEventListener("click", recordAudioMessage);
            document.addEventListener("click", cancelRecording);
          } else {
            console.log(`Данные диалога с ID ${friendId} не найдены.`);
          }
        });
      }
    },
    (error) => {
      console.error(`Ошибка при получении данных друга: ${error}`);
    }
  );
}

export { loadChats, openChat };
