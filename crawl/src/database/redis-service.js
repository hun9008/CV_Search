require('dotenv');
const { createClient } = require('redis');

class RedisService {
  constructor(config = {}) {
    this.client = createClient( {
      username: 'default',
      password: 'lYMEZAJJVEjG4vxwZ1qp4nNX553vFZvN',
      socket: {
        host: 'redis-13542.c340.ap-northeast-2-1.ec2.redns.redis-cloud.com',
        port: 13542
      }
    });

    this.client.on('error', err => console.log('Redis Client Error', err));
    this.isConnected = false;
  }

  async connect() {
    if (!this.isConnected) {
      await this.client.connect();
      this.isConnected = true;
      console.log('Redis client connected successfully');
    }
    return this.client;
  }

  async set(key, value, options = {}) {
    await this.connect();
    return await this.client.set(key, value, options);
  }

  async get(key) {
    await this.connect();
    return await this.client.get(key);
  }

  async disconnect() {
    if (this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
      console.log('Redis client disconnected');
    }
  }
}

// 싱글톤 인스턴스 생성
const redisService = new RedisService();

// 예제 사용법을 async 함수로 감싸기
async function main() {
  try {
    await redisService.set('foo', 'bar');
    const result = await redisService.get('foo');
    console.log(result); // >>> bar

    // 테스트 완료 후 연결 종료 (필요시)
    await redisService.disconnect();
  } catch (error) {
    console.error('Redis operation failed:', error);
  }
}

// 필요시 main 함수 실행 (모듈로 사용할 경우 주석 처리)
if (require.main === module) {
  main().catch(err => {
    console.error('Failed to execute Redis operations:', err);
    process.exit(1);
  });
}

module.exports = redisService;