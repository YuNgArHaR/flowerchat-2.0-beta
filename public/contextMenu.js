// Function to display the context menu
function showContextMenu(e, div, messageId) {
  const elementsWithContextMenu = document.querySelectorAll(
    '[id*="contextMenu"]'
  );
  elementsWithContextMenu.forEach((ctxMenu) => {
    if (
      ctxMenu.id !== `contextMenu-${messageId}` &&
      ctxMenu.style.display === "block"
    ) {
      ctxMenu.style.display = "none";
    }
  });
  const contextMenu = document.getElementById(`contextMenu-${messageId}`);
  const chatDiv = document.getElementById("messages-div");
  e.preventDefault(); // Prevent the default right-click menu
  const rect = div.getBoundingClientRect();

  let parentTop = chatDiv.getBoundingClientRect().top + window.scrollY;
  let childTop = div.getBoundingClientRect().top + window.scrollY;
  let mgnTop;
  if (childTop - parentTop > 0 || childTop - parentTop > 200) {
    mgnTop = rect.top + window.scrollY + "px";
    console.log(childTop - parentTop);
  } else {
    mgnTop = rect.top + window.scrollY + rect.height + "px";
    console.log(childTop - parentTop);
  }
  // contextMenuTop = rect.top + window.scrollY + rect.height + "px";
  // Adjust the top and left properties based on the position
  contextMenu.style.left = rect.left + window.scrollX + "px";
  contextMenu.style.top = mgnTop;
  if (contextMenu.style.display === "block") {
    contextMenu.style.display = "none";
  } else {
    contextMenu.style.display = "block";
  }
  chatDiv.style.overflowY = "hidden";
}

// Function to hide the context menu
function hideContextMenu(messageId) {
  const contextMenu = document.getElementById(`contextMenu-${messageId}`);
  const chatDiv = document.getElementById("messages-div");
  if (contextMenu) {
    contextMenu.style.display = "none";
    chatDiv.style.overflowY = "scroll";
  }
}

// Add a right-click event listener to the div

export { showContextMenu, hideContextMenu };
