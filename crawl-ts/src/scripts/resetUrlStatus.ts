import 'dotenv/config'
import { RedisUrlManager } from '../url/RedisUrlManager';
import { URLSTAUS } from '../url/RedisUrlManager';

const urlManager = new RedisUrlManager();
urlManager.connect().then(() => {
  urlManager.getURLsByStatus(URLSTAUS.VISITED).then((urls) => {
    console.log(`Found ${urls.length} URLs with status VISITED`);
    urls.forEach((url) => {
      urlManager.setURLStatusByOldStatus(url, URLSTAUS.VISITED, URLSTAUS.NOT_VISITED).then(() => {
        console.log(`Reset status of URL: ${url}`);
      });
    });
  })
})