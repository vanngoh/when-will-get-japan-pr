import { initializeApp } from "firebase/app";

export default defineNuxtPlugin(() => {
    const firebaseConfig = {
        apiKey: "AIzaSyCvEB6oS7XFufN-TTHDYiZMUaVR-f2czFQ",
        authDomain: "whenwillgetjapanpr.web.app",
        projectId: "whenwillgetjapanpr",
        storageBucket: "whenwillgetjapanpr.web.app",
        messagingSenderId: "697514277308",
        appId: "1:697514277308:web:7abac2a4f223bac45013b9"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);

    return {
        provide: {
            firebase: app,
        },
    };
});
