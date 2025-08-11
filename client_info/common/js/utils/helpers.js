// 날짜 관련 유틸리티
export const DateUtils = {
  // Firestore Timestamp를 로컬 날짜 문자열로 변환
  formatTimestamp(timestamp) {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('날짜 변환 실패:', error);
      return '';
    }
  },

  // 날짜를 YYYY-MM-DD 형식으로 변환
  formatDateOnly(timestamp) {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('날짜 변환 실패:', error);
      return '';
    }
  },

  // 상대적 시간 표시 (예: 2시간 전, 3일 전)
  getRelativeTime(timestamp) {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return '방금 전';
      if (diffMins < 60) return `${diffMins}분 전`;
      if (diffHours < 24) return `${diffHours}시간 전`;
      if (diffDays < 30) return `${diffDays}일 전`;
      
      return this.formatDateOnly(timestamp);
    } catch (error) {
      console.error('상대 시간 계산 실패:', error);
      return '';
    }
  }
};

// 문자열 관련 유틸리티
export const StringUtils = {
  // HTML 태그 제거
  stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  },

  // 문자열 자르기 (말줄임)
  truncate(str, length = 100, suffix = '...') {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + suffix;
  },

  // 전화번호 포맷팅
  formatPhoneNumber(phone) {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    
    return phone;
  },

  // 전화번호를 배열로 분리 ("010-1234-5678" → ["010", "1234", "5678"])
  splitPhoneNumber(phone) {
    if (!phone) return ['', '', ''];
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 11) {
      return [
        cleaned.substring(0, 3),
        cleaned.substring(3, 7),
        cleaned.substring(7, 11)
      ];
    } else if (cleaned.length === 10) {
      return [
        cleaned.substring(0, 3),
        cleaned.substring(3, 6),
        cleaned.substring(6, 10)
      ];
    }
    
    return ['', '', ''];
  },

  // 통신사 포함 전화번호 파싱 ("SKT 010-1234-5678" → {carrier: "SKT", parts: ["010", "1234", "5678"]})
  parsePhoneWithCarrier(phoneWithCarrier) {
    if (!phoneWithCarrier) return { carrier: '', parts: ['', '', ''] };
    
    let phoneCarrier = '';
    let phoneNumber = phoneWithCarrier;
    
    if (phoneWithCarrier.includes(' ') && phoneWithCarrier.match(/^[A-Z가-힣]+\s/)) {
      const parts = phoneWithCarrier.split(' ');
      phoneCarrier = parts[0];
      phoneNumber = parts.slice(1).join(' ');
    }
    
    return {
      carrier: phoneCarrier,
      parts: this.splitPhoneNumber(phoneNumber)
    };
  },

  // 통신사와 전화번호 부분을 합쳐서 포맷팅 (carrier: "SKT", parts: ["010", "1234", "5678"] → "SKT 010-1234-5678")
  formatPhoneWithCarrier(carrier, parts) {
    if (!parts || parts.length !== 3) return '';
    
    const phoneNumber = parts.filter(part => part).join('-');
    if (!phoneNumber) return '';
    
    return carrier ? `${carrier} ${phoneNumber}` : phoneNumber;
  },

  // 주민등록번호 마스킹
  maskSSN(ssn) {
    if (!ssn) return '';
    
    const cleaned = ssn.replace(/\D/g, '');
    if (cleaned.length >= 7) {
      return cleaned.substring(0, 6) + '-' + cleaned[6] + '******';
    }
    
    return ssn;
  },

  // 이름 마스킹
  maskName(name) {
    if (!name) return '';
    
    if (name.length <= 2) {
      return name[0] + '*';
    } else {
      return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
    }
  },

  // 카멜케이스를 일반 문자열로 변환
  camelToNormal(str) {
    return str.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  },

  // 검색어 하이라이트
  highlightSearch(text, searchTerm) {
    if (!text || !searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
};

// 폼 관련 유틸리티
export const FormUtils = {
  // 폼 데이터를 객체로 변환
  formDataToObject(formData) {
    const obj = {};
    for (let [key, value] of formData.entries()) {
      if (obj[key]) {
        if (Array.isArray(obj[key])) {
          obj[key].push(value);
        } else {
          obj[key] = [obj[key], value];
        }
      } else {
        obj[key] = value;
      }
    }
    return obj;
  },

  // 객체를 폼 데이터로 변환
  objectToFormData(obj) {
    const formData = new FormData();
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (Array.isArray(obj[key])) {
          obj[key].forEach(value => formData.append(key, value));
        } else {
          formData.append(key, obj[key]);
        }
      }
    }
    return formData;
  },

  // 입력값 검증
  validateRequired(value, fieldName) {
    if (!value || value.toString().trim() === '') {
      return `${fieldName}은(는) 필수 입력 항목입니다.`;
    }
    return null;
  },

  // 이메일 검증
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return '올바른 이메일 형식이 아닙니다.';
    }
    return null;
  },

  // 전화번호 검증
  validatePhone(phone) {
    const phoneRegex = /^01[0-9]-\d{3,4}-\d{4}$/;
    if (!phoneRegex.test(phone)) {
      return '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)';
    }
    return null;
  },

  // 주민등록번호 검증
  validateSSN(ssn) {
    const ssnRegex = /^\d{6}-\d{7}$/;
    if (!ssnRegex.test(ssn)) {
      return '올바른 주민등록번호 형식이 아닙니다. (예: 123456-1234567)';
    }
    return null;
  }
};

// DOM 관련 유틸리티
export const DomUtils = {
  // 요소가 뷰포트에 보이는지 확인
  isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  // 요소를 부드럽게 스크롤
  smoothScrollTo(element, offset = 0) {
    const targetPosition = element.offsetTop - offset;
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  },

  // 클래스 토글 (여러 요소)
  toggleClass(elements, className) {
    if (!Array.isArray(elements)) {
      elements = [elements];
    }
    
    elements.forEach(element => {
      if (element) {
        element.classList.toggle(className);
      }
    });
  },

  // 요소 생성 헬퍼
  createElement(tag, attributes = {}, textContent = '') {
    const element = document.createElement(tag);
    
    Object.keys(attributes).forEach(key => {
      if (key === 'className') {
        element.className = attributes[key];
      } else if (key === 'dataset') {
        Object.keys(attributes[key]).forEach(dataKey => {
          element.dataset[dataKey] = attributes[key][dataKey];
        });
      } else {
        element.setAttribute(key, attributes[key]);
      }
    });
    
    if (textContent) {
      element.textContent = textContent;
    }
    
    return element;
  },

  // 요소 제거 (애니메이션과 함께)
  removeElementWithAnimation(element, animation = 'fadeOut', duration = 300) {
    element.style.animation = `${animation} ${duration}ms ease-out`;
    
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, duration);
  }
};

// 데이터 관련 유틸리티
export const DataUtils = {
  // 깊은 복사
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    
    const cloned = {};
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    return cloned;
  },

  // 객체 병합
  mergeObjects(...objects) {
    return Object.assign({}, ...objects);
  },

  // 배열에서 중복 제거
  removeDuplicates(array, key = null) {
    if (!key) {
      return [...new Set(array)];
    }
    
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  },

  // 배열 그룹화
  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  },

  // 배열 정렬
  sortBy(array, key, direction = 'asc') {
    return array.sort((a, b) => {
      let valueA = a[key];
      let valueB = b[key];
      
      // 문자열인 경우 대소문자 구분 없이 정렬
      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }
      
      if (direction === 'desc') {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      } else {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      }
    });
  }
};

// 파일 관련 유틸리티
export const FileUtils = {
  // 파일 크기를 사람이 읽기 쉬운 형태로 변환
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // 파일 확장자 추출
  getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  },

  // 파일 타입 확인
  isImageFile(filename) {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const extension = this.getFileExtension(filename).toLowerCase();
    return imageExtensions.includes(extension);
  },

  // CSV 다운로드
  downloadCSV(data, filename = 'data.csv') {
    const csvContent = this.arrayToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },

  // 배열을 CSV로 변환
  arrayToCSV(data) {
    if (!Array.isArray(data) || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // 헤더 추가
    csvRows.push(headers.map(header => `"${header}"`).join(','));
    
    // 데이터 행 추가
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  }
};

// 로컬 스토리지 유틸리티
export const StorageUtils = {
  // 로컬 스토리지에 저장
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('로컬 스토리지 저장 실패:', error);
      return false;
    }
  },

  // 로컬 스토리지에서 가져오기
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('로컬 스토리지 조회 실패:', error);
      return defaultValue;
    }
  },

  // 로컬 스토리지에서 삭제
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('로컬 스토리지 삭제 실패:', error);
      return false;
    }
  },

  // 로컬 스토리지 전체 삭제
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('로컬 스토리지 전체 삭제 실패:', error);
      return false;
    }
  }
};

// 전화번호 입력 자동 이동 함수
export function autoMoveToNext(currentInput, nextInputId, maxLength) {
  // 숫자만 허용
  currentInput.value = currentInput.value.replace(/[^0-9]/g, '');
  
  // 최대 길이에 도달하면 다음 입력 필드로 이동
  if (currentInput.value.length >= maxLength && nextInputId) {
    const nextInput = document.getElementById(nextInputId);
    if (nextInput) {
      nextInput.focus();
      nextInput.select();
    }
  }
}

// 전화번호 입력 백스페이스 처리 함수
export function handlePhoneBackspace(event, prevInputId, nextInputId) {
  const currentInput = event.target;
  
  // 백스페이스 키 감지
  if (event.key === 'Backspace') {
    // 현재 입력 필드가 비어있고 이전 입력 필드가 있으면 이전 필드로 이동
    if (currentInput.value === '' && prevInputId) {
      const prevInput = document.getElementById(prevInputId);
      if (prevInput) {
        prevInput.focus();
        // 커서를 끝으로 이동
        prevInput.setSelectionRange(prevInput.value.length, prevInput.value.length);
      }
    }
  }
  // Delete 키나 다른 키의 경우 자동 이동 로직 적용
  else if (event.key !== 'Tab' && event.key !== 'Shift' && event.key !== 'Enter') {
    // 입력 후 자동 이동을 위해 setTimeout 사용
    setTimeout(() => {
      const maxLength = parseInt(currentInput.getAttribute('maxlength')) || 4;
      if (currentInput.value.length >= maxLength && nextInputId) {
        const nextInput = document.getElementById(nextInputId);
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      }
    }, 10);
  }
}

// 디바운스 함수
export function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// 스로틀 함수
export function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}