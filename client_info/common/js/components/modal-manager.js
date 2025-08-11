// 모달 관리 클래스
export class ModalManager {
  constructor() {
    this.currentModal = null;
    this.modalStack = [];
    this.escapeHandlers = new Map();
    
    // DOM 요소들
    this.detailModal = document.getElementById('detailModal');
    this.closeModal = document.getElementById('closeModal');
    
    this.init();
  }

  init() {
    // 모달 외부 클릭 시 닫기
    if (this.detailModal) {
      this.detailModal.addEventListener('click', (e) => {
        if (e.target === this.detailModal) {
          this.closeCurrentModal();
        }
      });
    }

    // X 버튼 클릭 시 닫기
    if (this.closeModal) {
      this.closeModal.addEventListener('click', () => {
        this.closeCurrentModal();
      });
    }
  }

  // 모달 열기
  openModal(content, modalClass = '', options = {}) {
    if (!this.detailModal) return;

    const modalContent = this.detailModal.querySelector('.modal-content');
    const detailContent = document.getElementById('detailContent');
    
    // 이전 모달 정보 저장
    if (this.currentModal) {
      this.modalStack.push({
        content: detailContent.innerHTML,
        class: modalContent.className,
        options: this.currentModal.options
      });
    }

    // 새 모달 설정
    modalContent.className = `modal-content ${modalClass}`;
    detailContent.innerHTML = content;
    
    // 모달 표시
    this.detailModal.style.display = 'block';
    document.body.classList.add('modal-open');

    // 현재 모달 정보 저장
    this.currentModal = {
      content,
      class: modalClass,
      options
    };

    // ESC 키 핸들러 설정
    if (options.escapeHandler) {
      const handler = (e) => {
        if (e.key === 'Escape') {
          options.escapeHandler(e);
        }
      };
      
      this.escapeHandlers.set(this.currentModal, handler);
      document.addEventListener('keydown', handler);
    }

    return this.currentModal;
  }

  // 현재 모달 닫기
  closeCurrentModal() {
    if (!this.detailModal) return;

    // ESC 핸들러 제거
    if (this.currentModal && this.escapeHandlers.has(this.currentModal)) {
      document.removeEventListener('keydown', this.escapeHandlers.get(this.currentModal));
      this.escapeHandlers.delete(this.currentModal);
    }

    // 이전 모달이 있으면 복원
    if (this.modalStack.length > 0) {
      const previousModal = this.modalStack.pop();
      const modalContent = this.detailModal.querySelector('.modal-content');
      const detailContent = document.getElementById('detailContent');
      
      modalContent.className = previousModal.class;
      detailContent.innerHTML = previousModal.content;
      
      this.currentModal = {
        content: previousModal.content,
        class: previousModal.class.replace('modal-content ', ''),
        options: previousModal.options
      };
    } else {
      // 모든 모달 닫기
      this.detailModal.style.display = 'none';
      document.body.classList.remove('modal-open');
      this.currentModal = null;
    }
  }

  // 모든 모달 강제 닫기
  closeAllModals() {
    // 모든 ESC 핸들러 제거
    this.escapeHandlers.forEach((handler) => {
      document.removeEventListener('keydown', handler);
    });
    this.escapeHandlers.clear();

    // 모달 상태 초기화
    this.modalStack = [];
    this.currentModal = null;
    
    if (this.detailModal) {
      this.detailModal.style.display = 'none';
    }
    document.body.classList.remove('modal-open');
  }

  // 뒤로 가기 (이전 모달로)
  goBack() {
    this.closeCurrentModal();
  }

  // 현재 모달 정보 반환
  getCurrentModal() {
    return this.currentModal;
  }

  // 모달 스택 깊이 반환
  getStackDepth() {
    return this.modalStack.length;
  }

  // 특정 클래스의 모달 생성 헬퍼
  createViewModal(content) {
    return this.openModal(content, 'view-modal');
  }

  createEditModal(content, escapeHandler) {
    return this.openModal(content, 'edit-modal', { escapeHandler });
  }

  createFieldModal(content, escapeHandler) {
    return this.openModal(content, 'field-modal', { escapeHandler });
  }

  createClientModal(content, escapeHandler) {
    return this.openModal(content, 'client-modal', { escapeHandler });
  }
}

// 전역 모달 관리자 인스턴스
export const modalManager = new ModalManager();

// 편의 함수들
export function openModal(content, modalClass = '', options = {}) {
  return modalManager.openModal(content, modalClass, options);
}

export function closeModal() {
  modalManager.closeCurrentModal();
}

export function closeAllModals() {
  modalManager.closeAllModals();
}

export function goBackModal() {
  modalManager.goBack();
}

// 확인 다이얼로그
export function showConfirmDialog(message, onConfirm, onCancel) {
  const content = `
    <div class="modal-header">
      <h3>확인 필요</h3>
    </div>
    <div class="modal-body">
      <p style="margin: 30px 20px; text-align: center; font-size: 16px; line-height: 1.5; color: #333;">
        ${message}
      </p>
    </div>
    <div class="modal-footer" style="text-align: center; padding-top: 20px;">
      <button class="modal-btn blue confirm-yes" style="margin-right: 12px; padding: 10px 24px;">확인</button>
      <button class="modal-btn cancel-no" style="padding: 10px 24px;">취소</button>
    </div>
  `;

  modalManager.openModal(content, 'field-modal');

  // 이벤트 리스너 추가
  setTimeout(() => {
    const confirmBtn = document.querySelector('.confirm-yes');
    const cancelBtn = document.querySelector('.cancel-no');

    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        modalManager.closeCurrentModal();
        if (onConfirm) onConfirm();
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        modalManager.closeCurrentModal();
        if (onCancel) onCancel();
      });
    }
  }, 10);
}

// 알림 다이얼로그
export function showAlert(message, onClose) {
  const content = `
    <div class="modal-header">
      <h3>알림</h3>
    </div>
    <div class="modal-body">
      <p style="margin: 30px 20px; text-align: center; font-size: 16px; line-height: 1.5; color: #333;">
        ${message}
      </p>
    </div>
    <div class="modal-footer" style="text-align: center; padding-top: 20px;">
      <button class="modal-btn blue alert-ok" style="padding: 10px 24px;">확인</button>
    </div>
  `;

  modalManager.openModal(content, 'field-modal');

  // 이벤트 리스너 추가
  setTimeout(() => {
    const okBtn = document.querySelector('.alert-ok');
    if (okBtn) {
      okBtn.addEventListener('click', () => {
        modalManager.closeCurrentModal();
        if (onClose) onClose();
      });
    }
  }, 10);
}

// 로딩 모달
export function showLoadingModal(message = '처리 중...') {
  const content = `
    <div class="modal-body" style="text-align: center; padding: 40px;">
      <div style="margin-bottom: 20px;">
        <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
      </div>
      <p style="font-size: 16px; color: #666;">${message}</p>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;

  return modalManager.openModal(content, 'field-modal', { closable: false });
}