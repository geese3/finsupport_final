// 환경별 설정
const config = {
  development: {
    firebaseApiKey: 'AIzaSyA-N7FA3LyOs35W4-LQPnsJAo313mSG8XY',
    firebaseAuthDomain: 'client-insurance-42400.firebaseapp.com',
    firebaseProjectId: 'client-insurance-42400',
    firebaseStorageBucket: 'client-insurance-42400.firebasestorage.app',
    firebaseMessagingSenderId: '1093798525474',
    firebaseAppId: '1:1093798525474:web:05a799e12064fae4c9e87b',
    firebaseMeasurementId: 'G-R9WCBDJX1F'
  },
  production: {
    firebaseApiKey: 'AIzaSyA-N7FA3LyOs35W4-LQPnsJAo313mSG8XY',
    firebaseAuthDomain: 'client-insurance-42400.firebaseapp.com',
    firebaseProjectId: 'client-insurance-42400',
    firebaseStorageBucket: 'client-insurance-42400.firebasestorage.app',
    firebaseMessagingSenderId: '1093798525474',
    firebaseAppId: '1:1093798525474:web:05a799e12064fae4c9e87b',
    firebaseMeasurementId: 'G-R9WCBDJX1F'
  }
};

// 환경 구분과 무관하게 항상 development 사용
const env = 'development';
// const env = require('dotenv')
// env.config();

// console.log(process.env.ENCRYPT_KEY);

const currentConfig = config[env];
window.currentConfig = currentConfig; 