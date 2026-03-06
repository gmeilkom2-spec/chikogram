// ВСТАВЬТЕ СЮДА ВАШ КОНФИГ ИЗ FIREBASE CONSOLE
const firebaseConfig = {
    apiKey: "AIzaSyB8675n3LILkMHypxLDYJBq9QU6fS9ql_E",
    authDomain: "chikogramdb.firebaseapp.com",
    projectId: "chikogramdb",
    storageBucket: "chikogramdb.firebasestorage.app",
    messagingSenderId: "309310042698",
    appId: "1:309310042698:web:2b53e70dd86426350c6cb3"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Вход и регистрация
async function login() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    try {
        const res = await auth.signInWithEmailAndPassword(email, pass);
        setupApp(res.user);
    } catch (e) {
        const res = await auth.createUserWithEmailAndPassword(email, pass);
        await db.collection('users').doc(res.user.uid).set({
            email: email,
            isVerified: false,
            isAdmin: false,
            gifts: []
        });
        setupApp(res.user);
    }
}

async function setupApp(user) {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-screen').style.display = 'flex';
    
    // Проверка статуса админа
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.exists && userDoc.data().isAdmin) {
        document.getElementById('admin-btn').style.display = 'block';
    }
    
    document.getElementById('user-display-name').innerText = user.email;
    loadMessages();
}

// Работа с сообщениями
function sendMessage() {
    const text = document.getElementById('msg-input').value;
    if (!text) return;

    db.collection('messages').add({
        text: text,
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById('msg-input').value = '';
}

function loadMessages() {
    db.collection('messages').orderBy('createdAt', 'asc').onSnapshot(async (snapshot) => {
        const list = document.getElementById('messages-list');
        list.innerHTML = '';
        
        for (const doc of snapshot.docs) {
            const msg = doc.data();
            const userRef = await db.collection('users').doc(msg.uid).get();
            const userData = userRef.data() || {};

            // Галочка (ваша картинка)
            const verified = userData.isVerified ? 
                `<img src="verify.png" class="verify-icon">` : '';
            
            // Подарки
            const gifts = (userData.gifts || []).map(g => {
                const img = g === 'rocket' ? 'https://img.icons8.com/emoji/48/rocket-emojii.png' : 'https://img.icons8.com/emoji/48/gem-stone.png';
                return `<img src="${img}" class="gift-img">`;
            }).join('');

            list.innerHTML += `
                <div class="msg">
                    <div class="msg-header">${msg.email} ${verified}</div>
                    <div>${msg.text}</div>
                    <div class="gifts-area">${gifts}</div>
                </div>
            `;
        }
        list.scrollTop = list.scrollHeight;
    });
}

// Функции администратора
function toggleAdminModal() {
    const modal = document.getElementById('admin-modal');
    modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
}

async function setVerification(status) {
    const uid = document.getElementById('target-uid').value;
    if(!uid) return alert('Введите UID');
    await db.collection('users').doc(uid).update({ isVerified: status });
    alert('Статус верификации обновлен!');
}

async function giveGift(giftType) {
    const uid = document.getElementById('target-uid').value;
    if(!uid) return alert('Введите UID');
    await db.collection('users').doc(uid).update({
        gifts: firebase.firestore.FieldValue.arrayUnion(giftType)
    });
    alert('Подарок отправлен!');
}

function logout() {
    auth.signOut().then(() => location.reload());
}
