// 페이지네이션 관리 클래스
export class PaginationManager {
  constructor(options = {}) {
    this.currentPage = 1;
    this.itemsPerPage = options.itemsPerPage || 5;
    this.totalItems = 0;
    this.displayedItems = 0;
    this.hasMore = false;
    this.isLoading = false;
    
    // 콜백 함수들
    this.onLoadMore = options.onLoadMore || null;
    this.onReset = options.onReset || null;
    
    // DOM 요소들
    this.loadMoreContainer = null;
    this.loadMoreBtn = null;
    this.remainingCountSpan = null;
    
    this.init(options);
  }

  init(options) {
    if (options.loadMoreContainerId) {
      this.loadMoreContainer = document.getElementById(options.loadMoreContainerId);
    }
    if (options.loadMoreBtnId) {
      this.loadMoreBtn = document.getElementById(options.loadMoreBtnId);
    }
    if (options.remainingCountSpanId) {
      this.remainingCountSpan = document.getElementById(options.remainingCountSpanId);
    }

    // 더보기 버튼 이벤트 리스너
    if (this.loadMoreBtn) {
      this.loadMoreBtn.addEventListener('click', () => {
        this.loadMore();
      });
    }
  }

  // 더 많은 데이터 로드
  async loadMore() {
    if (this.isLoading || !this.hasMore) return;

    this.setLoading(true);
    this.currentPage++;

    try {
      if (this.onLoadMore) {
        await this.onLoadMore();
      }
    } catch (error) {
      console.error('더 많은 데이터 로드 실패:', error);
      this.currentPage--; // 실패 시 페이지 롤백
    } finally {
      this.setLoading(false);
    }
  }

  // 페이지네이션 상태 업데이트
  updateState(newItems, hasMore, totalItems = null) {
    this.displayedItems += newItems;
    this.hasMore = hasMore;
    
    if (totalItems !== null) {
      this.totalItems = totalItems;
    }

    this.updateUI();
  }

  // 페이지네이션 상태 설정
  setState(displayedItems, hasMore, totalItems = null) {
    this.displayedItems = displayedItems;
    this.hasMore = hasMore;
    
    if (totalItems !== null) {
      this.totalItems = totalItems;
    }

    this.updateUI();
  }

  // UI 업데이트
  updateUI() {
    if (!this.loadMoreContainer) return;

    if (this.hasMore && this.displayedItems > 0) {
      this.loadMoreContainer.style.display = 'block';
      
      // 남은 개수 표시
      if (this.remainingCountSpan && this.totalItems > 0) {
        const remaining = this.totalItems - this.displayedItems;
        this.remainingCountSpan.textContent = remaining;
      }
    } else {
      this.loadMoreContainer.style.display = 'none';
    }
  }

  // 로딩 상태 설정
  setLoading(isLoading) {
    this.isLoading = isLoading;
    
    if (this.loadMoreBtn) {
      this.loadMoreBtn.disabled = isLoading;
      this.loadMoreBtn.textContent = isLoading ? '로딩 중...' : 
        `더보기 (${this.remainingCountSpan ? this.remainingCountSpan.textContent : '0'}개 더)`;
    }
  }

  // 페이지네이션 초기화
  reset() {
    this.currentPage = 1;
    this.displayedItems = 0;
    this.totalItems = 0;
    this.hasMore = false;
    this.isLoading = false;
    
    this.updateUI();
    
    if (this.onReset) {
      this.onReset();
    }
  }

  // 현재 상태 반환
  getState() {
    return {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage,
      displayedItems: this.displayedItems,
      totalItems: this.totalItems,
      hasMore: this.hasMore,
      isLoading: this.isLoading
    };
  }

  // 전체 페이지 수 계산
  getTotalPages() {
    if (this.totalItems <= 0) return 0;
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  // 진행률 계산 (0-100)
  getProgress() {
    if (this.totalItems <= 0) return 0;
    return Math.min(100, (this.displayedItems / this.totalItems) * 100);
  }
}

// 간단한 페이지네이션 헬퍼 함수들
export function createPagination(containerId, options = {}) {
  const defaultOptions = {
    loadMoreContainerId: containerId,
    loadMoreBtnId: `${containerId.replace('LoadMore', '')}LoadMoreBtn`,
    remainingCountSpanId: `${containerId.replace('LoadMore', '')}RemainingCount`,
    ...options
  };

  return new PaginationManager(defaultOptions);
}

// 배열 기반 클라이언트 사이드 페이지네이션
export class ClientSidePagination {
  constructor(items = [], itemsPerPage = 10) {
    this.allItems = items;
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 1;
  }

  // 전체 아이템 설정
  setItems(items) {
    this.allItems = items;
    this.currentPage = 1;
  }

  // 현재 페이지의 아이템들 반환
  getCurrentPageItems() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.allItems.slice(startIndex, endIndex);
  }

  // 다음 페이지로
  nextPage() {
    if (this.hasNextPage()) {
      this.currentPage++;
      return this.getCurrentPageItems();
    }
    return [];
  }

  // 이전 페이지로
  prevPage() {
    if (this.hasPrevPage()) {
      this.currentPage--;
      return this.getCurrentPageItems();
    }
    return [];
  }

  // 특정 페이지로 이동
  goToPage(page) {
    const totalPages = this.getTotalPages();
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      return this.getCurrentPageItems();
    }
    return [];
  }

  // 다음 페이지 존재 여부
  hasNextPage() {
    return this.currentPage < this.getTotalPages();
  }

  // 이전 페이지 존재 여부
  hasPrevPage() {
    return this.currentPage > 1;
  }

  // 전체 페이지 수
  getTotalPages() {
    return Math.ceil(this.allItems.length / this.itemsPerPage);
  }

  // 현재 페이지 정보
  getPageInfo() {
    const totalPages = this.getTotalPages();
    const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
    const endItem = Math.min(this.currentPage * this.itemsPerPage, this.allItems.length);
    
    return {
      currentPage: this.currentPage,
      totalPages,
      totalItems: this.allItems.length,
      itemsPerPage: this.itemsPerPage,
      startItem,
      endItem,
      hasNext: this.hasNextPage(),
      hasPrev: this.hasPrevPage()
    };
  }
}

// 검색과 페이지네이션을 함께 관리하는 클래스
export class SearchablePagination extends PaginationManager {
  constructor(options = {}) {
    super(options);
    this.searchTerm = '';
    this.filteredItems = [];
    this.onSearch = options.onSearch || null;
  }

  // 검색 실행
  async search(searchTerm) {
    this.searchTerm = searchTerm;
    this.reset();
    
    if (this.onSearch) {
      await this.onSearch(searchTerm);
    }
  }

  // 검색 초기화
  clearSearch() {
    this.searchTerm = '';
    this.filteredItems = [];
    this.reset();
  }

  // 현재 검색어 반환
  getSearchTerm() {
    return this.searchTerm;
  }

  // 검색 중인지 확인
  isSearching() {
    return this.searchTerm.trim() !== '';
  }
}