import AppState from '#/Core/Domain/Model/AppState';
import Account from '#/Monitor/Domain/Model/Account';
import CrawlerState from '#/Monitor/Domain/Model/AppState/CrawlerState';
import Extrinsic from '#/Monitor/Domain/Model/Extrinsic';
import Miner from '#/Monitor/Domain/Model/Miner';
import Reward, { PayoutReason } from '#/Monitor/Domain/Model/Reward';
import MinerRepository from '#/Monitor/Domain/Repository/MinerRepository';
import PhalaApi from '#/Phala/Service/PhalaApi';
import * as PhalaType from '#/Phala/Api/Type';
import { Inject } from '@100k/intiv/ObjectManager';
import * as ORM from '@mikro-orm/core';
import { MikroORM, EntityManager } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/core/entity';
import { ApiPromise } from '@polkadot/api';
import { Header } from '@polkadot/types/interfaces/runtime';
import type { Codec } from '@polkadot/types/types';
import { Exception } from 'core/Exception';


type ObjectMap<V> = {
    [index : string] : V
};


export default class ChainCrawler
{

    protected static BLOCK_CHUNK = 250;

    protected static ACCOUNT_UPDATE_DELTA = 1200;

    protected static ACCOUNT_CHUNK = 250;

    @Inject({ name: 'orm' })
    protected orm : MikroORM;

    @Inject()
    protected phalaApi : PhalaApi;

    protected nativeApi : ApiPromise;

    protected entityManagerDirect : EntityManager;
    protected entityManager : EntityManager;
    protected accountRepository : EntityRepository<Account>;
    protected minerRepository : MinerRepository;

    protected appState : AppState<CrawlerState>;

    protected finalizedBlockHeader : Header;

    protected temporaryMinerList : ObjectMap<Miner> = {};
    protected temporaryAccountList : ObjectMap<Account> = {};


    public async run()
    {
        await this.init();
        console.log('Crawler ready');

        let isInSync = false;

        const finalizedHead = await this.nativeApi.rpc.chain.getFinalizedHead();
        this.finalizedBlockHeader = await this.nativeApi.rpc.chain.getHeader(finalizedHead);

        const finalizedBlockNumber = this.finalizedBlockHeader.number.toNumber();

        let blockDelta;
        do {
            blockDelta = finalizedBlockNumber - this.appState.value.lastFetchedBlock;

            console.log('Fetching new blocks');
            const result = await this.fetchNewBlocks();
            if (!result) {
                return;
            }
        }
        while(blockDelta > 0);

        const deltaUpdateBlock = finalizedBlockNumber - this.appState.value.lastInfoUpdateBlock;
        if (deltaUpdateBlock > ChainCrawler.ACCOUNT_UPDATE_DELTA) {
            console.log('Updating accounts');
            await this.updateAccountsInfo();
        }

        if (this.entityManager) {
            await this.entityManager.flush();
        }
    }

    protected async init()
    {
        this.nativeApi = await this.phalaApi.api();

        this.entityManagerDirect = await this.orm.em;

        // fetch app state
        const appStateRepository = this.orm.em.getRepository(AppState);
        this.appState = await appStateRepository.findOne(CrawlerState.DEFAULT_ID);

        if (!this.appState) {
            this.appState = new AppState({
                id: CrawlerState.DEFAULT_ID,
                value: new CrawlerState(),
            });

            appStateRepository.persist(this.appState);
            appStateRepository.flush();
        }
    }

    protected async initEntityManager()
    {
        if (this.entityManager) {
            this.entityManager.clear();
            delete this.entityManager;
        }

        this.entityManager = await this.orm.em.fork(false);
        this.accountRepository = this.entityManager.getRepository(Account);
        this.minerRepository = this.entityManager.getRepository(Miner);
    }


    /*
     * ##################
     * Fetching new block
     */
    protected async fetchNewBlocks()
    {
        let blockNumber = this.appState.value.lastFetchedBlock;

        const lastBlockToIndex = Math.min(
            this.finalizedBlockHeader.number.toNumber(),
            blockNumber + ChainCrawler.BLOCK_CHUNK
        );

        while (blockNumber < lastBlockToIndex) {
            ++blockNumber;

            console.log('new block', blockNumber);

            await this.initEntityManager();
            await this.entityManager.begin();

            try {
                await this.fetchNextNewBlock(blockNumber);
                await this.entityManager.commit();
            }
            catch (e) {
                await this.entityManager.rollback();
                console.error(e);
                return false;
            }
        }

        return true;
    }

    protected async fetchNextNewBlock(blockNumber : number)
    {
        const blockHash = await this.nativeApi.rpc.chain.getBlockHash(blockNumber);
        if (!blockHash) {
            throw new Exception('Block not found', 1613180182057);
        }

        const { block } = await this.nativeApi.rpc.chain.getBlock(blockHash);
        const allEvents = await this.nativeApi.query.system.events.at(block.header.hash);

        const allExtrinsics = block.extrinsics
            .map((extrinsic, index) => ({ extrinsic, index }));

        const timestampExtrinsic = allExtrinsics.find(({ extrinsic }) => extrinsic.method.section === 'timestamp' && extrinsic.method.method === 'set');
        const blockTimestamp = timestampExtrinsic
            ? parseInt(timestampExtrinsic.extrinsic.args[0].toString())
            : 0;
        const blockDate = new Date(blockTimestamp);

        const phalaExtrinsics = allExtrinsics
            .filter(entry => entry.extrinsic.method.section === 'phala');

        // for each extrinsic in block
        for (const entry of phalaExtrinsics) {
            const action = `${ entry.extrinsic.method.section }(${ entry.extrinsic.method.method })`;
            console.log('.');

            const accountAddress = entry.extrinsic.signer.toString();
            const account = await this.getOrCreateAccount(accountAddress);

            const extrinsicEvents = allEvents
                .filter(({ phase }) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(entry.index));

            // create extrinsic entry
            const extrinsic = new Extrinsic({
                blockNumber,
                hash: entry.extrinsic.hash.toString(),
                account,
                action,
                date: blockDate,
            }, this.entityManager);

            // check validity
            extrinsicEvents
                .forEach(({ event }) => {
                    if (this.nativeApi.events.system.ExtrinsicSuccess.is(event)) {
                        extrinsic.isSuccessful = true;
                    }
                    else if (this.nativeApi.events.system.ExtrinsicFailed.is(event)) {
                        extrinsic.isSuccessful = false;
                    }
                });

            this.entityManager.persist(extrinsic);

            // check miner extrinsics
            if (entry.extrinsic.method.method === 'syncWorkerMessage') {
                // get miner entity
                const miner = await this.getOrCreateMiner(accountAddress);

                const rewardEvents = extrinsicEvents
                    .filter(({ event }) => event.section === 'phala' && event.method === 'PayoutReward');

                // check payout events
                for (const { event } of rewardEvents) {
                    const eventName = `${event.section}::${event.method}`
                    console.log('.');

                    const payoutTargetAddress = event.data[0].toString();
                    const payoutTargetAccount = await this.getOrCreateAccount(payoutTargetAddress);
                    payoutTargetAccount.payoutTargetOf.add(miner);

                    const fire = BigInt(event.data[1].toString());

                    const reason = event.data[3].toString() === 'OnlineReward'
                        ? PayoutReason.Online
                        : event.data[3].toString() === 'ComputeReward'
                            ? PayoutReason.Compute
                            : null;

                    const reward = new Reward({
                        extrinsic,
                        miner,
                        controller: account,
                        payoutTarget: payoutTargetAccount,
                        fire,
                        date: blockDate,
                        reason,
                    }, this.entityManager);

                    this.entityManager.persist(reward);

                    payoutTargetAccount.fire = BigInt(payoutTargetAccount.fire) + fire;
                    miner.fireMined = BigInt(miner.fireMined) + fire;
                }
            }
            else if ([ 'setPayoutPrefs', 'startMiningIntention', 'stopMiningIntention' ].includes(entry.extrinsic.method.method)) {
                // update miner
                await this.getOrCreateMiner(accountAddress);
            }
        }

        this.appState.value.currentHeadBlock = this.finalizedBlockHeader.number.toNumber();
        this.appState.value.lastFetchedBlock = blockNumber;
        this.entityManager.persist(this.appState);
    }

    protected async getOrCreateMiner(controllerAddress : string, data : Partial<Miner> = {}) : Promise<Miner>
    {
        if (!this.temporaryMinerList[controllerAddress]) {
            let miner : Miner = await this.minerRepository.findOneByController(controllerAddress);
            if (!miner) {
                console.log('.');

                const controllerAccount = await this.getOrCreateAccount(controllerAddress);

                miner = new Miner({ ...data, controllerAccount }, this.entityManager);
                await this.updateMiner(miner);

                this.entityManager.persist(miner);
            }

            this.temporaryMinerList[controllerAddress] = miner;
        }
        else {
            const miner = this.temporaryMinerList[controllerAddress];
            await this.updateMiner(miner);
        }

        return this.temporaryMinerList[controllerAddress];
    }

    protected async getOrCreateAccount(address : string, data : Partial<Account> = {}) : Promise<Account>
    {
        if (!this.temporaryAccountList[address]) {
            let account : Account = <Account> await this.entityManager.findOne(
                Account,
                { address },
                [ 'stashOf' ]
            );
            if (!account) {
                console.log('.');

                account = new Account({ ...data, address: address }, this.entityManager);
                await this.updateAccount(account);

                this.entityManager.persist(account);
            }

            this.temporaryAccountList[address] = account;
        }

        return this.temporaryAccountList[address];
    }


    /*
     * ################
     * Account updating
     */
    protected async updateAccountsInfo()
    {
        await this.initEntityManager();

        const accountsCount = await this.accountRepository.count();
        const minersCount = await this.minerRepository.count();

        let processed = 0;
        while (processed < minersCount) {
            try {
                processed += await this.updateMinersInfoChunk(processed, ChainCrawler.ACCOUNT_CHUNK);
                console.log(`Miners chunk updated (${ processed })`);

            }
            catch (e) {
                console.error(e);
                return;
            }
        }

        processed = 0;
        while (processed < accountsCount) {
            try {
                processed += await this.updateAccountsInfoChunk(processed, ChainCrawler.ACCOUNT_CHUNK);
                console.log(`Accounts chunk updated (${ processed })`);

                await this.entityManager.flush();
            }
            catch (e) {
                console.error(e);
                return;
            }
        }

        this.appState.value.lastInfoUpdateBlock = this.finalizedBlockHeader.number.toNumber();
        this.entityManager.persist(this.appState);

        await this.entityManager.flush();
    }

    protected async updateAccountsInfoChunk(offset : number, limit : number) : Promise<number>
    {
        const accounts = await this.accountRepository.find(
            {},
            undefined,
            { id: ORM.QueryOrder.ASC },
            limit,
            offset
        );

        let processed = 0;
        for (const account of accounts) {
            await this.updateAccount(account);

            this.entityManager.persist(account);
            await this.entityManager.flush();

            ++processed;
        }

        return processed;
    }

    protected async updateMinersInfoChunk(offset : number, limit : number) : Promise<number>
    {
        const miners = await this.minerRepository.find(
            {},
            undefined,
            { id: ORM.QueryOrder.ASC },
            limit,
            offset
        );

        let processed = 0;
        for (const miner of miners) {
            await this.updateMiner(miner);

            this.entityManager.persist(miner);
            await this.entityManager.flush();

            ++processed;
        }

        return processed;
    }

    protected async updateMiner(miner : Miner)
    {
        // update stash account
        const stash = await this.nativeApi.query.phala.stash(miner.controllerAccount.address);
        const stashAddress = stash.toString();
        if (!stashAddress) {
            miner.stashAccount = null;
            miner.payoutTarget = null;
            return;
        }

        if (
            !miner.stashAccount
            || miner.stashAccount.address !== stashAddress
        ) {
            // fetch stash account
            const stashAccount = await this.getOrCreateAccount(stashAddress);
            miner.stashAccount = stashAccount;
        }

        // update payout target and commision
        const stashInfoRaw = await this.nativeApi.query.phala.stashState(miner.stashAccount.address);
        const stashInfo : PhalaType.StashInfo = <any> stashInfoRaw.toJSON();

        miner.commission = stashInfo?.payoutPrefs.commission;

        if (
            !miner.payoutTarget
            || miner.payoutTarget.address !== stashInfo?.payoutPrefs?.target
        ) {
            miner.payoutTarget = await this.getOrCreateAccount(stashInfo.payoutPrefs.target);
        }

        // update fire mined
        miner.fireMined = await this.minerRepository.getFireMined(miner);

        // update data by worker state
        const workerStateRaw = await this.nativeApi.query.phala.workerState(miner.stashAccount.address);
        const workerState : PhalaType.WorkerState = <any> workerStateRaw.toJSON()

        const state = Object.entries((<any>workerStateRaw).state.toHuman())[0];

        miner.state = state[0];
        miner.score = workerState?.score?.overallScore;
        miner.confidenceLevel = workerState?.confidenceLevel;
        miner.runtimeVersion = workerState?.runtimeVersion;
    }

    protected async updateAccount(account : Account)
    {
        // update balance
        const { data: balance } = await this.nativeApi.query.system.account(account.address);
        account.balance = BigInt(balance.free.toString());

        // update fire
        const fire = await this.nativeApi.query.phala.fire2(account.address);
        if (fire) {
            account.fire = BigInt(fire.toString());
        }

        // fetch stake amount
        const stakeReceived : Codec = <any> await this.nativeApi.query.miningStaking.stakeReceived(account.address);
        account.stake = BigInt(stakeReceived.toString());
    }

}
