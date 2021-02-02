import { ObjectManager } from '@100k/intiv/ObjectManager';
import ApiApp from '#/Monitor/App/ApiApp';
import dotenv from 'dotenv';

global['__basedir'] = __dirname;

(async() => {
    dotenv.config();

    const engine = ObjectManager.getInstance(ApiApp);
    await engine.run();
})();
