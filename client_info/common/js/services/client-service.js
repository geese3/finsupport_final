import { collection, getDocs, query, where, doc, updateDoc, addDoc, deleteDoc, orderBy, Timestamp, limit, startAfter } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-functions.js";
import { db, functions } from "../core/firebase-config.js";
import { decryptSSN } from "../core/encryption.js";

// 페이지네이션 상태 관리
let lastVisible = null;
let isLoadingClients = false;
const PAGE_SIZE = 5;

// 고객 데이터 조회 (페이지네이션 포함)
export async function loadClients(searchTerm = '', isLoadMore = false) {
  try {
    if (isLoadingClients) return { clients: [], hasMore: false };
    
    isLoadingClients = true;
    
    let clientQuery = collection(db, "client_info");
    
    // 검색어가 있는 경우
    if (searchTerm) {
      // 검색은 페이지네이션 없이 전체 결과 반환
      const snapshot = await getDocs(clientQuery);
      const allClients = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        allClients.push({
          id: doc.id,
          ...data
        });
      });
      
      // 클라이언트 사이드에서 검색 필터링
      const filteredClients = allClients.filter(client => {
        const name = client.name?.toLowerCase() || '';
        const phone = client.phone?.replace(/-/g, '') || '';
        const managerName = client.managerName?.toLowerCase() || '';
        const searchLower = searchTerm.toLowerCase().replace(/-/g, '');
        
        return name.includes(searchLower) || 
               phone.includes(searchLower) || 
               managerName.includes(searchLower);
      });
      
      isLoadingClients = false;
      return { 
        clients: filteredClients.slice(0, PAGE_SIZE), 
        hasMore: filteredClients.length > PAGE_SIZE,
        totalFound: filteredClients.length 
      };
    }
    
    // 일반 조회 (페이지네이션)
    clientQuery = query(
      clientQuery, 
      orderBy("created_at", "desc"), 
      limit(PAGE_SIZE)
    );
    
    if (isLoadMore && lastVisible) {
      clientQuery = query(
        collection(db, "client_info"),
        orderBy("created_at", "desc"),
        startAfter(lastVisible),
        limit(PAGE_SIZE)
      );
    } else {
      lastVisible = null; // 새로운 로드일 때 초기화
    }
    
    const snapshot = await getDocs(clientQuery);
    const clients = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      clients.push({
        id: doc.id,
        ...data
      });
    });
    
    // 마지막 문서 저장 (다음 페이지를 위해)
    if (snapshot.docs.length > 0) {
      lastVisible = snapshot.docs[snapshot.docs.length - 1];
    }
    
    const hasMore = snapshot.docs.length === PAGE_SIZE;
    
    isLoadingClients = false;
    return { clients, hasMore };
    
  } catch (error) {
    console.error("클라이언트 로드 실패:", error);
    isLoadingClients = false;
    return { clients: [], hasMore: false };
  }
}

// 고객 정보 업데이트
export async function updateClient(clientId, updateData) {
  try {
    const clientRef = doc(db, "client_info", clientId);
    await updateDoc(clientRef, {
      ...updateData,
      updated_at: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    console.error("고객 정보 업데이트 실패:", error);
    return { success: false, error: error.message };
  }
}

// 고객 정보 삭제
export async function deleteClient(clientId) {
  try {
    const clientRef = doc(db, "client_info", clientId);
    await deleteDoc(clientRef);
    return { success: true };
  } catch (error) {
    console.error("고객 정보 삭제 실패:", error);
    return { success: false, error: error.message };
  }
}

// 고객 정보 저장 (서버 사이드 함수 호출)
export async function saveClient(clientData) {
  try {
    const saveClientInfo = httpsCallable(functions, 'saveClientInfo');
    const result = await saveClientInfo({ data: clientData });
    return { success: true, data: result.data };
  } catch (error) {
    console.error("고객 정보 저장 실패:", error);
    return { success: false, error: error.message };
  }
}

// 암호화된 고객 정보 복호화 (서버 사이드 함수 호출)
export async function getDecryptedClientInfo(docId) {
  try {
    const getDecryptedClientInfo = httpsCallable(functions, 'getDecryptedClientInfo');
    const result = await getDecryptedClientInfo({ docId });
    return { success: true, data: result.data };
  } catch (error) {
    console.error("고객 정보 복호화 실패:", error);
    return { success: false, error: error.message };
  }
}

// 특정 담당자의 고객 조회
export async function getClientsByManager(managerName) {
  try {
    const clientQuery = query(
      collection(db, "client_info"),
      where("managerName", "==", managerName),
      orderBy("created_at", "desc")
    );
    
    const snapshot = await getDocs(clientQuery);
    const clients = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      clients.push({
        id: doc.id,
        ...data
      });
    });
    
    return { success: true, clients };
  } catch (error) {
    console.error("담당자별 고객 조회 실패:", error);
    return { success: false, error: error.message, clients: [] };
  }
}

// 고객 통계 조회
export async function getClientStats() {
  try {
    const snapshot = await getDocs(collection(db, "client_info"));
    const stats = {
      total: snapshot.size,
      byManager: {},
      recent: 0 // 최근 30일
    };
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // 담당자별 통계
      const managerName = data.managerName || '미지정';
      stats.byManager[managerName] = (stats.byManager[managerName] || 0) + 1;
      
      // 최근 30일 통계
      if (data.created_at && data.created_at.toDate() > thirtyDaysAgo) {
        stats.recent++;
      }
    });
    
    return { success: true, stats };
  } catch (error) {
    console.error("고객 통계 조회 실패:", error);
    return { success: false, error: error.message };
  }
}

// 페이지네이션 상태 초기화
export function resetClientPagination() {
  lastVisible = null;
  isLoadingClients = false;
}

// 현재 로딩 상태 확인
export function isClientLoading() {
  return isLoadingClients;
}