import DateTimeInterval, { DateTimeIntervalInSeconds } from '#/Monitor/Domain/Model/DateTimeInterval';
import Reward, { PayoutReason } from '#/Monitor/Domain/Model/Reward';
import RewardChunk from '#/Monitor/Domain/Model/RewardChunk';
import * as GraphQLFilter from '@100k/type-graphql-filter-mikroorm';
import * as ORM from '@mikro-orm/core';
import { Context } from 'core/GraphQL';
import { GraphQLResolveInfo } from 'graphql';
import * as GraphQL from 'type-graphql';


@GraphQL.Resolver()
export default class RewardResolver
{

    @GraphQL.Query(() => [ RewardChunk ])
    public async getMinerRewards(
        @GraphQL.Arg('minerId', () => GraphQL.Int)
            minerId : number,
        @GraphQL.Arg('groupBy', () => DateTimeInterval, { defaultValue: DateTimeInterval.D1 })
            groupBy : DateTimeInterval,
        @GraphQL.Arg('pagination', GraphQLFilter.generatePaginationType(RewardChunk, [ 500 ]), { defaultValue: new GraphQLFilter.Pagination(500) })
            pagination : GraphQLFilter.Pagination,
        @GraphQL.Ctx() { entityManager } : Context,
        @GraphQL.Info() info : GraphQLResolveInfo,
    ) : Promise<RewardChunk[]>
    {
        const rewardRepository = entityManager.getRepository(Reward);

        const offset = (pagination.page - 1) * pagination.itemsPerPage;
        const interval = DateTimeIntervalInSeconds[groupBy];

        // transactions incoming
        const qb = entityManager.createQueryBuilder(Reward, 'm');
        let chunks : RewardChunk[] = await qb
            .select([
                `FLOOR(UNIX_TIMESTAMP(m.date) / ${interval}) AS chunkStamp`,
                'COUNT(m.id) AS rewardNumber',
                'SUM(m.fire) AS rewardValue',
                'm.reason'
            ])
            .where({
                miner: { $eq: minerId }
            })
            .groupBy('m.reason, (chunkStamp)')
            .orderBy({ '(chunkStamp)': ORM.QueryOrder.DESC })
            .limit(pagination.itemsPerPage, offset)
            .execute('all');

        // merge in and out chunks
        chunks = chunks.map(raw => {
            const chunk = new RewardChunk(raw);
            chunk.date = new Date(chunk.chunkStamp * interval * 1000);
            chunk.reason = chunk.reason == PayoutReason.Online
                ? PayoutReason.Online
                : PayoutReason.Compute;

            return chunk;
        });

        return chunks;
    }

}
