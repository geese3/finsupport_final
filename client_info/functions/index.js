/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const CryptoJS = require("crypto-js");
// cors는 HTTP 함수에서만 사용하므로 제거
const dotenv = require("dotenv");
dotenv.config();

admin.initializeApp();

/**
 * 환경변수에서 암호화 키를 가져오는 함수
 * @return {string|undefined} 암호화 키 또는 undefined
 */
function getEncryptKey() {
  return process.env.ENCRYPT_KEY ||
         process.env.SECURE_KEY ||
         process.env.ENCRYPTION_KEY;
}

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// 데이터 저장 시 암호화하는 함수
// exports.encryptClientData = functions.firestore
//   .document("client_info/{docId}")
//   .onCreate(async (snap, context) => {
//     const data = snap.data();
//     const encryptedRRN = CryptoJS.AES.encrypt(
//       data.rrn,
//       ENCRYPT_KEY,
//     ).toString();
//     return snap.ref.update({ rrn: encryptedRRN });
//   });

// 허용된 관리자 이메일 목록
const allowedAdmins = [
  "geese3433@gmail.com",
  "iqhali93@gmail.com",
  "offbeatt@naver.com",
];

// 주민등록번호 암호화 함수 (클라이언트에서 호출)
exports.encryptSSN = functions.https.onCall(async (data, context) => {
  try {
    const {ssn} = data;

    if (!ssn) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "주민등록번호가 제공되지 않았습니다.",
      );
    }

    const encryptKey = getEncryptKey();
    if (!encryptKey) {
      throw new functions.https.HttpsError(
        "internal",
        "암호화 키가 설정되지 않았습니다.",
      );
    }

    // 주민등록번호 암호화
    const encryptedSSN = CryptoJS.AES.encrypt(ssn, encryptKey).toString();

    return {
      encryptedSSN: encryptedSSN,
    };
  } catch (error) {
    console.error("암호화 중 오류 발생:", error);
    throw new functions.https.HttpsError(
      "internal",
      "암호화 처리 중 오류가 발생했습니다.",
    );
  }
});

// 주민등록번호만 복호화하는 함수 (관리자 페이지에서 사용)
exports.decryptSSN = functions.https.onCall(async (data, context) => {
  console.log("=== decryptSSN 함수 호출 ===");
  console.log("context.auth:", context.auth);
  console.log("data:", data);

  // 임시: 인증 체크 완화 (인증 문제 해결 시까지)
  if (!context.auth) {
    console.log("인증 없이 복호화 요청 - 임시 허용");
  } else if (!allowedAdmins.includes(context.auth.token.email)) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "관리자만 접근 가능합니다.",
    );
  }

  try {
    // ssn 추출 - data.ssn 또는 data.data.ssn 둘 다 체크
    const ssn = data.ssn || (data.data && data.data.ssn);

    if (!ssn) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "암호화된 주민등록번호가 제공되지 않았습니다.",
      );
    }

    // AES 암호화 데이터는 일반적으로 "U2FsdGVk"로 시작하거나 길이가 최소 16자 이상이고 Base64 형태
    // 평문 데이터 감지: 짧거나 특수문자가 포함된 경우 평문으로 판단
    const isLikelyPlaintext = ssn.length < 16 ||
                              ssn.includes("!") ||
                              ssn.includes("@") ||
                              ssn.includes("#") ||
                              ssn.includes("$") ||
                              ssn.includes("%") ||
                              ssn.includes("^") ||
                              ssn.includes("&") ||
                              ssn.includes("*") ||
                              ssn.includes("(") ||
                              ssn.includes(")") ||
                              ssn.includes("-") ||
                              !ssn.match(/^[A-Za-z0-9+/].*={0,2}$/);

    if (isLikelyPlaintext) {
      console.log("평문 데이터로 판단됨, 그대로 반환:", ssn.substring(0, 5) + "...");
      return {
        ssn: ssn,
      };
    }

    const encryptKey = getEncryptKey();
    if (!encryptKey) {
      throw new functions.https.HttpsError(
        "internal",
        "암호화 키가 설정되지 않았습니다.",
      );
    }

    // 주민등록번호 복호화
    const decryptedSSN = CryptoJS.AES.decrypt(
      ssn,
      encryptKey,
    ).toString(CryptoJS.enc.Utf8);

    return {
      ssn: decryptedSSN || "복호화 실패",
    };
  } catch (error) {
    console.log("복호화 처리 중 오류:", error.message);
    throw new functions.https.HttpsError(
      "internal",
      "복호화 처리 중 오류가 발생했습니다.",
    );
  }
});

// 관리자가 데이터 조회 시 복호화하는 함수
exports.getDecryptedClientInfo = functions.https.onCall(
  async (data, context) => {
    if (
      !context.auth ||
      !allowedAdmins.includes(context.auth.token.email)
    ) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "관리자만 접근 가능합니다.",
      );
    }
    try {
      const doc = await admin
        .firestore()
        .collection("client_info")
        .doc(data.docId)
        .get();
      if (!doc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "문서를 찾을 수 없습니다.",
        );
      }
      const clientData = doc.data();
      const encryptKey = getEncryptKey();
      const decryptedSSN = CryptoJS.AES.decrypt(
        clientData.ssn,
        encryptKey,
      ).toString(CryptoJS.enc.Utf8);
      return {
        ...clientData,
        ssn: decryptedSSN,
      };
    } catch (error) {
      throw new functions.https.HttpsError(
        "internal",
        "데이터 처리 중 오류가 발생했습니다.",
      );
    }
  },
);

// 담당자 정보 저장 함수 (민감정보 암호화 후 저장)
exports.saveManagerInfo = functions.https.onCall(async (data, context) => {
  // 관리자 권한 확인
  if (!context.auth || !allowedAdmins.includes(context.auth.token.email)) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "관리자만 접근 가능합니다.",
    );
  }

  try {
    const managerData = data.data || data;
    const cleanData = {...managerData};

    const encryptKey = getEncryptKey();
    if (!encryptKey) {
      throw new functions.https.HttpsError(
        "internal",
        "암호화 키가 설정되지 않았습니다.",
      );
    }

    // 주민등록번호가 평문으로 전송된 경우 암호화
    if (cleanData.ssn && !cleanData.ssn.startsWith("U2F")) {
      cleanData.ssn = CryptoJS.AES.encrypt(cleanData.ssn, encryptKey).toString();
    }

    // 가이아 비밀번호 암호화
    if (cleanData.gaiaPassword) {
      cleanData.gaiaPassword = CryptoJS.AES.encrypt(cleanData.gaiaPassword, encryptKey).toString();
    }

    // 보험사 비밀번호 암호화
    if (cleanData.insuranceAccounts) {
      const encryptedAccounts = {};

      for (const [companyKey, accountInfo] of Object.entries(cleanData.insuranceAccounts)) {
        encryptedAccounts[companyKey] = {
          employeeId: accountInfo.employeeId || "",
          password: accountInfo.password ?
            CryptoJS.AES.encrypt(accountInfo.password, encryptKey).toString() : "",
        };
      }

      cleanData.insuranceAccounts = encryptedAccounts;
    }

    const createdAt = admin.firestore.FieldValue.serverTimestamp();
    await admin
      .firestore()
      .collection("managers")
      .add(
        Object.assign(
          {},
          cleanData,
          {
            createdAt: createdAt,
          },
        ),
      );

    return {
      message: "담당자 정보 저장 완료!",
    };
  } catch (err) {
    throw new functions.https.HttpsError(
      "internal",
      "담당자 정보 저장 실패: " + err.message,
    );
  }
});

// 클라이언트에서 직접 호출하는 Callable 함수 (민감정보 암호화 후 저장)
exports.saveClientInfo = functions.https.onCall(async (data, context) => {
  try {
    // 실제 고객 데이터는 data.data에 있음
    const clientData = data.data || data;

    // 순수 JSON만 남기기 (Firestore에 저장 불가능한 필드 제거)
    const cleanData = {...clientData};
    if (cleanData.rawRequest) delete cleanData.rawRequest;
    if (cleanData.req) delete cleanData.req;
    if (cleanData.res) delete cleanData.res;
    if (cleanData.request) delete cleanData.request;
    if (cleanData.response) delete cleanData.response;

    // 주민등록번호가 평문으로 전송된 경우 암호화
    if (cleanData.ssn && !cleanData.ssn.startsWith("U2F")) { // 암호화된 형태가 아닌 경우
      const encryptKey = getEncryptKey();
      if (!encryptKey) {
        throw new functions.https.HttpsError(
          "internal",
          "암호화 키가 설정되지 않았습니다.",
        );
      }
      cleanData.ssn = CryptoJS.AES.encrypt(cleanData.ssn, encryptKey).toString();
    }

    const createdAt = admin.firestore.FieldValue.serverTimestamp();
    await admin
      .firestore()
      .collection("client_info")
      .add(
        Object.assign(
          {},
          cleanData,
          {
            created_at: createdAt,
          },
        ),
      );

    return {
      message: "저장 완료!",
    };
  } catch (err) {
    throw new functions.https.HttpsError(
      "internal",
      "저장 실패: " + err.message,
    );
  }
});

// 마이그레이션 모드 설정 조회 함수
exports.getMigrationMode = functions.https.onCall(async (data, context) => {
  // 임시: 인증 체크 완화 (클라이언트 인증 문제 해결 후 제거 예정)
  if (!context.auth) {
    console.log("인증 없이 마이그레이션 모드 조회 - 임시 허용");
  } else if (!allowedAdmins.includes(context.auth.token.email)) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "관리자만 접근 가능합니다.",
    );
  }

  const migrationMode = process.env.MIGRATION_MODE === "true";
  return {migrationMode};
});

// 기존 데이터 마이그레이션 함수 (관리자만 호출 가능)
exports.migrateSSNEncryption = functions.https.onCall(async (data, context) => {
  // 임시: 인증 체크 완화 (클라이언트 인증 문제 해결 후 제거 예정)
  if (!context.auth) {
    console.log("인증 없이 마이그레이션 요청 - 임시 허용");
  } else if (!allowedAdmins.includes(context.auth.token.email)) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "관리자만 접근 가능합니다.",
    );
  }

  try {
    const oldKey = process.env.OLD_ENCRYPT_KEY;
    const newKey = process.env.ENCRYPT_KEY;

    if (!oldKey || !newKey) {
      throw new functions.https.HttpsError(
        "internal",
        "기존 키(OLD_ENCRYPT_KEY)와 새 키(ENCRYPT_KEY)를 모두 설정하세요.",
      );
    }

    const snapshot = await admin.firestore().collection("client_info").get();
    let success = 0;
    let fail = 0;
    let skipped = 0;

    for (const doc of snapshot.docs) {
      const clientData = doc.data();
      const encryptedSSN = clientData.ssn;

      // 암호화된 데이터가 아니면 건너뛰기
      if (!encryptedSSN || !encryptedSSN.startsWith("U2FsdGVk")) {
        skipped++;
        continue;
      }

      try {
        // 기존 키로 복호화
        const decryptedSSN = CryptoJS.AES.decrypt(encryptedSSN, oldKey).toString(CryptoJS.enc.Utf8);

        if (!decryptedSSN) {
          fail++;
          continue;
        }

        // 새 키로 재암호화
        const reEncryptedSSN = CryptoJS.AES.encrypt(decryptedSSN, newKey).toString();

        // Firestore에 저장
        await doc.ref.update({ssn: reEncryptedSSN});

        success++;
      } catch (error) {
        fail++;
      }
    }

    const result = {
      total: snapshot.size,
      success,
      fail,
      skipped,
      message: `마이그레이션 완료! 성공: ${success}, 실패: ${fail}, 건너뜀: ${skipped}`,
    };

    return result;
  } catch (error) {
    throw new functions.https.HttpsError(
      "internal",
      "마이그레이션 처리 중 오류가 발생했습니다: " + error.message,
    );
  }
});

// 담당자 정보 업데이트 함수 (민감정보 암호화 후 저장)
exports.updateManagerInfo = functions.https.onCall(async (data, context) => {
  // 임시: 인증 체크 완화 (인증 문제 해결 시까지)
  if (!context.auth) {
    console.log("인증 없이 담당자 업데이트 요청 - 임시 허용");
  } else if (!allowedAdmins.includes(context.auth.token.email)) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "관리자만 접근 가능합니다.",
    );
  }

  try {
    const managerData = data.data || data;
    const managerId = managerData.managerId;

    if (!managerId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "담당자 ID가 필요합니다.",
      );
    }

    const cleanData = {...managerData};
    delete cleanData.managerId; // 업데이트 데이터에서 ID 제거

    // createdAt 보존 (순서 유지를 위해)
    if (cleanData.createdAt) {
      console.log("기존 createdAt 보존:", cleanData.createdAt);
      // Firestore Timestamp로 변환 (필요한 경우)
      if (typeof cleanData.createdAt === "object" && cleanData.createdAt.seconds) {
        cleanData.createdAt = admin.firestore.Timestamp.fromDate(new Date(cleanData.createdAt.seconds * 1000));
      }
    } else {
      // createdAt이 없는 경우 현재 시간으로 설정 (새 담당자)
      cleanData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      console.log("새로운 createdAt 설정");
    }

    const encryptKey = getEncryptKey();
    if (!encryptKey) {
      throw new functions.https.HttpsError(
        "internal",
        "암호화 키가 설정되지 않았습니다.",
      );
    }

    // 주민등록번호 암호화
    if (cleanData.ssn && !cleanData.ssn.startsWith("U2F")) {
      cleanData.ssn = CryptoJS.AES.encrypt(cleanData.ssn, encryptKey).toString();
    }

    // 가이아 비밀번호 암호화
    if (cleanData.gaiaPassword) {
      cleanData.gaiaPassword = CryptoJS.AES.encrypt(cleanData.gaiaPassword, encryptKey).toString();
    }

    // 보험사 비밀번호 암호화
    if (cleanData.insuranceAccounts) {
      const encryptedAccounts = {};

      for (const [companyKey, accountInfo] of Object.entries(cleanData.insuranceAccounts)) {
        encryptedAccounts[companyKey] = {
          employeeId: accountInfo.employeeId || "",
          password: accountInfo.password ?
            CryptoJS.AES.encrypt(accountInfo.password, encryptKey).toString() : "",
        };
      }

      cleanData.insuranceAccounts = encryptedAccounts;
    }

    // Firestore 업데이트
    await admin
      .firestore()
      .collection("managers")
      .doc(managerId)
      .update(cleanData);

    return {
      message: "담당자 정보 업데이트 완료!",
    };
  } catch (err) {
    throw new functions.https.HttpsError(
      "internal",
      "담당자 정보 업데이트 실패: " + err.message,
    );
  }
});

// 담당자 비밀번호 설정/변경 함수
exports.setManagerPassword = functions.https.onCall(async (data, context) => {
  // 관리자 권한 체크 (관리자가 담당자 비밀번호 초기 설정)
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "인증이 필요합니다.",
    );
  }

  if (!allowedAdmins.includes(context.auth.token.email)) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "관리자만 접근 가능합니다.",
    );
  }

  try {
    const {managerId, password} = data;

    if (!managerId || !password) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "담당자 ID와 비밀번호가 필요합니다.",
      );
    }

    // 비밀번호 해싱
    const hashedPassword = CryptoJS.SHA256(password).toString(); // eslint-disable-line new-cap

    // Firestore 업데이트
    await admin
      .firestore()
      .collection("managers")
      .doc(managerId)
      .update({
        password: hashedPassword,
        passwordUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return {
      message: "비밀번호가 설정되었습니다.",
    };
  } catch (err) {
    throw new functions.https.HttpsError(
      "internal",
      "비밀번호 설정 실패: " + err.message,
    );
  }
});

// 담당자 로그인 인증 함수
exports.authenticateManager = functions.https.onCall(async (data, context) => {
  try {
    console.log("=== authenticateManager 함수 호출 ===");
    console.log("입력 데이터:", data);
    console.log("컨텍스트:", context);

    // 데이터는 data.data 안에 있음
    const {code, password} = data.data || data;
    console.log("추출된 값:", {code, password: password ? "****" : "없음"});

    if (!code || !password) {
      console.error("필수 값 누락:", {code: !!code, password: !!password});
      throw new functions.https.HttpsError(
        "invalid-argument",
        "담당자 코드와 비밀번호가 필요합니다.",
      );
    }

    // 담당자 코드로 조회
    const managerSnapshot = await admin
      .firestore()
      .collection("managers")
      .where("code", "==", code)
      .get();

    if (managerSnapshot.empty) {
      throw new functions.https.HttpsError(
        "not-found",
        "존재하지 않는 담당자 코드입니다.",
      );
    }

    const managerDoc = managerSnapshot.docs[0];
    const managerData = managerDoc.data();

    // 비밀번호가 설정되지 않은 경우
    if (!managerData.password) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "비밀번호가 설정되지 않았습니다. 관리자에게 문의하세요.",
      );
    }

    // 비밀번호 검증
    const hashedPassword = CryptoJS.SHA256(password).toString(); // eslint-disable-line new-cap
    if (managerData.password !== hashedPassword) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "비밀번호가 일치하지 않습니다.",
      );
    }

    // 로그인 성공 - 민감정보 제외하고 반환
    const {password: passwordField, ...safeManagerData} = managerData; // eslint-disable-line no-unused-vars

    return {
      message: "로그인 성공",
      manager: {
        id: managerDoc.id,
        ...safeManagerData,
      },
    };
  } catch (err) {
    if (err.code && err.code.startsWith("functions/")) {
      throw err;
    }
    throw new functions.https.HttpsError(
      "internal",
      "로그인 처리 중 오류가 발생했습니다: " + err.message,
    );
  }
});

// 담당자 본인 비밀번호 변경 함수
exports.changeManagerPassword = functions.https.onCall(async (data, context) => {
  try {
    console.log("=== changeManagerPassword 함수 호출 ===");
    console.log("입력 데이터:", data);

    // 데이터는 data.data 안에 있을 수 있음
    const {managerId, currentPassword, newPassword} = data.data || data;
    console.log("추출된 값:", {managerId, currentPassword: currentPassword ? "****" : "없음", newPassword: newPassword ? "****" : "없음"});

    if (!managerId || !currentPassword || !newPassword) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "필수 정보가 누락되었습니다.",
      );
    }

    // 현재 담당자 정보 조회
    const managerDoc = await admin
      .firestore()
      .collection("managers")
      .doc(managerId)
      .get();

    if (!managerDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "담당자를 찾을 수 없습니다.",
      );
    }

    const managerData = managerDoc.data();

    // 현재 비밀번호 검증
    const currentHashedPassword = CryptoJS.SHA256(currentPassword).toString(); // eslint-disable-line new-cap
    if (managerData.password !== currentHashedPassword) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "현재 비밀번호가 일치하지 않습니다.",
      );
    }

    // 새 비밀번호 해싱 및 업데이트
    const newHashedPassword = CryptoJS.SHA256(newPassword).toString(); // eslint-disable-line new-cap

    await managerDoc.ref.update({
      password: newHashedPassword,
      passwordUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      message: "비밀번호가 변경되었습니다.",
    };
  } catch (err) {
    if (err.code && err.code.startsWith("functions/")) {
      throw err;
    }
    throw new functions.https.HttpsError(
      "internal",
      "비밀번호 변경 실패: " + err.message,
    );
  }
});

// 기존 담당자들에게 일괄 기본 비밀번호 설정 함수
exports.setupBulkManagerPasswords = functions.https.onCall(async (data, context) => {
  // 임시: 인증 체크 완화 (인증 문제 해결 시까지)
  if (!context.auth) {
    console.log("인증 없이 일괄 비밀번호 설정 요청 - 임시 허용");
  } else if (!allowedAdmins.includes(context.auth.token.email)) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "관리자만 접근 가능합니다.",
    );
  }

  try {
    // 모든 담당자 조회
    const managersSnapshot = await admin
      .firestore()
      .collection("managers")
      .get();

    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    const defaultPassword = "0000";
    const hashedPassword = CryptoJS.SHA256(defaultPassword).toString(); // eslint-disable-line new-cap

    const updatePromises = managersSnapshot.docs.map(async (doc) => {
      try {
        const managerData = doc.data();

        // 이미 비밀번호가 있는 담당자는 건너뛰기
        if (managerData.password) {
          skippedCount++;
          return;
        }

        // 비밀번호 설정
        await doc.ref.update({
          password: hashedPassword,
          passwordUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        processedCount++;
      } catch (error) {
        console.error(`담당자 ${doc.id} 비밀번호 설정 실패:`, error);
        errorCount++;
      }
    });

    await Promise.all(updatePromises);

    return {
      message: "일괄 비밀번호 설정 완료",
      total: managersSnapshot.size,
      processed: processedCount,
      skipped: skippedCount,
      errors: errorCount,
      defaultPassword: "0000",
    };
  } catch (err) {
    throw new functions.https.HttpsError(
      "internal",
      "일괄 비밀번호 설정 실패: " + err.message,
    );
  }
});
