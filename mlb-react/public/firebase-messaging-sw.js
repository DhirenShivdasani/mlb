// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.1.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.1.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyA40g-cxWxQV1R0niqZfBpwJ1OlImx1ghE",
    authDomain: "live-odds-tracker.firebaseapp.com",
    projectId: "live-odds-tracker",
    storageBucket: "live-odds-tracker.appspot.com",
    messagingSenderId: "78785845250",
    appId: "1:78785845250:web:9e756ade4fd465f494af1b",
    measurementId: "G-L9G8SVLWJB"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/firebase-logo.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
