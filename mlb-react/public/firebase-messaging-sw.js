// firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

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

messaging.onBackgroundMessage((payload) => {
    console.log('Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/firebase-logo.png' // Replace with your app's logo or any image you prefer
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
