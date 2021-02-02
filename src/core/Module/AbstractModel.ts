import { EntityManager } from '@mikro-orm/core';
import * as ORM from '@mikro-orm/core';
import { Exception } from 'core/Exception';
import * as GraphQL from 'type-graphql';


export enum ApiResourceStatus
{
    New = 'new',
    Fetching = 'fetching',
    Ready = 'ready',
}


@GraphQL.ObjectType({ isAbstract: true })
export default class AbstractModel<T extends { id: any }>
    extends ORM.BaseEntity<T, 'id'>
{

    @GraphQL.Field({ nullable: true })
    public get _fullname (): string
    {
        throw new Exception('Undefined type');
    }

    public constructor(data? : Partial<T>, entityManager? : EntityManager)
    {
        super();
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }

}
