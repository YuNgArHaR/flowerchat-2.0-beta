import { db, auth } from './config.js';
import {
    collection,
    query,
    where,
    and,
    or,
    doc,
    setDoc,
    addDoc,
    getDoc,
    getDocs,
} from 'https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js';
import { getChatUi, loadChatHistory, handleImageInputChange } from './chat.js';
import { openChat } from './loadChats.js'


const searchButton = document.getElementById('search-btn');

const resultsList = document.getElementById('search-results');



searchButton.addEventListener('click', search);



async function search() {
    const searchInput = document.getElementById('query-text').value;

    if (searchInput !== "") {
        resultsList.innerHTML = '';

        const users = query(
            collection(db, 'users'),
            // or(
            //     where('username', '==', searchInput),
            //     where('username', '>=', searchInput), 
            //     where('username', '<=', searchInput + '\uf8ff')
            // )
        );
    
        try {
            let i = 0;
            const result = await getDocs(users);
            result.forEach((doc) => {
                const user = doc.data();
                const username = user.username.toLowerCase();

                if (auth.currentUser.uid != user.id && (username === searchInput.toLowerCase() || username.startsWith(searchInput.toLowerCase()))) {
                    i++;

                    const listItem = document.createElement('button');
                    listItem.className = 'ul-child';
                    listItem.textContent = `${i}: ${user.username}`;
                    listItem.addEventListener('click', () => openChat(user.id, auth.currentUser.uid));
                    resultsList.appendChild(listItem);
                }
    
                
                
            });
            if (i === 0){
                console.log('empty')
                const emptyText = document.createElement('p');
                emptyText.textContent = `По запросу '${searchInput}' нет результатов`
                resultsList.appendChild(emptyText);
            }
            
        } catch (error) {
            console.log(error)
        }
    }

}

// async function getUserData(userId) {
//     const user = query(
//         collection(db, 'users'),
//         where('id', '==', userId),
//     );

//     try {
//         const result = await getDocs(user);

//         if (!result.empty) {
//             const userData = result.docs[0].data();
//             let username = userData.username;
//             chat.innerHTML = getChatUi(username, userData.id, auth.currentUser.uid);
//             loadChatHistory(userData.id, auth.currentUser.uid);
//             document.addEventListener('change', handleImageInputChange);
//         }
//     } catch (error) {
//         console.log(error)
//     }
// }