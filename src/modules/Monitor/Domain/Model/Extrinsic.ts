import Account from '#/Monitor/Domain/Model/Account';
import Reward from '#/Monitor/Domain/Model/Reward';
import { EntityManager } from '@mikro-orm/core';
import * as ORM from '@mikro-orm/core';
import * as ExtGraphQL from 'core/GraphQL/Ext';
import AbstractModel from 'core/Module/AbstractModel';
import * as GraphQL from 'type-graphql';


@ExtGraphQL.Entity('Monitor/Extrinsic')
@GraphQL.ObjectType()
@ORM.Entity()
export default class Extrinsic
    extends AbstractModel<Extrinsic>
{

    @GraphQL.Field(() => GraphQL.ID)
    @ORM.PrimaryKey()
    public id : number;

    @ORM.Property()
    public blockNumber : number;

    @GraphQL.Field()
    @ORM.Property({ unique: true })
    public hash : string;

    @GraphQL.Field()
    @ORM.Property()
    public action : string;

    @GraphQL.Field(() => Account)
    @ORM.ManyToOne(() => Account)
    public account : Account;

    @GraphQL.Field(() => [Reward])
    @ORM.OneToMany(() => Reward, reward => reward.extrinsic)
    public rewards = new ORM.Collection<Reward>(this);

    @GraphQL.Field({ nullable: true })
    @ORM.Property()
    public isSuccessful? : boolean = null;

    @GraphQL.Field()
    @ORM.Property({ index: true })
    public date : Date;

    public constructor(data? : Partial<Extrinsic>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }

}
