import Account from '#/Monitor/Domain/Model/Account';
import Extrinsic from '#/Monitor/Domain/Model/Extrinsic';
import Miner from '#/Monitor/Domain/Model/Miner';
import { EntityManager } from '@mikro-orm/core';
import * as ORM from '@mikro-orm/core';
import * as ExtGraphQL from 'core/GraphQL/Ext';
import AbstractModel from 'core/Module/AbstractModel';
import * as ExtORM from 'core/ORM/Ext';
import * as GraphQL from 'type-graphql';
import { registerEnumType } from 'type-graphql';


export enum PayoutReason
{
    Online = 'online',
    Compute = 'compute',
}

registerEnumType(PayoutReason, { name: 'PayoutReason' });


@ExtGraphQL.Entity('Monitor/Reward')
@GraphQL.ObjectType()
@ORM.Entity()
export default class Reward
    extends AbstractModel<Reward>
{

    @GraphQL.Field(() => GraphQL.ID)
    @ORM.PrimaryKey()
    public id : number;

    @ORM.ManyToOne(() => Extrinsic)
    public extrinsic : Extrinsic;

    @ORM.ManyToOne(() => Account)
    public controller : Account;

    @ORM.ManyToOne(() => Miner)
    public miner : Miner;

    @ORM.ManyToOne(() => Account)
    public payoutTarget : Account;

    @GraphQL.Field(() => ExtGraphQL.BigIntType)
    @ORM.Property({ type: ExtORM.BigIntType })
    public fire : bigint = BigInt(0);

    @GraphQL.Field(() => PayoutReason)
    @ORM.Enum({ items: () => PayoutReason })
    public reason : PayoutReason;

    @GraphQL.Field()
    @ORM.Property({ index: true })
    public date : Date;

    public constructor(data? : Partial<Reward>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }

}
