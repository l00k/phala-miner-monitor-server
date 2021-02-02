import Miner from '#/Monitor/Domain/Model/Miner';
import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/core';
import AbstractModel from 'core/Module/AbstractModel';
import * as GraphQL from 'type-graphql';
import { registerEnumType } from 'type-graphql';


export enum ContainerState
{
    NotRunning = 'NotRunning',
    InSync = 'InSync',
    NotInitiated = 'NotInitiated',
    Running = 'Running',
}


registerEnumType(ContainerState, { name: 'ContainerState' });


@GraphQL.ObjectType()
export class DevicePartState
{

    @GraphQL.Field(() => ContainerState, { nullable: true })
    public state? : ContainerState;

    @GraphQL.Field({ nullable: true })
    public syncProgress? : number;

    @GraphQL.Field({ nullable: true })
    public temperature? : number;

}


@GraphQL.ObjectType()
@ORM.Entity()
export default class DeviceState
    extends AbstractModel<DeviceState>
{

    @GraphQL.Field()
    @ORM.PrimaryKey()
    public id : number;

    @ORM.OneToOne(() => Miner)
    public miner : Miner;

    @GraphQL.Field(() => DevicePartState)
    @ORM.Property({ type: ORM.JsonType })
    public cpu : DevicePartState = new DevicePartState();

    @GraphQL.Field(() => DevicePartState, { nullable: true })
    @ORM.Property({ type: ORM.JsonType, nullable: true })
    public node : DevicePartState = new DevicePartState();

    @GraphQL.Field(() => DevicePartState)
    @ORM.Property({ type: ORM.JsonType })
    public runtime : DevicePartState = new DevicePartState();

    @GraphQL.Field(() => DevicePartState)
    @ORM.Property({ type: ORM.JsonType })
    public host : DevicePartState = new DevicePartState();

    @GraphQL.Field()
    @ORM.Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
    public updatedAt : Date = new Date();

    public constructor(data? : Partial<DeviceState>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }

}
