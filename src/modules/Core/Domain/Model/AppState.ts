import * as ORM from '@mikro-orm/core';
import AbstractModel from 'core/Module/AbstractModel';
import * as ExtORM from 'core/ORM/Ext';
import * as GraphQL from 'type-graphql';


@GraphQL.ObjectType()
@ORM.Entity()
export default class AppState<T>
    extends AbstractModel<AppState<T>>
{

    @GraphQL.Field(() => GraphQL.ID)
    @ORM.PrimaryKey()
    public id : string;

    @ORM.Property({ type: ORM.JsonType })
    public value : T;

    @GraphQL.Field()
    public get data() : string
    {
        return JSON.stringify(this.value);
    }

}
