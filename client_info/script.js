import { db, collection, addDoc, updateDoc, doc } from "./database.js";
// import { currentConfig } from "./config.js";
import { getDocs, collection as fsCollection, onSnapshot, query, orderBy, getDoc, where } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-storage.js";
import { Timestamp } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-functions.js";

// Firebase Auth 초기화
const auth = getAuth();

// Firebase Functions 초기화
const functions = getFunctions();

// 암호화 키는 더 이상 클라이언트에서 사용하지 않음 (서버 사이드로 이동)
// const ENCRYPT_KEY = window.currentConfig.encryptKey;
// window.ENCRYPT_KEY = ENCRYPT_KEY;

// 암호화 키를 미리 생성 (CryptoJS 최적화) - 제거
// const encryptionKey = window.CryptoJS.enc.Utf8.parse(ENCRYPT_KEY);
// function encryptSSN(ssn) {
//   return window.CryptoJS.AES.encrypt(ssn, ENCRYPT_KEY).toString();
// }

// Firebase Storage 초기화
const storage = getStorage();

// 파일 업로드 관련 변수
let uploadedFiles = [];

// 파일 크기 제한 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// 허용된 파일 형식
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

// 파일 크기 포맷팅 함수
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 파일 검증 함수
function validateFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, message: 'PDF, JPG, PNG 파일만 업로드 가능합니다.' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, message: '파일 크기는 10MB 이하여야 합니다.' };
  }
  return { valid: true };
}

// 파일 아이콘 가져오기 함수
function getFileIcon(fileType) {
  if (fileType.startsWith('image/')) {
    return '<i class="fas fa-image"></i>';
  } else if (fileType === 'application/pdf') {
    return '<i class="fas fa-file-pdf"></i>';
  }
  return '<i class="fas fa-paperclip"></i>';
}

function updateFileSelectedCount() {
  const fileSelectedCount = document.getElementById('fileSelectedCount');
  if (fileSelectedCount) {
    fileSelectedCount.textContent = `파일 ${uploadedFiles.length}개`;
  }
}

// 파일 리스트 렌더링 함수
function renderFileList() {
  const fileList = document.getElementById('fileList');
  const fileCount = document.getElementById('fileCount');
  if (fileCount) {
    fileCount.textContent = `업로드된 파일: ${uploadedFiles.length}개`;
  }
  updateFileSelectedCount();
  if (!fileList) return;
  
  fileList.innerHTML = uploadedFiles.map((file, index) => {
    const icon = getFileIcon(file.type);
    const isImage = file.type.startsWith('image/');
    
    return `
      <div class="file-item" data-index="${index}">
        ${isImage ? `<img src="${file.preview}" class="file-preview-img" alt="미리보기" />` : `<div class="file-icon">${icon}</div>`}
        <div class="file-details">
          <div class="file-name">${file.name}</div>
          <div class="file-size">${formatFileSize(file.size)}</div>
          <div class="file-status ${file.status || ''}">${file.statusText || ''}</div>
        </div>
        <button class="remove-file">삭제</button>
      </div>
    `;
  }).join('');
}

// 파일 리스트 삭제 이벤트 위임
function setupFileListRemoveHandler() {
  const fileList = document.getElementById('fileList');
  if (!fileList) return;
  fileList.addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-file')) {
      const item = e.target.closest('.file-item');
      if (item) {
        const index = parseInt(item.dataset.index, 10);
        if (!isNaN(index)) {
          uploadedFiles.splice(index, 1);
          renderFileList();
        }
      }
    }
  });
}

// 파일 추가 함수
function addFiles(files) {
  Array.from(files).forEach(file => {
    const validation = validateFile(file);
    if (validation.valid) {
      // 파일에 고유 ID 추가
      const fileId = Date.now() + Math.random();
      const fileObj = {
        id: fileId,
        file: file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending',
        statusText: '대기 중'
      };
      
      // 이미지 파일인 경우 미리보기 생성
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
          fileObj.preview = e.target.result;
          renderFileList();
        };
        reader.readAsDataURL(file);
      }
      
      uploadedFiles.push(fileObj);
      renderFileList();
    } else {
      alert(`${file.name}: ${validation.message}`);
    }
  });
}

// 파일 업로드 함수
async function uploadFileToStorage(file, folder) {
  try {
    const timestamp = Date.now();
    const fileName = `${folder}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('파일 업로드 실패:', error);
    throw error;
  }
}

// 파일 업로드 이벤트 리스너 설정
function setupFileUploadListeners() {
  const attachmentsInput = document.getElementById('attachments');
  if (attachmentsInput) {
    attachmentsInput.addEventListener('change', function(e) {
      const files = e.target.files;
      if (files.length > 0) {
        addFiles(files);
      }
    });
  }
}

// 서류만 업로드 체크박스 이벤트 리스너 설정
function setupDocumentOnlyCheckbox() {
  const documentOnlyCheckbox = document.getElementById('documentOnly');
  if (!documentOnlyCheckbox) return;
  
  documentOnlyCheckbox.addEventListener('change', function() {
    toggleFormFields(this.checked);
  });
}

// 서류만 업로드 모드일 때 폼 필드 토글
function toggleFormFields(documentOnlyMode) {
  const requiredFields = [
    'name', 'phone', 'attachments'
  ];
  
  const optionalFields = [
    'ssnFront', 'ssnBack', 'areaCode', 'companyPhone',
    'postcode', 'address', 'addressDetail', 'occupation', 'jobDetail',
    'height', 'weight', 'medicalHistory', 'driving', 'employeeCount',
    'memo'
  ];
  
  const requiredLabels = [
    'name', 'phone', 'attachments'
  ];
  
  const optionalLabels = [
    'ssn', 'areaCode', 'companyPhone', 'address',
    'occupation', 'jobDetail', 'height', 'weight', 'medicalHistory',
    'driving', 'employeeCount', 'memo'
  ];
  
  if (documentOnlyMode) {
    // 서류만 업로드 모드: 이름, 핸드폰번호, 첨부파일만 표시
    optionalFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.closest('.form-group').style.display = 'none';
      }
    });
    
    optionalLabels.forEach(labelId => {
      const label = document.querySelector(`label[for="${labelId}"]`);
      if (label) {
        label.closest('.form-group').style.display = 'none';
      }
    });
    
    // 주민등록번호 필드 숨기기
    const ssnGroup = document.querySelector('.ssn-group');
    if (ssnGroup) {
      ssnGroup.closest('.form-group').style.display = 'none';
    }
    
    // 회사전화번호 필드 숨기기
    const companyPhoneGroup = document.querySelector('.company-phone-group');
    if (companyPhoneGroup) {
      companyPhoneGroup.closest('.form-group').style.display = 'none';
    }
    
    // 보험사 선택 필드들 숨기기 (첨부파일 업로드 섹션은 보이도록)
    const insuranceSections = document.querySelectorAll('.form-section');
    insuranceSections.forEach(section => {
      // 첨부파일 업로드 섹션인지 확인
      const hasAttachments = section.querySelector('#attachments');
      if (!hasAttachments) {
        section.style.display = 'none';
      }
    });
    
    // 제출 버튼 텍스트 변경
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
      submitBtn.textContent = '제출하기';
    }
    
  } else {
    // 일반 모드: 모든 필드 표시
    optionalFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.closest('.form-group').style.display = '';
      }
    });
    
    optionalLabels.forEach(labelId => {
      const label = document.querySelector(`label[for="${labelId}"]`);
      if (label) {
        label.closest('.form-group').style.display = '';
      }
    });
    
    // 주민등록번호 필드 표시
    const ssnGroup = document.querySelector('.ssn-group');
    if (ssnGroup) {
      ssnGroup.closest('.form-group').style.display = '';
    }
    
    // 회사전화번호 필드 표시
    const companyPhoneGroup = document.querySelector('.company-phone-group');
    if (companyPhoneGroup) {
      companyPhoneGroup.closest('.form-group').style.display = '';
    }
    
    // 모든 form-section 표시
    const insuranceSections = document.querySelectorAll('.form-section');
    insuranceSections.forEach(section => {
      section.style.display = '';
    });
    
    // 제출 버튼 텍스트 복원
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
      submitBtn.textContent = '제출하기';
    }
  }
}

// 드래그 앤 드롭 기능
function setupDragAndDrop() {
  const container = document.querySelector('.file-upload-container');
  if (!container) return;
  
  container.addEventListener('dragover', function(e) {
    e.preventDefault();
    container.classList.add('dragover');
  });
  
  container.addEventListener('dragleave', function(e) {
    e.preventDefault();
    container.classList.remove('dragover');
  });
  
  container.addEventListener('drop', function(e) {
    e.preventDefault();
    container.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      addFiles(files);
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  // URL에서 담당자 코드 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  const managerCode = urlParams.get('manager');
  const managerInput = document.getElementById("manager");
  
  // 담당자 정보 가져오기
  async function getManagerInfo(code) {
    try {
      // code 필드로 쿼리해서 담당자 찾기
      const q = query(fsCollection(db, "managers"), where("code", "==", code));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const managerData = snapshot.docs[0].data();
        managerInput.value = managerData.name;
        managerInput.readOnly = true;
        document.getElementById("clientInfoForm").style.display = "block";
        document.getElementById("managerError").style.display = "none";
      } else {
        document.getElementById("clientInfoForm").style.display = "none";
        document.getElementById("managerError").style.display = "block";
      }
    } catch (error) {
      console.error("담당자 정보 조회 실패:", error);
      document.getElementById("clientInfoForm").style.display = "none";
      document.getElementById("managerError").style.display = "block";
    }
  }

  if (managerCode) {
    getManagerInfo(managerCode);
  } else {
    managerInput.value = "";
    managerInput.readOnly = false;
    document.getElementById("clientInfoForm").style.display = "block";
    document.getElementById("managerError").style.display = "none";
  }

  function execDaumPostcode() {
    new daum.Postcode({
      oncomplete: function (data) {
        document.getElementById("postcode").value = data.zonecode;
        document.getElementById("address").value = data.address;
        document.getElementById("addressDetail").focus();
      },
    }).open();
  }

  document.getElementById("phone").addEventListener("input", function (e) {
    let value = e.target.value.replace(/[^0-9]/g, "");
    if (value.length > 3 && value.length <= 7) {
      value = value.slice(0, 3) + "-" + value.slice(3);
    } else if (value.length > 7) {
      value =
        value.slice(0, 3) + "-" + value.slice(3, 7) + "-" + value.slice(7);
    }
    e.target.value = value;

    // samePhone 체크 시 회사전화번호도 동기화
    const samePhone = document.getElementById("samePhone");
    const companyPhone = document.getElementById("companyPhone");
    if (samePhone.checked) {
      companyPhone.value = value.replace(/[^0-9]/g, "");
    }
  });

  document
    .getElementById("companyPhone")
    .addEventListener("input", function (e) {
      let value = e.target.value.replace(/[^0-9]/g, "");
      if (value.length > 4) {
        value = value.slice(0, 4) + "-" + value.slice(4);
      }
      e.target.value = value;
    });

  document.getElementById("samePhone").addEventListener("change", function (e) {
    const areaCode = document.getElementById("areaCode");
    const companyPhone = document.getElementById("companyPhone");
    const areaCodeError = document.getElementById("areaCode-error");
    const phone = document.getElementById("phone");

    if (e.target.checked) {
      areaCode.disabled = true;
      companyPhone.disabled = true;
      areaCode.value = "";
      // 핸드폰 번호에서 숫자만 추출하여 회사전화에 입력
      companyPhone.value = phone.value.replace(/[^0-9]/g, "");
      companyPhone.readOnly = true;
      areaCode.classList.remove("error");
      areaCodeError.classList.remove("show");
    } else {
      areaCode.disabled = false;
      companyPhone.disabled = false;
      companyPhone.readOnly = false;
      companyPhone.value = "";
      // 체크 해제 시에는 즉시 유효성 검사를 하지 않음
      // validateField("areaCode", "areaCode-error");
    }
  });

  // 필수 입력 필드 검사 함수
  function validateField(fieldId, errorId) {
    // 담당자명은 필수 검사에서 제외
    if (fieldId === "manager") return true;
    const field = document.getElementById(fieldId);
    const error = document.getElementById(errorId);

    if (!field.value && field.type !== "checkbox") {
      field.classList.add("error");
      error.classList.add("show");
      return false;
    } else if (field.type === "checkbox" && !field.checked) {
      field.classList.add("error");
      error.classList.add("show");
      return false;
    } else {
      field.classList.remove("error");
      error.classList.remove("show");
      return true;
    }
  }

  // 필수 입력 필드 blur 이벤트 처리
  const requiredFields = {
    name: "name-error",
    // relationship: "relationship-error",
    ssnFront: "ssn-error",
    ssnBack: "ssn-error",
    phoneCarrier: "phoneCarrier-error",
    phone: "phone-error",
    address: "address-error",
    addressDetail: "address-error",
    occupation: "occupation-error",
    medicalHistory: "medicalHistory-error",
    driving: "driving-error",
    agree1: "agree1-error",
    agree2: "agree2-error"
  };

  Object.keys(requiredFields).forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener("blur", () => {
        validateField(fieldId, requiredFields[fieldId]);
      });
    }
  });

  // 주민번호, 회사전화, 키, 몸무게, 직원수는 숫자만 입력 가능
  const numberOnlyInputs = [
    "ssnFront",
    "ssnBack",
    "companyPhone",
    "height",
    "weight",
    "employeeCount",
  ];

  numberOnlyInputs.forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener("input", function (e) {
        this.value = this.value.replace(/[^0-9]/g, "");
      });
      input.addEventListener("keypress", function (e) {
        if (!/[0-9]/.test(e.key)) {
          e.preventDefault();
        }
      });
    }
  });

  // 핸드폰번호 검사
  document.getElementById("phoneCarrier").addEventListener("change", () => {
    validateField("phoneCarrier", "phoneCarrier-error");
  });
  document.getElementById("phone").addEventListener("blur", () => {
    validateField("phone", "phone-error");
  });

  // 체크박스 변경 이벤트 처리
  document.getElementById("agree1").addEventListener("change", function () {
    validateField("agree1", "agree1-error");
  });

  document.getElementById("agree2").addEventListener("change", function () {
    validateField("agree2", "agree2-error");
  });

  // 주소 검색 버튼뿐 아니라 우편번호 입력란 클릭 시에도 팝업이 뜨도록 추가
  document.getElementById("postcode").addEventListener("click", function () {
    execDaumPostcode();
  });

  // 폼 초기화 함수
  function resetForm() {
    const form = document.getElementById("clientInfoForm");
    const managerInput = document.getElementById("manager");
    let managerName = '';
    const urlParams = new URLSearchParams(window.location.search);

    // 담당자 링크로 들어온 경우, 초기화 전에 담당자명 저장
    if (urlParams.has('manager') && managerInput) {
      managerName = managerInput.value;
    }

    // 폼 전체 초기화
    form.reset();

    // 담당자 링크로 들어온 경우, 저장했던 담당자명 복원
    if (urlParams.has('manager') && managerInput) {
      managerInput.value = managerName;
    }

    // 개인정보제공동의 아이콘 초기화 (form.reset()이 숨겨진 체크박스를 초기화하므로 아이콘도 동기화)
    document.getElementById("agree1-icon").classList.remove("checked");
    document.getElementById("agree2-icon").classList.remove("checked");

    // 에러 메시지 및 스타일 초기화
    document.querySelectorAll('.error-message.show').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

    // 파일 업로드 관련 데이터 및 UI 초기화
    const attachmentsInput = document.getElementById('attachments');
    if (attachmentsInput) {
      attachmentsInput.value = '';
    }
    uploadedFiles = [];
    renderFileList();
    
    // 회사 전화번호 필드 상태 수동 초기화
    const areaCode = document.getElementById("areaCode");
    const companyPhone = document.getElementById("companyPhone");
    if (areaCode) areaCode.disabled = false;
    if (companyPhone) {
      companyPhone.disabled = false;
      companyPhone.readOnly = false;
    }

    // 폼 필드를 기본 상태로 복원
    toggleFormFields(false);
  }

  // 폼 제출 처리
  document.getElementById("clientInfoForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    // 서류만 업로드 모드인지 확인
    const documentOnlyMode = document.getElementById('documentOnly').checked;

    // 서류만 업로드 모드일 때는 이름과 핸드폰번호만 검증
    if (documentOnlyMode) {
      const name = document.getElementById("name").value.trim();
      const phone = document.getElementById("phone").value.trim();
      
      if (!name || !phone) {
        alert('이름과 핸드폰번호를 입력해주세요.');
        return;
      }
      
      if (uploadedFiles.length === 0) {
        alert('업로드할 서류를 선택해주세요.');
        return;
      }
    } else {
      // 일반 모드: 기존 유효성 검사
      let isValid = true;
      Object.entries(requiredFields).forEach(([fieldId, errorId]) => {
        const field = document.getElementById(fieldId);
        const error = document.getElementById(errorId);
        if (fieldId === "manager") {
          if (!field.value) {
            field.classList.add("error");
            error.classList.add("show");
            isValid = false;
          } else {
            field.classList.remove("error");
            error.classList.remove("show");
          }
        } else if (!field.value && field.type !== "checkbox") {
          field.classList.add("error");
          error.classList.add("show");
          isValid = false;
        } else if (field.type === "checkbox" && !field.checked) {
          field.classList.add("error");
          error.classList.add("show");
          isValid = false;
        } else {
          field.classList.remove("error");
          error.classList.remove("show");
        }
      });

      if (!isValid) {
        return;
      }
    }

    // 제출 버튼 비활성화
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '제출 중...';

    try {
      // 파일 업로드 처리 (모든 파일 업로드가 끝난 후에만 Firestore에 저장)
      let fileUrls = {};
      if (uploadedFiles.length > 0) {
        const fileUploadPromises = uploadedFiles.map(async (fileObj) => {
          try {
            const downloadURL = await uploadFileToStorage(fileObj.file, 'attachments');
            fileObj.status = 'success';
            fileObj.statusText = '업로드 성공';
            fileObj.url = downloadURL;
            return [fileObj.file.name, downloadURL];
          } catch (error) {
            fileObj.status = 'error';
            fileObj.statusText = '업로드 실패';
            return null;
          }
        });
        const fileUrlsArray = (await Promise.all(fileUploadPromises)).filter(Boolean);
        fileUrls = Object.fromEntries(fileUrlsArray);
      }

      if (documentOnlyMode) {
        // 서류만 업로드 모드: 기존 고객 찾아서 서류만 추가
        const name = document.getElementById("name").value.trim();
        const phone = document.getElementById("phone").value.trim();
        
        // 기존 고객 검색
        const clientsRef = collection(db, "client_info");
        const q = query(clientsRef, where("name", "==", name), where("phone", "==", phone));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          alert('해당 이름과 핸드폰번호로 등록된 고객을 찾을 수 없습니다. 일반 모드로 고객 정보를 먼저 등록해주세요.');
          submitBtn.disabled = false;
          submitBtn.textContent = '제출하기';
          return;
        }
        
        // 첫 번째 매칭되는 고객에 서류 추가
        const clientDoc = querySnapshot.docs[0];
        const clientData = clientDoc.data();
        
        // 기존 첨부파일과 새 첨부파일 병합
        const existingAttachments = clientData.attachments || {};
        const updatedAttachments = { ...existingAttachments, ...fileUrls };
        
        // Firestore 업데이트
        await updateDoc(doc(db, "client_info", clientDoc.id), {
          attachments: updatedAttachments,
          updated_at: Timestamp.now()
        });
        
        alert('서류가 성공적으로 추가되었습니다.');
        resetForm();
        
      } else {
        // 일반 모드: 새 고객 등록
        const name = document.getElementById("name").value.trim();
        const phone = document.getElementById("phone").value.trim();

        // 중복 등록 확인
        const clientsRef = collection(db, "client_info");
        const q = query(clientsRef, where("name", "==", name), where("phone", "==", phone));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          alert('이미 동일한 이름과 핸드폰번호로 등록된 고객이 존재합니다.');
          submitBtn.disabled = false;
          submitBtn.textContent = '제출하기';
          return;
        }

        // 입력값 수집
        const plainSSN =
          document.getElementById("ssnFront").value +
          "-" +
          document.getElementById("ssnBack").value;

        const data = {
          name: document.getElementById("name") ? document.getElementById("name").value : "",
          ssn: plainSSN, // 평문으로 전송 (서버에서 암호화)
          phoneCarrier: document.getElementById("phoneCarrier") ? document.getElementById("phoneCarrier").value : "",
          phone: document.getElementById("phone") ? document.getElementById("phone").value : "",
          areaCode: document.getElementById("areaCode") ? document.getElementById("areaCode").value : "",
          companyPhone: document.getElementById("companyPhone") ? document.getElementById("companyPhone").value : "",
          samePhone: document.getElementById("samePhone") ? document.getElementById("samePhone").checked : false,
          postcode: document.getElementById("postcode") ? document.getElementById("postcode").value : "",
          address: document.getElementById("address") ? document.getElementById("address").value : "",
          addressDetail: document.getElementById("addressDetail") ? document.getElementById("addressDetail").value : "",
          occupation: document.getElementById("occupation") ? document.getElementById("occupation").value : "",
          jobDetail: document.getElementById("jobDetail") ? document.getElementById("jobDetail").value : "",
          height: document.getElementById("height") ? document.getElementById("height").value : "",
          weight: document.getElementById("weight") ? document.getElementById("weight").value : "",
          medicalHistory: document.getElementById("medicalHistory") ? document.getElementById("medicalHistory").value : "",
          driving: document.getElementById("driving") ? document.getElementById("driving").value : "",
          employeeCount: document.getElementById("employeeCount") ? document.getElementById("employeeCount").value : "",
          agree1: document.getElementById("agree1") ? document.getElementById("agree1").checked : false,
          agree2: document.getElementById("agree2") ? document.getElementById("agree2").checked : false,
          manager: document.getElementById("manager") ? document.getElementById("manager").value : "",
          memo: document.getElementById("memo") ? document.getElementById("memo").value : "",
          attachments: fileUrls,
          created_at: Timestamp.now()
        };

        // Firebase Functions를 통해 저장 (서버에서 암호화)
        const saveClientInfoFunction = httpsCallable(functions, 'saveClientInfo');
        await saveClientInfoFunction(data);

        // 성공 메시지
        alert("고객 정보가 성공적으로 제출되었습니다!");
        resetForm();
      }

    } catch (error) {
      console.error("제출 실패:", error);
      alert("제출 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      // 제출 버튼 다시 활성화
      submitBtn.disabled = false;
      submitBtn.textContent = '제출하기';
    }
  });

  window.execDaumPostcode = execDaumPostcode;
  window.openModal = function (id) {
    document.getElementById(id).style.display = "block";
  };
  window.closeModal = function (id) {
    document.getElementById(id).style.display = "none";
  };
  window.toggleConsent = function (id) {
    const icon = document.getElementById(id + "-icon");
    const checkbox = document.getElementById(id);
    checkbox.checked = !checkbox.checked;
    icon.classList.toggle("checked", checkbox.checked);
    validateField(id, id + "-error");
  };

  // Firestore에서 담당자 목록 실시간 반영
  function setupManagerSelectRealtime() {
    const managerSearch = document.getElementById("managerSearch");
    const managerDropdown = document.getElementById("managerDropdown");
    const managerInput = document.getElementById("manager");
    if (!managerSearch || !managerDropdown || !managerInput) return; // 요소가 없으면 함수 종료

    let managers = [];

    function createManagerItem(manager) {
      const div = document.createElement("div");
      div.className = "manager-item";
      div.innerHTML = `
        <div class="manager-code">${manager.code}</div>
        <div class="manager-info">${manager.team || ''} ${manager.role || ''}</div>
      `;
      div.addEventListener("click", () => {
        managerSearch.value = manager.code;
        managerInput.value = manager.code;
        managerDropdown.classList.remove("show");
        validateField("manager", "manager-error");
      });
      return div;
    }

    function filterManagers(searchText) {
      return managers.filter(manager => 
        manager.code.toLowerCase().includes(searchText.toLowerCase()) ||
        (manager.team && manager.team.toLowerCase().includes(searchText.toLowerCase())) ||
        (manager.role && manager.role.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    function updateDropdown(searchText) {
      managerDropdown.innerHTML = "";
      const filteredManagers = filterManagers(searchText);
      filteredManagers.forEach(manager => {
        managerDropdown.appendChild(createManagerItem(manager));
      });
      managerDropdown.classList.toggle("show", filteredManagers.length > 0);
    }

    // 검색어 입력 이벤트
    managerSearch.addEventListener("input", (e) => {
      updateDropdown(e.target.value);
    });

    // 클릭 이벤트로 드롭다운 토글
    managerSearch.addEventListener("click", () => {
      updateDropdown(managerSearch.value);
    });

    // 외부 클릭 시 드롭다운 닫기
    document.addEventListener("click", (e) => {
      if (!managerSearch.contains(e.target) && !managerDropdown.contains(e.target)) {
        managerDropdown.classList.remove("show");
      }
    });

    // Firestore에서 담당자 목록 가져오기
    const q = query(fsCollection(db, "managers"), orderBy("code", "asc"));
    onSnapshot(q, (snapshot) => {
      managers = [];
      snapshot.forEach(doc => {
        managers.push({
          code: doc.data().code,
          team: doc.data().team,
          role: doc.data().role
        });
      });
      updateDropdown(managerSearch.value);
    });
  }
  setupManagerSelectRealtime();

  setupFileUploadListeners();
  setupDragAndDrop();
  setupFileListRemoveHandler();
  setupDocumentOnlyCheckbox();
});
 