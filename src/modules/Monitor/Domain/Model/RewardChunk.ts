import { PayoutReason } from '#/Monitor/Domain/Model/Reward';
import { Initializable, Property } from '@100k/intiv/Initializable';
import * as ORM from '@mikro-orm/core';
import * as ExtGraphQL from 'core/GraphQL/Ext';
import * as ExtORM from 'core/ORM/Ext';
import * as GraphQL from 'type-graphql';


@ExtGraphQL.Entity('Monitor/RewardChunk')
@GraphQL.ObjectType()
export default class RewardChunk
    extends Initializable<RewardChunk>
{

    @GraphQL.Field()
    @Property()
    public chunkStamp : number;

    @GraphQL.Field()
    @Property()
    public date : Date;

    @GraphQL.Field()
    @Property()
    public rewardNumber : number = 0;

    @GraphQL.Field(() => ExtGraphQL.BigIntType)
    @Property()
    public rewardValue : bigint = BigInt(0);

    @GraphQL.Field(() => PayoutReason)
    @Property()
    public reason : PayoutReason;

    public constructor(data? : Partial<RewardChunk>)
    {
        super();
        this.setData(data);
    }

}
