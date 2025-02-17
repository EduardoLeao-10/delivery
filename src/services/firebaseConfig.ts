// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD10t9fE-YhC2XXPgvElCqtSyOQeE2YnqU",
  authDomain: "delivery-f022a.firebaseapp.com",
  databaseURL: "https://delivery-f022a-default-rtdb.firebaseio.com",
  projectId: "delivery-f022a",
  storageBucket: "delivery-f022a.firebasestorage.app",
  messagingSenderId: "849039999107",
  appId: "1:849039999107:web:7ddf3920d2ce7a14f19bb6",
  measurementId: "G-8DGXNLYV4R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };