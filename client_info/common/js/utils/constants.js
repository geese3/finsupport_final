// 애플리케이션 상수들

// 페이지네이션 관련
export const PAGINATION = {
  CLIENT_PAGE_SIZE: 5,
  MANAGER_PAGE_SIZE: 10,
  SEARCH_DEBOUNCE_DELAY: 300
};

// 모달 타입
export const MODAL_TYPES = {
  VIEW: 'view-modal',
  EDIT: 'edit-modal',
  FIELD: 'field-modal',
  CLIENT: 'client-modal'
};

// 메뉴 타입
export const MENU_TYPES = {
  MANAGERS: 'menu-managers',
  CLIENTS: 'menu-clients', 
  MANAGER_INFO: 'menu-manager-info',
  EXAM_SCHEDULE: 'menu-exam-schedule'
};

// 허용된 관리자 이메일
export const ALLOWED_ADMINS = [
  "geese3433@gmail.com",
  "iqhali93@gmail.com",
  "offbeatt@naver.com"
];

// 입력 필드 유형
export const INPUT_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  PHONE: 'phone',
  SSN: 'ssn',
  PASSWORD: 'password',
  SELECT: 'select',
  CHECKBOX: 'checkbox',
  DATE: 'date'
};

// 담당자 직급
export const MANAGER_POSITIONS = [
  '부장',
  '과장',
  '대리',
  '주임',
  '사원',
  '기타'
];

// 보험 회사 타입
export const INSURANCE_TYPES = {
  LIFE: 'life',
  NON_LIFE: 'non_life'
};

// 시험 타입
export const EXAM_TYPES = {
  LIFE_INSURANCE: 'life_insurance',
  GENERAL_INSURANCE: 'general_insurance'
};

// 지역 코드 매핑
export const REGIONS = {
  '10': '서울',
  '12': '인천',
  '30': '부산',
  '32': '울산',
  '40': '대구',
  '50': '광주',
  '55': '제주',
  '87': '전주',
  '60': '대전',
  '65': '서산',
  '70': '강릉',
  '71': '원주',
  '78': '춘천'
};

// 에러 메시지
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 오류가 발생했습니다. 다시 시도해 주세요.',
  AUTHENTICATION_ERROR: '인증에 실패했습니다. 다시 로그인해 주세요.',
  PERMISSION_DENIED: '권한이 없습니다.',
  INVALID_INPUT: '입력값이 올바르지 않습니다.',
  REQUIRED_FIELD: '필수 입력 항목입니다.',
  DUPLICATE_ERROR: '이미 존재하는 데이터입니다.',
  NOT_FOUND: '요청한 데이터를 찾을 수 없습니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.'
};

// 성공 메시지
export const SUCCESS_MESSAGES = {
  SAVE_SUCCESS: '저장되었습니다.',
  UPDATE_SUCCESS: '수정되었습니다.',
  DELETE_SUCCESS: '삭제되었습니다.',
  LOGIN_SUCCESS: '로그인되었습니다.',
  LOGOUT_SUCCESS: '로그아웃되었습니다.',
  UPLOAD_SUCCESS: '업로드가 완료되었습니다.',
  EXPORT_SUCCESS: '내보내기가 완료되었습니다.'
};

// 확인 메시지
export const CONFIRM_MESSAGES = {
  DELETE_CONFIRM: '정말 삭제하시겠습니까?',
  LOGOUT_CONFIRM: '로그아웃하시겠습니까?',
  UNSAVED_CHANGES: '저장되지 않은 변경사항이 있습니다. 페이지를 떠나시겠습니까?',
  RESET_CONFIRM: '모든 입력값을 초기화하시겠습니까?',
  BULK_ACTION_CONFIRM: '선택한 항목들에 대해 일괄 작업을 수행하시겠습니까?'
};

// 로딩 메시지
export const LOADING_MESSAGES = {
  LOADING: '로딩 중...',
  SAVING: '저장 중...',
  UPLOADING: '업로드 중...',
  PROCESSING: '처리 중...',
  SEARCHING: '검색 중...',
  DELETING: '삭제 중...'
};

// 폼 유효성 검사 규칙
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^01[0-9]-\d{3,4}-\d{4}$/,
  SSN: /^\d{6}-\d{7}$/,
  MANAGER_CODE: /^[A-Z0-9]{3,10}$/,
  PASSWORD: /^.{4,}$/ // 최소 4자
};

// 파일 업로드 제한
export const FILE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ALLOWED_EXTENSIONS: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'xls', 'xlsx']
};

// 색상 테마
export const COLORS = {
  PRIMARY: '#3498db',
  SUCCESS: '#27ae60',
  WARNING: '#f39c12',
  DANGER: '#e74c3c',
  INFO: '#17a2b8',
  LIGHT: '#f8f9fa',
  DARK: '#343a40',
  SECONDARY: '#6c757d'
};

// 애니메이션 지속 시간 (ms)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500
};

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  SEARCH_HISTORY: 'search_history',
  FILTER_SETTINGS: 'filter_settings',
  LAST_LOGIN: 'last_login',
  THEME: 'theme'
};

// API 엔드포인트 (Firebase Functions)
export const API_ENDPOINTS = {
  SAVE_CLIENT_INFO: 'saveClientInfo',
  UPDATE_MANAGER_INFO: 'updateManagerInfo',
  SAVE_MANAGER_INFO: 'saveManagerInfo',
  DECRYPT_SSN: 'decryptSSN',
  ENCRYPT_SSN: 'encryptSSN',
  GET_DECRYPTED_CLIENT_INFO: 'getDecryptedClientInfo',
  AUTHENTICATE_MANAGER: 'authenticateManager',
  SET_MANAGER_PASSWORD: 'setManagerPassword',
  CHANGE_MANAGER_PASSWORD: 'changeManagerPassword',
  SETUP_BULK_MANAGER_PASSWORDS: 'setupBulkManagerPasswords',
  CRAWL_LIFE_INSURANCE_EXAM_SCHEDULE: 'crawlLifeInsuranceExamSchedule',
  GET_EXAM_SCHEDULES: 'getExamSchedules',
  MIGRATE_SSN_ENCRYPTION: 'migrateSSNEncryption',
  GET_MIGRATION_MODE: 'getMigrationMode'
};

// 기본 설정값
export const DEFAULT_SETTINGS = {
  ITEMS_PER_PAGE: 10,
  SEARCH_DEBOUNCE_DELAY: 300,
  AUTO_SAVE_INTERVAL: 30000, // 30초
  SESSION_TIMEOUT: 3600000, // 1시간
  THEME: 'light'
};

// 정규표현식 패턴
export const REGEX_PATTERNS = {
  KOREAN_NAME: /^[가-힣]{2,10}$/,
  ENGLISH_NAME: /^[a-zA-Z\s]{2,50}$/,
  MIXED_NAME: /^[가-힣a-zA-Z\s]{2,20}$/,
  PHONE_NUMBER: /^01[0-9]-\d{3,4}-\d{4}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  SSN: /^\d{6}-\d{7}$/,
  POSTAL_CODE: /^\d{5}$/,
  NUMBERS_ONLY: /^\d+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/
};

// 데이터 내보내기 형식
export const EXPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'xlsx',
  PDF: 'pdf',
  JSON: 'json'
};

// 권한 레벨
export const PERMISSION_LEVELS = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  VIEWER: 'viewer'
};

// 날짜 형식
export const DATE_FORMATS = {
  KOREA_SHORT: 'YYYY-MM-DD',
  KOREA_LONG: 'YYYY년 MM월 DD일',
  KOREA_WITH_TIME: 'YYYY-MM-DD HH:mm',
  ISO: 'YYYY-MM-DDTHH:mm:ss.sssZ'
};

// 브레이크포인트 (반응형)
export const BREAKPOINTS = {
  MOBILE: '480px',
  TABLET: '768px',
  DESKTOP: '1024px',
  LARGE_DESKTOP: '1200px'
};