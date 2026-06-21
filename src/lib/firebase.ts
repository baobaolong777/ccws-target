import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'

// TODO: 替换为你的 Firebase 配置
// 你可以从 Firebase Console 获取这些信息
const firebaseConfig = {
  apiKey: "AIzaSyAK-caoPToTYUN09EBXAcybaE-BhHiSKE8",
  authDomain: "ccws-target.firebaseapp.com",
  projectId: "ccws-target",
  storageBucket: "ccws-target.firebasestorage.app",
  messagingSenderId: "926664635231",
  appId: "1:926664635231:web:d927046eeadef73cbbbcea"
}; 

// 初始化 Firebase
const app = initializeApp(firebaseConfig)

// 初始化认证
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

// 初始化 Firestore
export const db = getFirestore(app)

// 启用离线持久化
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // 多个标签页同时打开时可能会失败
    console.log('持久化失败：多个标签页同时打开')
  } else if (err.code === 'unimplemented') {
    // 浏览器不支持
    console.log('持久化失败：浏览器不支持')
  }
})

export default app
