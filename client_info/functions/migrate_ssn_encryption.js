require("dotenv").config();
const admin = require("firebase-admin");
const CryptoJS = require("crypto-js");

// Firebase Admin SDK 초기화
if (!admin.apps.length) {
  try {
    // 서비스 계정 키가 있으면 사용
    const serviceAccount = require("./serviceAccountKey.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    // 서비스 계정 키가 없으면 기본 초기화 (Firebase Functions 환경)
    admin.initializeApp();
  }
}

const db = admin.firestore();

const COLLECTION = "client_info";
const FIELD = "ssn";

const OLD_KEY = process.env.OLD_ENCRYPT_KEY;
const NEW_KEY = process.env.ENCRYPT_KEY;

if (!OLD_KEY || !NEW_KEY) {
  console.error("기존 키(OLD_ENCRYPT_KEY)와 새 키(ENCRYPT_KEY)를 .env에 모두 입력하세요.");
  process.exit(1);
}

/**
 * 마이그레이션 함수
 */
async function migrate() {
  const snapshot = await db.collection(COLLECTION).get();
  let success = 0; let fail = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const encrypted = data[FIELD];
    if (!encrypted || !encrypted.startsWith("U2FsdGVk")) {
      console.log(`[${doc.id}] 암호화된 ssn 없음, 건너뜀.`);
      continue;
    }
    // 기존 키로 복호화
    let plain;
    try {
      plain = CryptoJS.AES.decrypt(encrypted, OLD_KEY).toString(CryptoJS.enc.Utf8);
      if (!plain) throw new Error("복호화 실패");
    } catch (e) {
      console.error(`[${doc.id}] 복호화 실패:`, e.message);
      fail++;
      continue;
    }
    // 새 키로 재암호화
    const reEncrypted = CryptoJS.AES.encrypt(plain, NEW_KEY).toString();
    // Firestore에 저장
    try {
      await doc.ref.update({[FIELD]: reEncrypted});
      console.log(`[${doc.id}] 마이그레이션 성공`);
      success++;
    } catch (e) {
      console.error(`[${doc.id}] 저장 실패:`, e.message);
      fail++;
    }
  }
  console.log(`\n마이그레이션 완료! 성공: ${success}, 실패: ${fail}`);
}

migrate().then(() => process.exit(0));
