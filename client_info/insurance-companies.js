// 보험사 정보 통합 모듈
// 모든 보험사 데이터를 중앙에서 관리하여 유지보수성 향상

// 생명보험사 목록
export const lifeInsuranceCompanies = [
  { name: 'ABL생명', key: 'abl' },
  { name: '흥국생명', key: 'heungkuk_life' },
  { name: 'NH농협생명', key: 'nh_life' },
  { name: '라이나생명', key: 'lina' },
  { name: 'iM라이프생명', key: 'im_life' },
  { name: 'KDB생명', key: 'kdb' },
  { name: 'KB생명', key: 'kb_life' },
  { name: '삼성생명', key: 'samsung_life' },
  { name: '한화생명', key: 'hanwha_life' },
  { name: '처브라이프생명', key: 'chubb_life' },
  { name: '카디프생명', key: 'cardif' },
  { name: '신한라이프', key: 'shinhan' },
  { name: '오렌지라이프생명', key: 'orange' },
  { name: '푸본현대생명', key: 'fubon' },
  { name: 'IBK기업연금', key: 'ibk' },
  { name: '교보라이프플래닛생명', key: 'kyobo_planet' },
  { name: '동양생명', key: 'dongyang' },
  { name: '미래에셋생명', key: 'mirae' },
  { name: '푸르덴셜생명', key: 'prudential' },
  { name: '교보생명', key: 'kyobo' },
  { name: '메트라이프생명', key: 'metlife' },
  { name: '하나생명', key: 'hana_life' },
  { name: 'DGB생명', key: 'dgb' }
];

// 손해보험사 목록
export const nonLifeInsuranceCompanies = [
  { name: '한화손해보험', key: 'hanwha_nonlife' },
  { name: '현대해상', key: 'hyundai' },
  { name: '삼성화재', key: 'samsung_fire' },
  { name: '메리츠화재', key: 'meritz' },
  { name: 'MG손해보험', key: 'mg' },
  { name: 'KB손해보험', key: 'kb_nonlife' },
  { name: '농협손보', key: 'nh_nonlife' },
  { name: '흥국화재', key: 'heungkuk_fire' },
  { name: '롯데손보', key: 'lotte' },
  { name: 'DB손해보험', key: 'db' },
  { name: '하나손해', key: 'hana_nonlife' },
  { name: '라이나손해보험', key: 'lina_nonlife' },
  { name: '처브손해', key: 'chubb_nonlife' }
];

// 호환성을 위한 파생 배열들
export const insuranceCompanies = [
  ...lifeInsuranceCompanies.map(comp => comp.name),
  ...nonLifeInsuranceCompanies.map(comp => comp.name)
];

export const lifeCompanies = lifeInsuranceCompanies.map(comp => comp.name);
export const nonLifeCompanies = nonLifeInsuranceCompanies.map(comp => comp.name);

// 보험사 이름으로 키를 찾는 헬퍼 함수
export function getInsuranceCompanyKey(companyName) {
  const allCompanies = [...lifeInsuranceCompanies, ...nonLifeInsuranceCompanies];
  const company = allCompanies.find(comp => comp.name === companyName);
  return company ? company.key : null;
}

// 보험사 키로 이름을 찾는 헬퍼 함수
export function getInsuranceCompanyName(companyKey) {
  const allCompanies = [...lifeInsuranceCompanies, ...nonLifeInsuranceCompanies];
  const company = allCompanies.find(comp => comp.key === companyKey);
  return company ? company.name : null;
}

// 보험사 타입 확인 함수 (생명보험/손해보험)
export function getInsuranceCompanyType(companyName) {
  if (lifeCompanies.includes(companyName)) {
    return 'life';
  } else if (nonLifeCompanies.includes(companyName)) {
    return 'nonlife';
  }
  return null;
}