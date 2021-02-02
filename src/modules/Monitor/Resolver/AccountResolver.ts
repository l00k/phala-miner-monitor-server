import Account from '#/Monitor/Domain/Model/Account';
import Extrinsic from '#/Monitor/Domain/Model/Extrinsic';
import Reward from '#/Monitor/Domain/Model/Reward';
import * as ORM from '@mikro-orm/core';
import { u8aToHex } from '@polkadot/util';
import { decodeAddress, signatureVerify } from '@polkadot/util-crypto';
import bcrypt from 'bcrypt';
import { Context, fieldsToRelations } from 'core/GraphQL';
import { GraphQLResolveInfo } from 'graphql';
import * as GraphQL from 'type-graphql';


@GraphQL.Resolver()
export default class AccountResolver
{

    @GraphQL.Query(() => [ Account ])
    public async getAccounts(
        @GraphQL.Arg('ids', () => [ GraphQL.Int ]) ids : number[],
        @GraphQL.Ctx() { entityManager } : Context,
        @GraphQL.Info() info : GraphQLResolveInfo,
    ) : Promise<Account[] | null>
    {
        const accountRepository = entityManager.getRepository(Account);
        const extrinsicRepository = entityManager.getRepository(Extrinsic);

        const accounts = await accountRepository.find({ id: { $in: ids } });
        if (!accounts) {
            return null;
        }

        const relationPaths = fieldsToRelations(info);
        for (const account of accounts) {
            await this.fillAccountData(
                entityManager,
                account,
                relationPaths
            );
        }

        return accounts;
    }

    @GraphQL.Query(() => Account, { nullable: true })
    public async getAccount(
        @GraphQL.Arg('address') address : string,
        @GraphQL.Ctx() { entityManager } : Context,
        @GraphQL.Info() info : GraphQLResolveInfo,
    ) : Promise<Account | null>
    {
        const accountRepository = entityManager.getRepository(Account);

        const account = await accountRepository.findOne({ address: { $eq: address } });
        if (!account) {
            return null;
        }

        const relationPaths = fieldsToRelations(info);
        await this.fillAccountData(
            entityManager,
            account,
            relationPaths
        );

        return account;
    }

    protected async fillAccountData(
        entityManager : ORM.EntityManager,
        account : Account,
        relationPaths : string[]
    )
    {
        if (relationPaths.indexOf('extrinsics') !== -1) {
            const extrinsicRepository = entityManager.getRepository(Extrinsic);
            account.extrinsics = <any> await extrinsicRepository.find({ account }, undefined, { date: ORM.QueryOrder.DESC }, 3);
        }
        if (relationPaths.indexOf('receivedRewards') !== -1) {
            const rewardRepository = entityManager.getRepository(Reward);
            account.receivedRewards = <any> await rewardRepository.find({ payoutTarget: account }, undefined, { date: ORM.QueryOrder.DESC }, 5);
        }
    }

    @GraphQL.Mutation(() => Account)
    public async setPayoutTargetSecretKey(
        @GraphQL.Arg('payoutTargetAddress') payoutTargetAddress : string,
        @GraphQL.Arg('secretKey') secretKey : string,
        @GraphQL.Arg('signature') signature : string,
        @GraphQL.Ctx() { entityManager } : Context,
        @GraphQL.Info() info : GraphQLResolveInfo,
    ) : Promise<Account>
    {
        const accountRepository = entityManager.getRepository(Account);
        const payoutTarget = await accountRepository.findOne({ address: { $eq: payoutTargetAddress } });
        if (!payoutTarget) {
            throw 'Account not found';
        }

        // verify signature
        const publicKey = decodeAddress(payoutTargetAddress);
        const hexPublicKey = u8aToHex(publicKey);
        const signedMessage = `accountOwnershipConfirmation(${ secretKey })`;

        const { isValid } = signatureVerify(signedMessage, signature, hexPublicKey);
        if (!isValid) {
            throw 'Invalid signature';
        }

        payoutTarget.secretKeyHash = bcrypt.hashSync(secretKey, 10);
        entityManager.persistAndFlush(payoutTarget);

        return payoutTarget;
    }

}
