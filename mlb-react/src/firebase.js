import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: "AIzaSyA40g-cxWxQV1R0niqZfBpwJ1OlImx1ghE",
    authDomain: "live-odds-tracker.firebaseapp.com",
    projectId: "live-odds-tracker",
    storageBucket: "live-odds-tracker.appspot.com",
    messagingSenderId: "78785845250",
    appId: "1:78785845250:web:9e756ade4fd465f494af1b",
    measurementId: "G-L9G8SVLWJB"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const token = await getToken(messaging, { vapidKey: 'BILIitJgxFJzZ_sMil8xtUNIClecmloK57n-zCRP-OE9pFm1RqP3ast942bW5v4vrhFxwx4KkRxaYDVx3lKMpso' });
            console.log('FCM Token:', token);
            return token;
        } else {
            console.error('Notification permission not granted');
            return null;
        }
    } catch (error) {
        console.error('Error getting notification permission:', error);
        return null;
    }
};

// Handle incoming messages for notifications
onMessage(messaging, (payload) => {
    console.log('Message received. ', payload);
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon || '/firebase-logo.png'
    };

    if (Notification.permission === 'granted') {
        new Notification(notificationTitle, notificationOptions);
    }
});

// Register the service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
            console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((err) => {
            console.error('Service Worker registration failed:', err);
        });
}
