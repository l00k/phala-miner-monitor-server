export default class CrawlerState
{

    public static DEFAULT_ID = 'monitor/rewards_fetcher';

    public currentHeadBlock : number = 0;

    public lastFetchedBlock : number = 0;

    public lastInfoUpdateBlock : number = 0;

}
