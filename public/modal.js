import { openChat } from "./loadChats.js";
import { onPickChatToForward } from "./chat.js";

// Функция для открытия модального окна
function openModal(messageId, usersList, userId, fromChatId) {
  const modal = document.getElementById(`myModal-${messageId}`);
  let modalContent = modal.querySelector(".modal-content");
  let oldModalContent = modalContent.querySelector("#list-of-users");
  if (oldModalContent) {
    modalContent.removeChild(oldModalContent);
  }
  console.log("opened");
  let i = 0;
  let maxDocs = usersList.length;
  let chatsDiv = document.createElement("div");
  chatsDiv.setAttribute("id", "list-of-users");
  usersList.sort((a, b) => a.index - b.index);
  usersList.forEach((friend) => {
    let chatId = friend.chatId;
    let friendPfp;
    let friendName;
    let friendStatus;
    if (friend.group) {
      friendPfp = friend.profileData.groupImage;
      friendName = friend.profileData.groupName;
      friendStatus = "";
    } else {
      friendPfp = friend.profileData.pfp;
      friendName = friend.profileData.username;
      friendStatus = friend.profileData.status;
    }

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

    chatTextElement.appendChild(lastMessageElement);
    chatInfoElement.appendChild(chatTextElement);

    chatElement.addEventListener("click", () =>
      onPickChatToForward(fromChatId, chatId, userId, messageId)
    );
    chatElement.appendChild(chatInfoElement);

    chatsDiv.appendChild(chatElement);

    i++;
    if (i === maxDocs) {
      modalContent.appendChild(chatsDiv);
      modal.style.display = "block";
    }
  });
}

// Функция для закрытия модального окна
function closeModal(messageId) {
  const modal = document.getElementById(`myModal-${messageId}`);

  modal.style.display = "none";
}

export { openModal, closeModal };
