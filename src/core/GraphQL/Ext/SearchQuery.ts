import * as Assert from 'class-validator';
import * as GraphQL from 'type-graphql';


@GraphQL.ArgsType()
export default class SearchQuery
{

    @GraphQL.Field(() => GraphQL.Int)
    @Assert.Min(1)
    public page : number = 1;

    @GraphQL.Field(() => GraphQL.Int)
    @Assert.Min(1)
    @Assert.Max(50)
    public pageSize = 25;

    public get offset() : number
    {
        return this.pageSize * (this.page - 1);
    }

    public get limit() : number
    {
        return this.pageSize;
    }

    public getFilters()
    {
        const filters = { ...this };
        delete filters.page;
        delete filters.pageSize;
        return filters;
    }

}
