import ChainCrawler from '#/Monitor/Service/ChainCrawler';
import { ObjectManager } from '@100k/intiv/ObjectManager';
import AbstractApp from 'core/Module/AbstractApp';


export default class CrawlerApp
    extends AbstractApp
{

    protected async main()
    {
        const chainCrawler = ObjectManager.getInstance(ChainCrawler);
        await chainCrawler.run();
    }

}
