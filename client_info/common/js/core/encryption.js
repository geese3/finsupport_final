import { httpsCallable } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-functions.js";
import { functions, auth } from "./firebase-config.js";

// 서버 사이드 주민등록번호 복호화 함수
export async function decryptSSN(ciphertext) {
  try {
    if (!ciphertext || typeof ciphertext !== 'string' || ciphertext.trim() === '') {
      return "";
    }
    
    // 현재 로그인된 사용자 정보 확인
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return "로그인이 필요합니다.";
    }
    
    // Firebase Functions 호출
    const decryptSSNFunction = httpsCallable(functions, 'decryptSSN');
    const requestData = { ssn: ciphertext };
    
    // 인증 토큰을 새로고침하여 최신 상태로 만들기
    await currentUser.getIdToken(true);
    
    const result = await decryptSSNFunction(requestData);
    
    return result.data.ssn || "복호화 실패";
  } catch (e) {
    console.error("복호화 중 에러 발생:", e);
    return "복호화 실패";
  }
}

// 서버 사이드 주민등록번호 암호화 함수
export async function encryptSSN(plaintext) {
  try {
    if (!plaintext || typeof plaintext !== 'string' || plaintext.trim() === '') {
      return "";
    }
    
    // Firebase Functions 호출
    const encryptSSNFunction = httpsCallable(functions, 'encryptSSN');
    const requestData = { ssn: plaintext };
    
    const result = await encryptSSNFunction(requestData);
    
    return result.data.encryptedSSN || "";
  } catch (e) {
    console.error("암호화 중 에러 발생:", e);
    return "";
  }
}

// 담당자 정보의 민감 데이터 일괄 복호화
export async function decryptManagerSensitiveData(manager) {
  const decryptedData = {
    ssn: '',
    gaiaPassword: '',
    insurancePasswords: {}
  };

  try {
    // 주민등록번호 복호화
    if (manager.ssn) {
      decryptedData.ssn = await decryptSSN(manager.ssn);
    }

    // 가이아 비밀번호 복호화 (서버에서 처리)
    if (manager.gaiaPassword) {
      decryptedData.gaiaPassword = await decryptPassword(manager.gaiaPassword, 'gaia');
    }

    // 보험사 비밀번호들 복호화
    if (manager.insuranceAccounts) {
      for (const [companyKey, accountInfo] of Object.entries(manager.insuranceAccounts)) {
        if (accountInfo.password) {
          decryptedData.insurancePasswords[companyKey] = await decryptPassword(accountInfo.password, 'insurance');
        }
      }
    }

  } catch (error) {
    console.error('담당자 민감 데이터 복호화 실패:', error);
  }

  return decryptedData;
}

// 일반 비밀번호 복호화 (서버 사이드)
async function decryptPassword(ciphertext, type) {
  try {
    if (!ciphertext) return '';
    
    // 평문인 경우 그대로 반환
    if (ciphertext.length < 16 || !ciphertext.match(/^[A-Za-z0-9+/].*={0,2}$/)) {
      return ciphertext;
    }

    // 서버에서 복호화 처리 (현재는 SSN 복호화 함수 재사용)
    // 추후 별도 password 복호화 함수로 분리 가능
    const result = await decryptSSN(ciphertext);
    return result;
  } catch (error) {
    console.error(`${type} 비밀번호 복호화 실패:`, error);
    return '복호화 실패';
  }
}

// 복호화 캐시 관리
export class DecryptionCache {
  constructor() {
    this.cache = new Map();
    this.loading = new Set();
  }

  // 캐시에서 값 가져오기
  get(key) {
    return this.cache.get(key);
  }

  // 캐시에 값 저장
  set(key, value) {
    this.cache.set(key, value);
    this.loading.delete(key);
  }

  // 로딩 상태 확인
  isLoading(key) {
    return this.loading.has(key);
  }

  // 로딩 상태 설정
  setLoading(key) {
    this.loading.add(key);
  }

  // 캐시 초기화
  clear() {
    this.cache.clear();
    this.loading.clear();
  }

  // 특정 키 삭제
  delete(key) {
    this.cache.delete(key);
    this.loading.delete(key);
  }
}

// 전역 복호화 캐시 인스턴스
export const decryptionCache = new DecryptionCache();