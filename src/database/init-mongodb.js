const { MongoClient } = require('mongodb');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// config.js 파일 가져오기
let CONFIG;
try {
  CONFIG = require('../crawl/config');
} catch (error) {
  console.warn('config.js 파일을 찾을 수 없습니다. 기본 설정을 사용합니다.', error.message);
  // 기본 설정 사용
  CONFIG = {
    DATABASE: {
      MONGODB_ADMIN_URI: 'mongodb://admin:password123@localhost:27017/admin',
      MONGODB_URI: 'mongodb://crawler_user:crawler_password@localhost:27017/crawler_db?authSource=crawler_db',
      MONGODB_DB_NAME: 'crawler_db',
      MONGODB_USER: 'crawler_user',
      MONGODB_PASSWORD: 'crawler_password'
    }
  };
}

// 연결 정보를 config.js에서 가져오기
const dbName = CONFIG.DATABASE.MONGODB_DB_NAME;
const user = CONFIG.DATABASE.MONGODB_USER;
const password = CONFIG.DATABASE.MONGODB_PASSWORD;

/**
 * MongoDB 서비스 상태를 확인합니다.
 * @returns {Promise<boolean>} MongoDB 서비스가 실행 중이면 true, 아니면 false
 */
async function checkMongoDBStatus(uri) {
  console.log('MongoDB 서비스 상태 확인 중...');

  try {
    // 간단한 연결 테스트
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 2000, // 2초 타임아웃
      connectTimeoutMS: 2000
    });
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    await client.close();
    console.log('MongoDB 서비스가 실행 중입니다.');
    return true;
  } catch (error) {
    console.log('MongoDB 서비스가 실행 중이지 않습니다:', error.message);
    return false;
  }
}

// ... 다른 함수들은 그대로 유지 ...

async function startMongoDBService() {
  // 현재 스크립트의 디렉토리 경로
  const scriptDir = path.dirname(__filename);
  const dockerComposePath = path.join(scriptDir, 'docker-compose.yml');

  // docker-compose 파일이 존재하는지 확인
  if (!fs.existsSync(dockerComposePath)) {
    console.error(`Error: docker-compose.yml 파일을 찾을 수 없음: ${dockerComposePath}`);
    console.log('docker-compose.yml 파일이 현재 디렉토리에 있는지 확인하세요.');
    throw new Error('Docker Compose 파일을 찾을 수 없습니다.');
  }

  console.log('🚀 Docker Compose를 사용하여 MongoDB 시작 중...');

  // Docker Compose up 명령어 실행
  const dockerComposeUp = spawn('docker-compose', ['up', '-d'], {
    cwd: scriptDir,
    stdio: 'inherit'
  });

  return new Promise((resolve, reject) => {
    dockerComposeUp.on('close', (code) => {
      if (code === 0) {
        console.log('✅ MongoDB 서비스가 성공적으로 시작되었습니다!');
        console.log('📊 MongoDB는 localhost:27017에서 실행 중입니다.');
        console.log('🔍 MongoDB Express UI는 http://localhost:8081에서 확인할 수 있습니다.');

        // MongoDB가 완전히 준비될 때까지 대기
        console.log('MongoDB 서비스가 준비되는 동안 10초간 대기 중...');
        setTimeout(() => resolve(true), 10000);
      } else {
        console.error(`❌ MongoDB 서비스 시작 실패. 종료 코드: ${code}`);
        reject(new Error(`Docker Compose exited with code ${code}`));
      }
    });

    dockerComposeUp.on('error', (err) => {
      console.error('❌ Docker Compose 실행 오류:', err);
      reject(err);
    });
  });
}


async function stopMongoDBService() {
  const scriptDir = path.dirname(__filename);
  const dockerComposePath = path.join(scriptDir, 'docker-compose.yml');

  if (!fs.existsSync(dockerComposePath)) {
    console.error(`Error: docker-compose.yml 파일을 찾을 수 없음: ${dockerComposePath}`);
    return;
  }

  console.log('🛑 MongoDB 서비스 중지 중...');

  const dockerComposeDown = spawn('docker-compose', ['down'], {
    cwd: scriptDir,
    stdio: 'inherit'
  });

  return new Promise((resolve, reject) => {
    dockerComposeDown.on('close', (code) => {
      if (code === 0) {
        console.log('✅ MongoDB 서비스가 성공적으로 중지되었습니다!');
        resolve();
      } else {
        console.error(`❌ MongoDB 서비스 중지 실패. 종료 코드: ${code}`);
        reject(new Error(`Docker Compose down exited with code ${code}`));
      }
    });

    dockerComposeDown.on('error', (err) => {
      console.error('❌ Docker Compose down 실행 오류:', err);
      reject(err);
    });
  });
}

async function initMongoDB(uri ,dbName) {
  let client;
  try {
    client = new MongoClient(uri);
    await client.connect();
    console.log('MongoDB에 연결됨');

    // 데이터베이스 선택
    const db = client.db(dbName);

    // 사용자 생성
    try {
      await db.command({
        createUser: user,
        pwd: password,
        roles: [{ role: 'readWrite', db: dbName }]
      });
      console.log(`사용자 ${user} 생성됨`);
    } catch (userError) {
      console.log('사용자가 이미 존재하거나 생성 오류:', userError.message);
    }

        // 컬렉션 생성
    try {
      db.createCollection('domains');
      console.log('domains 컬렉션이 생성되었습니다.');
    } catch(e) {
      console.log('컬렉션 생성 오류: ' + e);
    }

    // 인덱스 생성
    try {
      db.domains.createIndex({ domain: 1 }, { unique: true });
      db.domains.createIndex({ 'suburl_list.url': 1 });
      db.domains.createIndex({ 'suburl_list.visited': 1 });
      console.log('인덱스가 생성되었습니다.');
    } catch(e) {
      console.log('인덱스 생성 오류: ' + e);
    }

    // 새로운 사용자로 연결 테스트
    const testUri = CONFIG.DATABASE.MONGODB_URI;
    const testClient = new MongoClient(testUri);
    await testClient.connect();
    console.log(`${user}로 연결 성공!`);

    // ... 나머지 코드 ...
  } catch (error) {
    console.error('MongoDB 초기화 오류:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB 연결 종료');
    }
  }
}

// ... 나머지 코드 ...

// 명령행 인수에 따라 적절한 함수 실행
if (require.main === module) {
  const action = process.argv[2];

  switch (action) {
    case 'start':
      startMongoDBService().catch(console.error);
      break;
    case 'stop':
      stopMongoDBService().catch(console.error);
      break;
    case 'status':
      checkMongoDBStatus().catch(console.error);
      break;
    case 'init':
      initMongoDB().catch(console.error);
      break;
    case 'setup':
      setupMongoDB().catch(console.error);
      break;
    case 'config':
      // 현재 설정 출력
      console.log('현재 MongoDB 설정:');
      console.log(`- 관리자 URI: ${CONFIG.DATABASE.MONGODB_ADMIN_URI}`);
      console.log(`- 데이터베이스 이름: ${dbName}`);
      console.log(`- 사용자 이름: ${user}`);
      console.log(`- 사용자 비밀번호: ${'*'.repeat(password.length)}`);
      console.log(`- 사용자 연결 URI: ${CONFIG.DATABASE.MONGODB_URI}`);
      break;
    default:
      console.log('사용법: node init-mongodb.js [start|stop|status|init|setup|config]');
      console.log('  start  - Docker Compose를 사용하여 MongoDB 서비스 시작');
      console.log('  stop   - MongoDB 서비스 중지');
      console.log('  status - MongoDB 서비스 상태 확인');
      console.log('  init   - MongoDB 초기화 (사용자, 컬렉션, 인덱스 생성)');
      console.log('  setup  - 필요시 서비스 시작 및 초기화 수행');
      console.log('  config - 현재 MongoDB 설정 출력');
  }
}

/**
 * MongoDB 초기화 및 준비
 * 필요시 서비스 시작 및 초기화 수행
 */
async function setupMongoDB() {
  try {
    // MongoDB 서비스 상태 확인
    const isRunning = await checkMongoDBStatus();

    if (!isRunning) {
      // MongoDB 서비스 시작
      await startMongoDBService();
    }

    // 초기화
    await initMongoDB();

    console.log('MongoDB 설정 완료!');
    return true;
  } catch (error) {
    console.error('MongoDB 설정 중 오류:', error);
    throw error;
  }
}

module.exports = {
  checkMongoDBStatus,
  startMongoDBService,
  stopMongoDBService,
  initMongoDB,
  setupMongoDB,
};