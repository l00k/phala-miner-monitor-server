import ChainEntity from '#/Monitor/Domain/Model/ChainEntity';
import Extrinsic from '#/Monitor/Domain/Model/Extrinsic';
import Miner from '#/Monitor/Domain/Model/Miner';
import { EntityManager } from '@mikro-orm/core';
import * as ORM from '@mikro-orm/core';
import AbstractModel from 'core/Module/AbstractModel';
import * as ExtORM from 'core/ORM/Ext';
import * as ExtGraphQL from 'core/GraphQL/Ext';
import { invertBy } from 'lodash-es';
import * as GraphQL from 'type-graphql';
import Reward from './Reward';



@ExtGraphQL.Entity('Monitor/Account')
@GraphQL.ObjectType()
@ORM.Entity()
export default class Account
    extends ChainEntity<Account>
{

    @GraphQL.Field()
    @ORM.Property({ index: true })
    public address : string;

    @GraphQL.Field(() => ExtGraphQL.BigIntType)
    @ORM.Property({ type: ExtORM.BigIntType })
    public balance : bigint = BigInt(0);

    @GraphQL.Field(() => ExtGraphQL.BigIntType)
    @ORM.Property({ type: ExtORM.BigIntType })
    public fire : bigint = BigInt(0);

    @GraphQL.Field(() => [Extrinsic])
    @ORM.OneToMany(() => Extrinsic, extrinsic => extrinsic.account)
    public extrinsics = new ORM.Collection<Extrinsic>(this);

    @ORM.OneToMany(() => Miner, miner => miner.stashAccount)
    public stashOf? : Miner;

    @ORM.OneToOne(() => Miner, miner => miner.controllerAccount)
    public controllerOf? : Miner;

    @ORM.OneToMany(() => Miner, miner => miner.payoutTarget)
    public payoutTargetOf? = new ORM.Collection<Miner>(this);

    @GraphQL.Field(() => [Reward])
    @ORM.OneToMany(() => Reward, reward => reward.payoutTarget)
    public receivedRewards = new ORM.Collection<Reward>(this);

    @GraphQL.Field(() => ExtGraphQL.BigIntType, { nullable: true })
    @ORM.Property({ type: ExtORM.BigIntType })
    public stake? : bigint = null;

    @GraphQL.Field({ nullable: true })
    @ORM.Property()
    public secretKeyHash? : string = null;


    @GraphQL.Field()
    public get isStash () : boolean
    {
        return this.stashOf !== null;
    }

    @GraphQL.Field()
    public get isController () : boolean
    {
        return this.controllerOf !== null;
    }

    @GraphQL.Field()
    public get isPayoutTarget () : boolean
    {
        return this.payoutTargetOf.count() > 0;
    }

    public constructor(data? : Partial<Account>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }

}
