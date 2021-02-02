import AppState from '#/Core/Domain/Model/AppState';
import CrawlerState from '#/Monitor/Domain/Model/AppState/CrawlerState';
import { Context } from 'core/GraphQL';
import { GraphQLResolveInfo } from 'graphql';
import * as GraphQL from 'type-graphql';


@GraphQL.Resolver()
export default class AppStateResolver
{

    @GraphQL.Query(() => AppState)
    public async getAppState(
        @GraphQL.Ctx() { entityManager } : Context,
        @GraphQL.Info() info : GraphQLResolveInfo,
    ) : Promise<AppState<CrawlerState> | null>
    {
        const appStateRepository = entityManager.getRepository(AppState);
        return await appStateRepository.findOne({ id: CrawlerState.DEFAULT_ID });
    }

}
