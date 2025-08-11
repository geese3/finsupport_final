import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js";
import { auth } from "./firebase-config.js";

// 인증 상태 관리
let currentUser = null;
let authInitialized = false;

// 로그인 함수
export async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    currentUser = userCredential.user;
    
    // 로그인 성공 시 UI 변경
    document.body.classList.remove('login-mode');
    document.getElementById('admin-content').style.display = 'block';
    
    console.log('로그인 성공:', currentUser.email);
    return { success: true, user: currentUser };
  } catch (error) {
    console.error('로그인 실패:', error);
    alert('로그인 실패: ' + error.message);
    return { success: false, error: error.message };
  }
}

// 로그아웃 함수
export async function logout() {
  try {
    await signOut(auth);
    currentUser = null;
    
    // 로그아웃 시 UI 변경
    document.body.classList.add('login-mode');
    document.getElementById('admin-content').style.display = 'none';
    
    // 입력 필드 초기화
    document.getElementById('admin-email').value = '';
    document.getElementById('admin-password').value = '';
    
    console.log('로그아웃 성공');
    return { success: true };
  } catch (error) {
    console.error('로그아웃 실패:', error);
    return { success: false, error: error.message };
  }
}

// 현재 사용자 정보 반환
export function getCurrentUser() {
  return currentUser;
}

// 인증 상태 초기화 및 모니터링
export function initAuth() {
  return new Promise((resolve) => {
    if (authInitialized) {
      resolve(currentUser);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      currentUser = user;
      authInitialized = true;
      
      if (user) {
        console.log('사용자 인증됨:', user.email);
        document.body.classList.remove('login-mode');
        document.getElementById('admin-content').style.display = 'block';
      } else {
        console.log('사용자 인증 안됨');
        document.body.classList.add('login-mode');
        document.getElementById('admin-content').style.display = 'none';
      }
      
      // 첫 번째 호출에서만 resolve
      unsubscribe();
      resolve(user);
    });
  });
}

// 사용자 인증 상태 확인
export function isAuthenticated() {
  return currentUser !== null;
}

// 관리자 권한 확인 (이메일 기반)
export function isAdmin() {
  const allowedAdmins = [
    "geese3433@gmail.com",
    "iqhali93@gmail.com", 
    "offbeatt@naver.com"
  ];
  
  return currentUser && allowedAdmins.includes(currentUser.email);
}