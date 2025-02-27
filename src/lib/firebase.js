// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';


const firebaseConfig = {
  apiKey: "AIzaSyAUfE0Um-1__F00E6K2nnN_r6U3OIysuts",
  authDomain: "wavemeet-c2329.firebaseapp.com",
  projectId: "wavemeet-c2329",
  storageBucket: "wavemeet-c2329.firebasestorage.app",
  messagingSenderId: "326746849711",
  appId: "1:326746849711:web:7b071233ac41dff6e26f5a"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);