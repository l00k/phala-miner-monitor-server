import { EntityManager } from '@mikro-orm/core';
import * as ORM from '@mikro-orm/core';
import AbstractModel from 'core/Module/AbstractModel';
import * as GraphQL from 'type-graphql';


@GraphQL.ObjectType()
export default class ChainEntity<T>
    extends AbstractModel<ChainEntity<T> & T>
{

    @GraphQL.Field()
    @ORM.PrimaryKey()
    public id : number;

    @GraphQL.Field()
    @ORM.Property({ onCreate: () => new Date() })
    public createdAt : Date = new Date();

    @GraphQL.Field()
    @ORM.Property({ onUpdate: () => new Date() })
    public updatedAt : Date = new Date();

    public constructor(data? : Partial<ChainEntity<T> & T>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }

}
