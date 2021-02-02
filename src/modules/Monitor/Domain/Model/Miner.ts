import Account from '#/Monitor/Domain/Model/Account';
import ChainEntity from '#/Monitor/Domain/Model/ChainEntity';
import DeviceState from '#/Monitor/Domain/Model/DeviceState';
import MinerRepository from '#/Monitor/Domain/Repository/MinerRepository';
import { EntityManager } from '@mikro-orm/core';
import * as ORM from '@mikro-orm/core';
import * as ExtGraphQL from 'core/GraphQL/Ext';
import * as ExtORM from 'core/ORM/Ext';
import * as GraphQL from 'type-graphql';
import Reward from './Reward';


@ExtGraphQL.Entity('Monitor/Miner')
@GraphQL.ObjectType()
@ORM.Entity({
    customRepository: () => MinerRepository
})
export default class Miner
    extends ChainEntity<Miner>
{

    [ORM.EntityRepositoryType]?: MinerRepository;

    @GraphQL.Field(() => Account)
    @ORM.OneToOne(() => Account, account => account.controllerOf, { owner: true, eager: true })
    public controllerAccount : Account;

    @GraphQL.Field(() => Account, { nullable: true })
    @ORM.ManyToOne(() => Account, { nullable: true, eager: true })
    public stashAccount? : Account;

    @GraphQL.Field(() => Account)
    @ORM.ManyToOne(() => Account, { inversedBy: account => account.payoutTargetOf, eager: true })
    public payoutTarget : Account;

    @GraphQL.Field(() => [ Reward ])
    @ORM.OneToMany(() => Reward, reward => reward.miner)
    public minedRewards = new ORM.Collection<Reward>(this);

    @GraphQL.Field(() => ExtGraphQL.BigIntType)
    @ORM.Property({ type: ExtORM.BigIntType })
    public fireMined : bigint = BigInt(0);

    @GraphQL.Field({ nullable: true })
    @ORM.Property()
    public state? : string = null;

    @GraphQL.Field({ nullable: true })
    @ORM.Property()
    public score? : number = null;

    @GraphQL.Field({ nullable: true })
    @ORM.Property()
    public commission? : number = null;

    @GraphQL.Field({ nullable: true })
    @ORM.Property()
    public confidenceLevel? : number = null;

    @GraphQL.Field({ nullable: true })
    @ORM.Property()
    public runtimeVersion? : number = null;

    @GraphQL.Field({ nullable: true })
    @ORM.OneToOne(() => DeviceState, deviceState => deviceState.miner, { eager: true, orphanRemoval: true })
    public deviceState? : DeviceState = null;

    public constructor(data? : Partial<Miner>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }

}
