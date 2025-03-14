import { MongoDBService } from './mongodb-service.js';

const db = new MongoDBService();
const result = await db.getUrlStats();
console.log(result);


