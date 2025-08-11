import { httpsCallable } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-functions.js";
import { functions } from "../core/firebase-config.js";

// 생명보험협회 자격시험 일정 크롤링
export async function crawlLifeInsuranceExamSchedule() {
  try {
    const crawlLifeInsuranceExamSchedule = httpsCallable(functions, 'crawlLifeInsuranceExamSchedule');
    const result = await crawlLifeInsuranceExamSchedule();
    return { success: true, data: result.data };
  } catch (error) {
    console.error("자격시험 일정 크롤링 실패:", error);
    return { success: false, error: error.message };
  }
}

// 자격시험 일정 조회
export async function getExamSchedules(type = null) {
  try {
    const getExamSchedules = httpsCallable(functions, 'getExamSchedules');
    const result = await getExamSchedules({ type });
    return { success: true, schedules: result.data.schedules };
  } catch (error) {
    console.error("자격시험 일정 조회 실패:", error);
    return { success: false, error: error.message, schedules: [] };
  }
}

// 생명보험 자격시험 일정 조회
export async function getLifeInsuranceExamSchedules() {
  return await getExamSchedules('life_insurance');
}

// 자격시험 일정 통계
export async function getExamScheduleStats() {
  try {
    const schedules = await getExamSchedules();
    
    if (!schedules.success) {
      return { success: false, error: schedules.error };
    }

    const stats = {
      total: schedules.schedules.length,
      byRegion: {},
      byType: {},
      upcoming: 0 // 향후 30일 이내 시험
    };

    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    schedules.schedules.forEach(schedule => {
      // 지역별 통계
      const region = schedule.region || '미지정';
      stats.byRegion[region] = (stats.byRegion[region] || 0) + 1;

      // 타입별 통계
      const type = schedule.type || '미지정';
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // 향후 30일 이내 시험 카운트
      try {
        const examDateStr = schedule.examDate;
        if (examDateStr) {
          // 시험일 파싱 (여러 형태의 날짜 형식 처리)
          const examDate = parseExamDate(examDateStr);
          if (examDate && examDate >= now && examDate <= thirtyDaysLater) {
            stats.upcoming++;
          }
        }
      } catch (error) {
        console.warn('시험일 파싱 실패:', schedule.examDate, error);
      }
    });

    return { success: true, stats };
  } catch (error) {
    console.error("자격시험 일정 통계 조회 실패:", error);
    return { success: false, error: error.message };
  }
}

// 시험일 파싱 함수 (다양한 날짜 형식 지원)
function parseExamDate(dateStr) {
  if (!dateStr) return null;

  try {
    // 기본적인 날짜 형식들 시도
    const formats = [
      // YYYY-MM-DD
      /(\d{4})-(\d{1,2})-(\d{1,2})/,
      // YYYY.MM.DD
      /(\d{4})\.(\d{1,2})\.(\d{1,2})/,
      // MM/DD/YYYY
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      // MM월 DD일
      /(\d{1,2})월\s*(\d{1,2})일/,
      // YYYY년 MM월 DD일
      /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        let year, month, day;
        
        if (format.source.includes('년')) {
          // 한국어 형식
          year = parseInt(match[1]);
          month = parseInt(match[2]) - 1; // JavaScript Date는 0부터 시작
          day = parseInt(match[3]);
        } else if (format.source.includes('월')) {
          // MM월 DD일 형식 (현재 년도 사용)
          year = new Date().getFullYear();
          month = parseInt(match[1]) - 1;
          day = parseInt(match[2]);
        } else if (format.source.startsWith('\\(\\d{1,2}\\)')) {
          // MM/DD/YYYY 형식
          month = parseInt(match[1]) - 1;
          day = parseInt(match[2]);
          year = parseInt(match[3]);
        } else {
          // YYYY-MM-DD, YYYY.MM.DD 형식
          year = parseInt(match[1]);
          month = parseInt(match[2]) - 1;
          day = parseInt(match[3]);
        }

        const date = new Date(year, month, day);
        
        // 유효한 날짜인지 확인
        if (date.getFullYear() === year && 
            date.getMonth() === month && 
            date.getDate() === day) {
          return date;
        }
      }
    }

    // 마지막으로 JavaScript Date 생성자 시도
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }

    return null;
  } catch (error) {
    console.warn('날짜 파싱 실패:', dateStr, error);
    return null;
  }
}

// 지역별 시험 일정 조회
export async function getExamSchedulesByRegion(region) {
  try {
    const allSchedules = await getExamSchedules();
    
    if (!allSchedules.success) {
      return allSchedules;
    }

    const filteredSchedules = allSchedules.schedules.filter(
      schedule => schedule.region === region
    );

    return { success: true, schedules: filteredSchedules };
  } catch (error) {
    console.error("지역별 자격시험 일정 조회 실패:", error);
    return { success: false, error: error.message, schedules: [] };
  }
}

// 시험 일정 검색
export async function searchExamSchedules(searchTerm) {
  try {
    const allSchedules = await getExamSchedules();
    
    if (!allSchedules.success) {
      return allSchedules;
    }

    const searchLower = searchTerm.toLowerCase();
    const filteredSchedules = allSchedules.schedules.filter(schedule => {
      return (schedule.region?.toLowerCase().includes(searchLower)) ||
             (schedule.examDate?.toLowerCase().includes(searchLower)) ||
             (schedule.applicationPeriod?.toLowerCase().includes(searchLower)) ||
             (schedule.resultDate?.toLowerCase().includes(searchLower));
    });

    return { success: true, schedules: filteredSchedules };
  } catch (error) {
    console.error("자격시험 일정 검색 실패:", error);
    return { success: false, error: error.message, schedules: [] };
  }
}

// 다가오는 시험 일정 조회 (특정 기간 내)
export async function getUpcomingExamSchedules(daysAhead = 30) {
  try {
    const allSchedules = await getExamSchedules();
    
    if (!allSchedules.success) {
      return allSchedules;
    }

    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const upcomingSchedules = allSchedules.schedules.filter(schedule => {
      const examDate = parseExamDate(schedule.examDate);
      return examDate && examDate >= now && examDate <= futureDate;
    });

    // 시험일 순으로 정렬
    upcomingSchedules.sort((a, b) => {
      const dateA = parseExamDate(a.examDate);
      const dateB = parseExamDate(b.examDate);
      return dateA - dateB;
    });

    return { success: true, schedules: upcomingSchedules };
  } catch (error) {
    console.error("다가오는 자격시험 일정 조회 실패:", error);
    return { success: false, error: error.message, schedules: [] };
  }
}