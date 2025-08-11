import { collection, getDocs, query, where, doc, updateDoc, addDoc, deleteDoc, orderBy, Timestamp, limit, startAfter } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-functions.js";
import { db, functions } from "../core/firebase-config.js";

// 페이지네이션 상태 관리
let lastManagerVisible = null;
let isLoadingManagers = false;
const MANAGER_PAGE_SIZE = 10;

// 담당자 목록 조회 (페이지네이션 포함)
export async function loadManagers(searchTerm = '', isLoadMore = false) {
  try {
    if (isLoadingManagers) return { managers: [], hasMore: false };
    
    isLoadingManagers = true;
    
    let managerQuery = collection(db, "managers");
    
    // 검색어가 있는 경우
    if (searchTerm) {
      // 검색은 페이지네이션 없이 전체 결과 반환
      const snapshot = await getDocs(query(managerQuery, orderBy("createdAt", "asc")));
      const allManagers = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        allManagers.push({
          id: doc.id,
          ...data
        });
      });
      
      // 클라이언트 사이드에서 검색 필터링
      const filteredManagers = allManagers.filter(manager => {
        const name = manager.name?.toLowerCase() || '';
        const code = manager.code?.toLowerCase() || '';
        const team = manager.team?.toLowerCase() || '';
        const searchLower = searchTerm.toLowerCase();
        
        return name.includes(searchLower) || 
               code.includes(searchLower) || 
               team.includes(searchLower);
      });
      
      isLoadingManagers = false;
      return { 
        managers: filteredManagers.slice(0, MANAGER_PAGE_SIZE), 
        hasMore: filteredManagers.length > MANAGER_PAGE_SIZE,
        totalFound: filteredManagers.length 
      };
    }
    
    // 일반 조회 (페이지네이션)
    managerQuery = query(
      managerQuery, 
      orderBy("createdAt", "asc"), 
      limit(MANAGER_PAGE_SIZE)
    );
    
    if (isLoadMore && lastManagerVisible) {
      managerQuery = query(
        collection(db, "managers"),
        orderBy("createdAt", "asc"),
        startAfter(lastManagerVisible),
        limit(MANAGER_PAGE_SIZE)
      );
    } else {
      lastManagerVisible = null;
    }
    
    const snapshot = await getDocs(managerQuery);
    const managers = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      managers.push({
        id: doc.id,
        ...data
      });
    });
    
    if (snapshot.docs.length > 0) {
      lastManagerVisible = snapshot.docs[snapshot.docs.length - 1];
    }
    
    const hasMore = snapshot.docs.length === MANAGER_PAGE_SIZE;
    
    isLoadingManagers = false;
    return { managers, hasMore };
    
  } catch (error) {
    console.error("담당자 로드 실패:", error);
    isLoadingManagers = false;
    return { managers: [], hasMore: false };
  }
}

// 담당자 정보 저장 (서버 사이드 함수 호출)
export async function saveManager(managerData) {
  try {
    const saveManagerInfo = httpsCallable(functions, 'saveManagerInfo');
    const result = await saveManagerInfo({ data: managerData });
    return { success: true, data: result.data };
  } catch (error) {
    console.error("담당자 정보 저장 실패:", error);
    return { success: false, error: error.message };
  }
}

// 담당자 정보 업데이트 (서버 사이드 함수 호출)
export async function updateManager(managerId, managerData) {
  try {
    const updateManagerInfo = httpsCallable(functions, 'updateManagerInfo');
    const result = await updateManagerInfo({ 
      data: { 
        ...managerData, 
        managerId 
      } 
    });
    return { success: true, data: result.data };
  } catch (error) {
    console.error("담당자 정보 업데이트 실패:", error);
    return { success: false, error: error.message };
  }
}

// 담당자 삭제
export async function deleteManager(managerId) {
  try {
    const managerRef = doc(db, "managers", managerId);
    await deleteDoc(managerRef);
    return { success: true };
  } catch (error) {
    console.error("담당자 삭제 실패:", error);
    return { success: false, error: error.message };
  }
}

// 담당자 비밀번호 설정
export async function setManagerPassword(managerId, password) {
  try {
    const setManagerPassword = httpsCallable(functions, 'setManagerPassword');
    const result = await setManagerPassword({ managerId, password });
    return { success: true, data: result.data };
  } catch (error) {
    console.error("담당자 비밀번호 설정 실패:", error);
    return { success: false, error: error.message };
  }
}

// 담당자 인증
export async function authenticateManager(code, password) {
  try {
    const authenticateManager = httpsCallable(functions, 'authenticateManager');
    const result = await authenticateManager({ data: { code, password } });
    return { success: true, manager: result.data.manager };
  } catch (error) {
    console.error("담당자 인증 실패:", error);
    return { success: false, error: error.message };
  }
}

// 담당자 비밀번호 변경
export async function changeManagerPassword(managerId, currentPassword, newPassword) {
  try {
    const changeManagerPassword = httpsCallable(functions, 'changeManagerPassword');
    const result = await changeManagerPassword({ 
      data: { managerId, currentPassword, newPassword } 
    });
    return { success: true, data: result.data };
  } catch (error) {
    console.error("담당자 비밀번호 변경 실패:", error);
    return { success: false, error: error.message };
  }
}

// 기존 담당자들에게 일괄 기본 비밀번호 설정
export async function setupBulkManagerPasswords() {
  try {
    const setupBulkManagerPasswords = httpsCallable(functions, 'setupBulkManagerPasswords');
    const result = await setupBulkManagerPasswords();
    return { success: true, data: result.data };
  } catch (error) {
    console.error("일괄 비밀번호 설정 실패:", error);
    return { success: false, error: error.message };
  }
}

// 담당자별 고객 수 조회
export async function getManagerClientCounts() {
  try {
    // 모든 고객 데이터에서 담당자별 카운트
    const clientSnapshot = await getDocs(collection(db, "client_info"));
    const managerCounts = {};
    
    clientSnapshot.forEach((doc) => {
      const data = doc.data();
      const managerName = data.managerName || '미지정';
      managerCounts[managerName] = (managerCounts[managerName] || 0) + 1;
    });
    
    return { success: true, counts: managerCounts };
  } catch (error) {
    console.error("담당자별 고객 수 조회 실패:", error);
    return { success: false, error: error.message, counts: {} };
  }
}

// 담당자 통계 조회
export async function getManagerStats() {
  try {
    const snapshot = await getDocs(collection(db, "managers"));
    const stats = {
      total: snapshot.size,
      byTeam: {},
      withPassword: 0,
      withoutPassword: 0
    };
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // 팀별 통계
      const team = data.team || '미지정';
      stats.byTeam[team] = (stats.byTeam[team] || 0) + 1;
      
      // 비밀번호 설정 여부
      if (data.password) {
        stats.withPassword++;
      } else {
        stats.withoutPassword++;
      }
    });
    
    return { success: true, stats };
  } catch (error) {
    console.error("담당자 통계 조회 실패:", error);
    return { success: false, error: error.message };
  }
}

// 페이지네이션 상태 초기화
export function resetManagerPagination() {
  lastManagerVisible = null;
  isLoadingManagers = false;
}

// 현재 로딩 상태 확인
export function isManagerLoading() {
  return isLoadingManagers;
}

// 담당자 코드 중복 확인
export async function checkManagerCodeExists(code, excludeId = null) {
  try {
    const managerQuery = query(
      collection(db, "managers"),
      where("code", "==", code)
    );
    
    const snapshot = await getDocs(managerQuery);
    
    // 수정 시 자기 자신은 제외
    if (excludeId && snapshot.size === 1) {
      const doc = snapshot.docs[0];
      if (doc.id === excludeId) {
        return false;
      }
    }
    
    return snapshot.size > 0;
  } catch (error) {
    console.error("담당자 코드 중복 확인 실패:", error);
    return false;
  }
}