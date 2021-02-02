import Account from '#/Monitor/Domain/Model/Account';
import Extrinsic from '#/Monitor/Domain/Model/Extrinsic';
import Miner from '#/Monitor/Domain/Model/Miner';
import Reward from '#/Monitor/Domain/Model/Reward';
import * as ORM from '@mikro-orm/core';
import { QueryBuilder } from '@mikro-orm/mysql';
import { Context, fieldsToRelations } from 'core/GraphQL';
import { GraphQLResolveInfo } from 'graphql';
import * as GraphQL from 'type-graphql';


@GraphQL.Resolver()
export default class MinerResolver
{

    @GraphQL.Query(() => [ Miner ])
    public async getMiners(
        @GraphQL.Arg('ids', () => [ GraphQL.Int ]) ids : number[],
        @GraphQL.Ctx() { entityManager } : Context,
        @GraphQL.Info() info : GraphQLResolveInfo,
    ) : Promise<Miner[] | null>
    {
        const minerRepository = entityManager.getRepository(Miner);

        const miners = await minerRepository.find({ id: { $in: ids } });
        if (!miners) {
            return null;
        }

        const relationPaths = fieldsToRelations(info);
        for (const miner of miners) {
            await this.fillMinerData(
                entityManager,
                miner,
                relationPaths
            );
        }

        return miners;
    }

    @GraphQL.Query(() => Miner, { nullable: true })
    public async getMinerByController(
        @GraphQL.Arg('address') address : string,
        @GraphQL.Ctx() { entityManager } : Context,
        @GraphQL.Info() info : GraphQLResolveInfo,
    ) : Promise<Miner | null>
    {
        const minerRepository = entityManager.getRepository(Miner);
        const miner = await minerRepository.findOneByController(address);
        if (!miner) {
            return null;
        }

        const relationPaths = fieldsToRelations(info);
        await this.fillMinerData(
            entityManager,
            miner,
            relationPaths
        );

        return miner;
    }

    @GraphQL.Query(() => [ Miner ])
    public async getMinersByPayoutTarget(
        @GraphQL.Arg('address') address : string,
        @GraphQL.Ctx() { entityManager } : Context,
        @GraphQL.Info() info : GraphQLResolveInfo,
    ) : Promise<Miner[] | null>
    {
        const minerRepository = entityManager.getRepository(Miner);
        return await minerRepository.findByPayoutTarget(address);
    }

    protected async fillMinerData(
        entityManager : ORM.EntityManager,
        miner : Miner,
        relationPaths : string[]
    ) {
        const extrinsicRepository = entityManager.getRepository(Extrinsic);
        const rewardRepository = entityManager.getRepository(Reward);

        let subRelationsPath = [];

        subRelationsPath = relationPaths
            .filter(path => path.indexOf('controllerAccount.') === 0)
            .map(path => path.substring(18));
        if (subRelationsPath.length) {
            await this.fillAccountData(entityManager, miner.controllerAccount, subRelationsPath);
        }

        subRelationsPath = relationPaths
            .filter(path => path.indexOf('stashAccount.') === 0)
            .map(path => path.substring(18));
        if (subRelationsPath.length) {
            await this.fillAccountData(entityManager, miner.stashAccount, subRelationsPath);
        }

        if (relationPaths.indexOf('minedRewards') !== -1) {
            miner.minedRewards = <any> await rewardRepository.find({ miner: miner }, undefined, { date: ORM.QueryOrder.DESC }, 5);
        }
    }

    protected async fillAccountData(
        entityManager : ORM.EntityManager,
        account : Account,
        relationPaths : string[]
    ) {
        if (relationPaths.indexOf('extrinsics') !== -1) {
            const extrinsicRepository = entityManager.getRepository(Extrinsic);
            account.extrinsics = <any> await extrinsicRepository.find({ account }, undefined, { date: ORM.QueryOrder.DESC }, 5);
        }
    }

}
