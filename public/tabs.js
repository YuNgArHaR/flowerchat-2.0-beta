function openTab(tabName) {
    // Get all elements with class "tab-content" and hide them
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].style.display = "none";
    }

    // Show the selected tab
    document.getElementById(tabName).style.display = "block";
}