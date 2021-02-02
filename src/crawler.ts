import { ObjectManager } from '@100k/intiv/ObjectManager';
import CrawlerApp from '#/Monitor/App/CrawlerApp';
import dotenv from 'dotenv';

global['__basedir'] = __dirname;

(async() => {
    dotenv.config();

    const engine = ObjectManager.getInstance(CrawlerApp);
    await engine.run();

    ObjectManager.releaseAll();
})();
