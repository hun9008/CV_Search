import { MongoDBService } from './mongodb-service.js';



const db = new MongoDBService();
await db.resetAllVisitedStatus();