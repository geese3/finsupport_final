// 검색 관리 클래스
export class SearchManager {
  constructor(options = {}) {
    this.searchInput = null;
    this.resetBtn = null;
    this.searchTerm = '';
    this.debounceTimer = null;
    this.debounceDelay = options.debounceDelay || 300;
    
    // 콜백 함수들
    this.onSearch = options.onSearch || null;
    this.onReset = options.onReset || null;
    this.onInput = options.onInput || null;
    
    this.init(options);
  }

  init(options) {
    // DOM 요소 찾기
    if (options.searchInputId) {
      this.searchInput = document.getElementById(options.searchInputId);
    }
    if (options.resetBtnId) {
      this.resetBtn = document.getElementById(options.resetBtnId);
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    // 검색 입력 이벤트
    if (this.searchInput) {
      // 실시간 검색 (디바운스 적용)
      this.searchInput.addEventListener('input', (e) => {
        this.handleInput(e.target.value);
      });

      // 엔터 키로 즉시 검색
      this.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.clearDebounce();
          this.performSearch(this.searchInput.value);
        }
      });
    }

    // 리셋 버튼 이벤트
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => {
        this.reset();
      });
    }
  }

  // 입력 처리 (디바운스 적용)
  handleInput(value) {
    this.searchTerm = value.trim();
    
    // 기존 타이머 클리어
    this.clearDebounce();
    
    // onInput 콜백 호출
    if (this.onInput) {
      this.onInput(this.searchTerm);
    }

    // 빈 값이면 즉시 리셋
    if (this.searchTerm === '') {
      this.performReset();
      return;
    }

    // 디바운스 타이머 설정
    this.debounceTimer = setTimeout(() => {
      this.performSearch(this.searchTerm);
    }, this.debounceDelay);
  }

  // 검색 실행
  async performSearch(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      this.performReset();
      return;
    }

    this.searchTerm = searchTerm.trim();
    
    if (this.onSearch) {
      try {
        await this.onSearch(this.searchTerm);
      } catch (error) {
        console.error('검색 실행 중 오류:', error);
      }
    }
  }

  // 리셋 실행
  performReset() {
    this.searchTerm = '';
    
    if (this.searchInput) {
      this.searchInput.value = '';
    }

    if (this.onReset) {
      this.onReset();
    }
  }

  // 검색 초기화
  reset() {
    this.clearDebounce();
    this.performReset();
  }

  // 디바운스 타이머 클리어
  clearDebounce() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  // 현재 검색어 반환
  getSearchTerm() {
    return this.searchTerm;
  }

  // 검색어 설정
  setSearchTerm(searchTerm) {
    this.searchTerm = searchTerm;
    if (this.searchInput) {
      this.searchInput.value = searchTerm;
    }
  }

  // 검색 중인지 확인
  isSearching() {
    return this.searchTerm !== '';
  }

  // 검색 입력란 포커스
  focus() {
    if (this.searchInput) {
      this.searchInput.focus();
    }
  }

  // 검색 입력란 비활성화/활성화
  setEnabled(enabled) {
    if (this.searchInput) {
      this.searchInput.disabled = !enabled;
    }
    if (this.resetBtn) {
      this.resetBtn.disabled = !enabled;
    }
  }
}

// 고급 검색 필터 관리
export class AdvancedSearchManager extends SearchManager {
  constructor(options = {}) {
    super(options);
    this.filters = {};
    this.filterElements = new Map();
    this.onFilterChange = options.onFilterChange || null;
  }

  // 필터 추가
  addFilter(filterId, element, type = 'text') {
    this.filterElements.set(filterId, { element, type });
    
    // 필터 이벤트 리스너 설정
    if (type === 'select') {
      element.addEventListener('change', () => {
        this.updateFilter(filterId, element.value);
      });
    } else if (type === 'checkbox') {
      element.addEventListener('change', () => {
        this.updateFilter(filterId, element.checked);
      });
    } else if (type === 'date') {
      element.addEventListener('change', () => {
        this.updateFilter(filterId, element.value);
      });
    } else {
      // text input
      element.addEventListener('input', () => {
        this.updateFilter(filterId, element.value);
      });
    }
  }

  // 필터 값 업데이트
  updateFilter(filterId, value) {
    if (value === '' || value === null || value === undefined) {
      delete this.filters[filterId];
    } else {
      this.filters[filterId] = value;
    }

    this.applyFilters();
  }

  // 모든 필터 적용
  async applyFilters() {
    if (this.onFilterChange) {
      try {
        await this.onFilterChange(this.filters, this.searchTerm);
      } catch (error) {
        console.error('필터 적용 중 오류:', error);
      }
    }
  }

  // 모든 필터 초기화
  resetFilters() {
    this.filters = {};
    
    this.filterElements.forEach(({ element, type }) => {
      if (type === 'select') {
        element.selectedIndex = 0;
      } else if (type === 'checkbox') {
        element.checked = false;
      } else {
        element.value = '';
      }
    });

    this.applyFilters();
  }

  // 현재 필터 값들 반환
  getFilters() {
    return { ...this.filters };
  }

  // 필터가 적용되어 있는지 확인
  hasFilters() {
    return Object.keys(this.filters).length > 0;
  }

  // 전체 초기화 (검색어 + 필터)
  reset() {
    super.reset();
    this.resetFilters();
  }
}

// 검색 하이라이트 유틸리티
export class SearchHighlighter {
  constructor(options = {}) {
    this.highlightClass = options.highlightClass || 'search-highlight';
    this.caseSensitive = options.caseSensitive || false;
  }

  // 텍스트에서 검색어 하이라이트
  highlight(text, searchTerm) {
    if (!text || !searchTerm) return text;

    const flags = this.caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(this.escapeRegex(searchTerm), flags);
    
    return text.replace(regex, `<span class="${this.highlightClass}">$&</span>`);
  }

  // HTML 요소 내 텍스트 하이라이트
  highlightElement(element, searchTerm) {
    if (!element || !searchTerm) return;

    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes = [];
    let node;

    while (node = walker.nextNode()) {
      if (node.nodeValue.trim()) {
        textNodes.push(node);
      }
    }

    textNodes.forEach(textNode => {
      const highlightedText = this.highlight(textNode.nodeValue, searchTerm);
      if (highlightedText !== textNode.nodeValue) {
        const wrapper = document.createElement('span');
        wrapper.innerHTML = highlightedText;
        textNode.parentNode.replaceChild(wrapper, textNode);
      }
    });
  }

  // 하이라이트 제거
  removeHighlight(element) {
    if (!element) return;

    const highlights = element.querySelectorAll(`.${this.highlightClass}`);
    highlights.forEach(highlight => {
      const parent = highlight.parentNode;
      parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
      parent.normalize(); // 인접한 텍스트 노드 병합
    });
  }

  // 정규표현식 특수문자 이스케이프
  escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// 검색 결과 통계
export class SearchStats {
  constructor() {
    this.reset();
  }

  // 검색 결과 업데이트
  update(totalResults, searchTerm, searchTime = null) {
    this.totalResults = totalResults;
    this.searchTerm = searchTerm;
    this.searchTime = searchTime;
    this.lastSearchDate = new Date();
  }

  // 통계 리셋
  reset() {
    this.totalResults = 0;
    this.searchTerm = '';
    this.searchTime = null;
    this.lastSearchDate = null;
  }

  // 검색 결과 메시지 생성
  getResultMessage() {
    if (!this.searchTerm) {
      return '';
    }

    let message = `"${this.searchTerm}"에 대한 검색 결과: ${this.totalResults}건`;
    
    if (this.searchTime !== null) {
      message += ` (${this.searchTime}ms)`;
    }

    return message;
  }

  // 통계 정보 반환
  getStats() {
    return {
      totalResults: this.totalResults,
      searchTerm: this.searchTerm,
      searchTime: this.searchTime,
      lastSearchDate: this.lastSearchDate
    };
  }
}

// 간단한 검색 매니저 생성 헬퍼
export function createSearchManager(searchInputId, options = {}) {
  return new SearchManager({
    searchInputId,
    resetBtnId: searchInputId.replace('Input', 'ResetBtn'),
    ...options
  });
}