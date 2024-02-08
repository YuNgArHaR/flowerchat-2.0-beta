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
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-storage.js";
import { audioChunks, mediaRecorder } from "./voiceMessage.js";
import { generateRandomString } from "./generateRandomString.js";
import { showContextMenu, hideContextMenu } from "./contextMenu.js";
import { openModal, closeModal } from "./modal.js";
import { openChat } from "./loadChats.js";

let clipIcon =
  "https://firebasestorage.googleapis.com/v0/b/business-ffdc9.appspot.com/o/clipIcon.svg?alt=media&token=37ae79ba-3b8d-4bf5-ae86-934613876d2d";

function getChatUi(username, status, receiverId, senderId) {
  return `<div> 
    <p>${username} ${status}</p> 
    <div id="messages-div">
    </div>
    <br>
        <span id="selectedFileName"></span>
    <br>
    
    <div class = "input-control-panel">
        <div class="file-input-container">
            <label for="imageInput">
                <img src="${clipIcon}" width = "25" alt="Clip Icon">
            </label>
            <input type="file" class="imageInput" id="imageInput" accept="image/*">
        </div>
        <input type="text" id="message-input-txt" class = "message-input-txt" placeholder="Введите сообщение...">
        <button id="startRecordBtn" class="startRecordBtn">&#127908;</button>
        <button id="cancelRecordBtn" class="cancelRecordBtn">&#10060;</button>
        <button class="send-message-btn" id= "send-message-btn" data-receiver="${receiverId}" data-sender="${senderId}">Send</button>
        </div>
    </div>`;
}

function getContextMenu(messageId) {
  return `
        <div class = "contextMenu" id="contextMenu-${messageId}" class="hidden">
            <button class="contextMenuButton forward" id="forwardButton-${messageId}">Переслать</button>
            <button class="contextMenuButton delete" id="deleteButton-${messageId}">Удалить</button>
        </div>
    `;
}

function getModalWindow(messageId) {
  return `
<div id="myModal-${messageId}" class="modal">
  <div class="modal-content">
    <span class="close" id = "closeModalButton-${messageId}">&times;</span>
    <h3>Переслать сообщение...</h3>
    
  </div>
</div>
`;
}

async function getUsersList(userId) {
  let usersList = [];
  const chatsCollectionRef = collection(db, `users/${userId}/chats`);
  const sortedByDate = query(chatsCollectionRef, orderBy("date", "desc"));
  let snapshot = await getDocs(sortedByDate);
  let i = 0;
  snapshot.forEach((chat) => {
    let friendsDataRef = doc(db, `users/${chat.id}`);

    getDoc(friendsDataRef).then((friendDoc) => {
      if (friendDoc.exists()) {
        let friendData = friendDoc.data();
        let chatId = chat.id;
        let data = {
          index: i,
          chatId: chatId,
          profileData: friendData,
        };
        usersList.push(data);
      } else {
        let groupData = chat.data();
        let chatId = chat.id;
        let data = {
          index: i,
          chatId: chatId,
          profileData: groupData,
          group: true,
        };
        usersList.push(data);
      }
    });
    i++;
  });

  console.log(`got ${usersList}`);
  return usersList;
}

document.addEventListener("click", function (event) {
  if (event.target && event.target.classList.contains("send-message-btn")) {
    const receiverId = event.target.getAttribute("data-receiver");
    const senderId = event.target.getAttribute("data-sender");
    sendMessage(receiverId, senderId);
  }
});

function changeRecordButtonToSend(event) {
  if (event.target && event.target.classList.contains("message-input-txt")) {
    let messageTextField = document.getElementById("message-input-txt");

    if (messageTextField.value.trim() !== "") {
      document.getElementById("send-message-btn").style.display = "block";
      document.getElementById("startRecordBtn").style.display = "none";
    } else {
      document.getElementById("send-message-btn").style.display = "none";
      document.getElementById("startRecordBtn").style.display = "block";
    }
  }
}

let image = "";
let storageRef;

function handleImageInputChange(event) {
  let selectedFileName = document.getElementById("selectedFileName");
  if (event.target && event.target.classList.contains("imageInput")) {
    image = event.target.files[0];

    storageRef = ref(storage, `images/${image.name}`);

    if (image.name !== "") {
      selectedFileName.textContent = image.name;
    } else {
      selectedFileName.textContent = "";
    }
  }
}

async function sendMessage(receiverId, senderId) {
  const senderCollectionRef = collection(
    db,
    `users/${senderId}/chats/${receiverId}/messages`
  );
  const receiverCollectionRef = collection(
    db,
    `users/${receiverId}/chats/${senderId}/messages`
  );
  const last_message_sender = doc(db, `users/${senderId}/chats/${receiverId}`);
  const last_message_receiver = doc(
    db,
    `users/${receiverId}/chats/${senderId}`
  );
  let currentDate = new Date();
  let audioLink;
  let data = await new Promise(async (resolve, reject) => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();

      mediaRecorder.onstop = async () => {
        audioLink = await uploadAudio(audioChunks);
        if (audioLink) {
          console.log(audioLink);
          let dataWithAudio = {
            message: "",
            image: "",
            receiverId: receiverId,
            senderId: senderId,
            date: currentDate.toISOString(),
            audio: audioLink,
          };
          resolve(dataWithAudio);
        }
      };
    } else {
      let messageInput = document.getElementById(`message-input-txt`);
      let message = messageInput.value;

      if (message.trim() !== "" || image !== "") {
        document
          .getElementById("send-message-btn")
          .setAttribute("disabled", "true");

        if (image !== "") {
          console.log("there's an image");
          let imageLink = await uploadImage(image);

          if (imageLink) {
            console.log(imageLink);
            let dataWithImage = {
              message: message,
              image: imageLink,
              receiverId: receiverId,
              senderId: senderId,
              date: currentDate.toISOString(),
              audio: "",
            };
            document.getElementById("imageInput").value = "";
            image = "";
            storageRef = "";
            resolve(dataWithImage);
          }
        } else {
          let dataMessage = {
            message: message,
            image: "",
            receiverId: receiverId,
            senderId: senderId,
            date: currentDate.toISOString(),
            audio: "",
          };
          resolve(dataMessage);
        }

        messageInput.value = "";
      }
    }
  });

  if (data) {
    console.log(data);
  }
  try {
    if (data) {
      getDoc(last_message_sender).then(async (docSnapshot) => {
        if (docSnapshot.exists()) {
          let chatData = docSnapshot.data();
          console.log(chatData);
          if (chatData.type) {
            if (chatData.type === "group") {
              let usersInGroup = chatData.users;
              usersInGroup.forEach(async (user) => {
                console.log(user);
                let last_message_ref = doc(
                  db,
                  `users/${user}/chats/${receiverId}`
                );
                let messageCollectionRef = collection(
                  db,
                  `users/${user}/chats/${receiverId}/messages`
                );
                await updateDoc(last_message_ref, {
                  date: data.date,
                  last_message: data.message,
                  senderId: data.senderId,
                  file:
                    data.image !== ""
                      ? data.image
                      : data.audio !== ""
                      ? data.audio
                      : "",
                });
                await addDoc(messageCollectionRef, data);
              });
            }
          } else {
            await updateDoc(last_message_sender, {
              date: data.date,
              last_message: data.message,
              senderId: data.senderId,
              file:
                data.image !== ""
                  ? data.image
                  : data.audio !== ""
                  ? data.audio
                  : "",
            });
            await updateDoc(last_message_receiver, {
              date: data.date,
              last_message: data.message,
              senderId: data.senderId,
              file:
                data.image !== ""
                  ? data.image
                  : data.audio !== ""
                  ? data.audio
                  : "",
            });
            await addDoc(senderCollectionRef, data);
            await addDoc(receiverCollectionRef, data);
          }
        } else {
          await setDoc(last_message_sender, {
            date: data.date,
            last_message: data.message,
            senderId: data.senderId,
            file:
              data.image !== ""
                ? data.image
                : data.audio !== ""
                ? data.audio
                : "",
          });
          await setDoc(last_message_receiver, {
            date: data.date,
            last_message: data.message,
            senderId: data.senderId,
            file:
              data.image !== ""
                ? data.image
                : data.audio !== ""
                ? data.audio
                : "",
          });
          await addDoc(senderCollectionRef, data);
          await addDoc(receiverCollectionRef, data);
        }
      });

      console.log("sent!");
    }
    document.getElementById("send-message-btn").removeAttribute("disabled");
  } catch (error) {
    console.log(error);
    document.getElementById("send-message-btn").removeAttribute("disabled");
    document.getElementById("imageInput").value = "";
    image = "";
    storageRef = "";
  }
}

async function uploadAudio(audioChunks) {
  return new Promise(async (resolve, reject) => {
    const startRecordBtn = document.getElementById("startRecordBtn");
    const stopRecordBtn = document.getElementById("cancelRecordBtn");
    const uploadBtn = document.getElementById("send-message-btn");
    const textfield = document.getElementById("message-input-txt");
    startRecordBtn.style.display = "block";
    stopRecordBtn.style.display = "none";
    uploadBtn.style.display = "none";
    textfield.disabled = false;
    let audioName = generateRandomString(10);
    let audioMessageRef = ref(storage, `audio_messages/${audioName}.wav`);

    let audioBlob = new Blob(audioChunks, { type: "audio/wav" });
    try {
      let snapshot = await uploadBytes(audioMessageRef, audioBlob);
      audioChunks.splice(0, audioChunks.length);

      let audioLink = await getDownloadURL(snapshot.ref);
      console.log("audio sent");

      resolve(audioLink);
    } catch (error) {
      console.error("Error uploading audio:", error);

      reject(error);
    }
  });
}

async function uploadImage(image) {
  return new Promise(async (resolve, reject) => {
    try {
      const snapshot = await uploadBytes(storageRef, image);
      console.log("uploaded");

      const link = await getDownloadURL(snapshot.ref);

      resolve(link);
    } catch (error) {
      console.error("Error uploading image:", error);
      document.getElementById("send-message-btn").removeAttribute("disabled");
      document.getElementById("imageInput").value = "";
      image = "";
      storageRef = "";
      reject(error);
    }
  });
}

let messageBlockText;
let friendMessageBlockText;

function loadChatHistory(receiverId, senderId) {
  const messagesDiv = document.getElementById(`messages-div`);

  const messagesCollectionRef = collection(
    db,
    `users/${senderId}/chats/${receiverId}/messages`
  );
  const sortedByDate = query(messagesCollectionRef, orderBy("date", "desc"));
  onSnapshot(sortedByDate, async (snapshot) => {
    messagesDiv.innerHTML = "";

    snapshot.forEach(async (messageDoc) => {
      const messageData = messageDoc.data();
      let time = messageData.date;
      let hours = new Date(time).getHours();
      let minutes = new Date(time).getMinutes();
      let formattedTime = `${String(hours).padStart(2, "0")}:${String(
        minutes
      ).padStart(2, "0")}`;
      // Создать и добавить элемент сообщения в messagesDiv
      const messageElement = document.createElement("div");

      if (messageData.senderId === auth.currentUser.uid) {
        messageElement.classList.add("mine-message");
      } else {
        messageElement.classList.add("friend-message");
      }
      messageElement.addEventListener("contextmenu", (e) =>
        showContextMenu(e, messageElement, messageDoc.id)
      );

      if (messageData.forwardedFrom) {
        const forwardedText = document.createElement("p");
        forwardedText.classList.add("message-text");
        forwardedText.textContent = `Переслано от ${messageData.forwardedFrom}:`;
        forwardedText.style.fontWeight = "bold"; // Жирный шрифт
        forwardedText.style.userSelect = "none";
        messageElement.appendChild(forwardedText);
      }

      if (messageData.audio) {
        const audioElement = document.createElement("audio");
        audioElement.controls = true;
        audioElement.src = messageData.audio;

        messageElement.appendChild(audioElement);
        messageElement.style.backgroundColor = "transparent";
      }
      if (messageData.image) {
        const imageElement = document.createElement("img");
        imageElement.src = messageData.image;

        messageElement.appendChild(imageElement);
      }
      if (messageData.message) {
        const textElement = document.createElement("p");
        textElement.classList.add("message-text");
        textElement.textContent = messageData.message;

        messageElement.appendChild(textElement);
      }
      let messageSentTime = document.createElement("p");
      messageSentTime.classList.add("message-time");
      messageSentTime.textContent = formattedTime;
      messageElement.appendChild(messageSentTime);

      let contextMenuForMsg = document.createElement("div");
      contextMenuForMsg.innerHTML = getContextMenu(messageDoc.id);
      let modalWin = document.createElement("div");
      let usersList = await getUsersList(senderId);
      modalWin.innerHTML = getModalWindow(messageDoc.id);
      messagesDiv.appendChild(contextMenuForMsg);
      messagesDiv.appendChild(modalWin);
      let forwardButton = document.getElementById(
        `forwardButton-${messageDoc.id}`
      );
      let deleteButton = document.getElementById(
        `deleteButton-${messageDoc.id}`
      );
      let closeModalButton = document.getElementById(
        `closeModalButton-${messageDoc.id}`
      );

      forwardButton.addEventListener("click", () =>
        openModal(messageDoc.id, usersList, senderId, receiverId)
      );
      deleteButton.addEventListener("click", () =>
        deleteMessage(messageDoc.id, senderId, receiverId)
      );
      closeModalButton.addEventListener("click", () =>
        closeModal(messageDoc.id)
      );
      document.addEventListener("click", () => hideContextMenu(messageDoc.id));

      // Если чат является группой, то добавляем сообщениям аватарки и никнеймы
      let chatRef = doc(db, `users/${senderId}/chats/${receiverId}`);
      let snapshot = await getDoc(chatRef);
      let chatData = snapshot.data();
      if (chatData.type) {
        if (chatData.type === "group") {
          if (messageData.senderId !== auth.currentUser.uid) {
            let userRef = doc(db, `users/${messageData.senderId}`);
            let userDataSnapshot = await getDoc(userRef);
            let userData = userDataSnapshot.data();
            let userMessageData = document.createElement("div");
            userMessageData.setAttribute("id", "user-message-data");

            let divGroupMessage = document.createElement("div");
            let divUserData = document.createElement("div");
            divUserData.classList.add("group-user-data");
            let userImage = document.createElement("img");
            userImage.classList.add("group-message-pfp");
            userImage.src = userData.pfp;
            divUserData.appendChild(userImage);

            let username_P = document.createElement("p");
            username_P.textContent = userData.username;
            divUserData.appendChild(username_P);

            divGroupMessage.appendChild(divUserData);
            divGroupMessage.appendChild(messageElement);
            messagesDiv.appendChild(divGroupMessage);
          } else {
            messagesDiv.appendChild(messageElement);
          }
        }
      } else {
        messagesDiv.appendChild(messageElement);
      }
      // messagesDiv.appendChild(messageElement);
    });
  });
}

async function onPickChatToForward(fromChatId, toChatId, userId, messageId) {
  const senderCollectionRef = collection(
    db,
    `users/${userId}/chats/${toChatId}/messages`
  );
  const receiverCollectionRef = collection(
    db,
    `users/${toChatId}/chats/${userId}/messages`
  );
  const last_message_sender = doc(db, `users/${userId}/chats/${toChatId}`);
  const last_message_receiver = doc(db, `users/${toChatId}/chats/${userId}`);
  let currentDate = new Date();
  let data;
  const messageToForward = doc(
    db,
    `users/${userId}/chats/${fromChatId}/messages/${messageId}`
  );
  if (messageToForward) {
    openChat(toChatId, userId);
    await getDoc(messageToForward)
      .then(async (messageSnapshot) => {
        if (messageSnapshot.exists()) {
          const messageData = messageSnapshot.data();
          let senderMessageName = doc(db, `users/${messageData.senderId}`);
          await getDoc(senderMessageName)
            .then(async (user) => {
              if (user.exists()) {
                let userData = user.data();
                if (userData) {
                  data = {
                    message: messageData.message,
                    image: messageData.image,
                    receiverId: toChatId,
                    senderId: userId,
                    date: currentDate.toISOString(),
                    audio: messageData.audio,
                    forwardedFrom: userData.username,
                  };

                  if (data) {
                    console.log(toChatId);
                    let chatRef = doc(db, `users/${userId}/chats/${toChatId}`);
                    await getDoc(chatRef).then(async (chat) => {
                      if (chat.exists()) {
                        let chatData = chat.data();

                        if (chatData.type) {
                          if (chatData.type === "group") {
                            let usersInGroup = chatData.users;

                            usersInGroup.forEach(async (userInGroup) => {
                              try {
                                let last_message_ref = doc(
                                  db,
                                  `users/${userInGroup}/chats/${toChatId}`
                                );
                                let messageCollectionRef = collection(
                                  db,
                                  `users/${userInGroup}/chats/${toChatId}/messages`
                                );

                                await updateDoc(last_message_ref, {
                                  date: data.date,
                                  last_message: data.message,
                                  senderId: data.senderId,
                                  file: "Пересланное сообщение",
                                });
                                await addDoc(messageCollectionRef, data);
                              } catch (error) {
                                console.log(
                                  `error while forwarding message to group: ${error}`
                                );
                              }
                            });
                          }
                        } else {
                          try {
                            await setDoc(last_message_sender, {
                              date: data.date,
                              last_message: data.message,
                              senderId: data.senderId,
                              file: "Пересланное сообщение",
                            });
                            await setDoc(last_message_receiver, {
                              date: data.date,
                              last_message: data.message,
                              senderId: data.senderId,
                              file: "Пересланное сообщение",
                            });
                            await addDoc(senderCollectionRef, data);
                            await addDoc(receiverCollectionRef, data);
                          } catch (error) {
                            console.log(
                              `error while forwarding message to friend: ${error}`
                            );
                          }
                        }
                      } else {
                        console.log("chat does not exist");
                      }
                    });

                    console.log("sent!");
                  }
                }
              } else {
              }
            })
            .catch((error) => {
              console.error("Ошибка при получении User из Firestore: ", error);
            });
        } else {
          // Документ не существует
        }
      })
      .catch((error) => {
        console.error("Ошибка при получении данных из Firestore: ", error);
      });
  }
}

function deleteMessage(messageId, userId, chatId) {
  console.log(`users/${userId}/chats/${chatId}/messages/${messageId}`);
  const messageToDelete = doc(
    db,
    `users/${userId}/chats/${chatId}/messages/${messageId}`
  );
  if (messageToDelete) {
    deleteDoc(messageToDelete).then(() => {
      const messagesCollectionRef = collection(
        db,
        `users/${userId}/chats/${chatId}/messages`
      );
      const sortedByDate = query(
        messagesCollectionRef,
        orderBy("date", "desc"),
        limit(1)
      );
      getDocs(sortedByDate).then((snapshot) => {
        if (!snapshot.empty) {
          const last_message_sender = doc(
            db,
            `users/${userId}/chats/${chatId}`
          );
          const latestDocument = snapshot.docs[0];
          const latestData = latestDocument.data();
          let file;
          if (latestData.image !== "") {
            file = latestData.image;
          } else if (latestData.audio !== "") {
            file = latestData.audio;
          } else {
            file = "";
          }
          setDoc(last_message_sender, {
            date: latestData.date,
            last_message: latestData.message,
            senderId: latestData.senderId,
            file: file,
          });
        } else {
          const deleteChat = doc(db, `users/${userId}/chats/${chatId}`);
          if (deleteChat) {
            deleteDoc(deleteChat);
          }
        }
      });
    });
  }
}

export {
  getChatUi,
  loadChatHistory,
  handleImageInputChange,
  changeRecordButtonToSend,
  messageBlockText,
  friendMessageBlockText,
  onPickChatToForward,
};
