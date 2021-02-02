import DeviceState from '#/Monitor/Domain/Model/DeviceState';
import Miner from '#/Monitor/Domain/Model/Miner';
import UpdateDeviceStateInput from '#/Monitor/Resolver/Input/UpdateDeviceStateInput';
import { stringToU8a } from '@polkadot/util';
import { Context } from 'core/GraphQL';
import { GraphQLResolveInfo } from 'graphql';
import * as GraphQL from 'type-graphql';
import bcrypt from 'bcrypt';


@GraphQL.Resolver()
export default class DeviceStateResolver
{

    @GraphQL.Mutation(() => DeviceState)
    public async updateMinerDeviceInfo(
        @GraphQL.Arg('controllerAddress') controllerAddress : string,
        @GraphQL.Arg('secretKey') secretKey : string,
        @GraphQL.Arg('deviceState', () => UpdateDeviceStateInput) deviceStateInput : UpdateDeviceStateInput,
        @GraphQL.Ctx() { entityManager } : Context,
        @GraphQL.Info() info : GraphQLResolveInfo,
    ) : Promise<DeviceState>
    {
        const minerRepository = entityManager.getRepository(Miner);

        const miner = await minerRepository.findOneByController(controllerAddress);
        if (!miner) {
            throw 'Miner not found';
        }

        const validSecretKey = bcrypt.compareSync(secretKey, miner.payoutTarget.secretKeyHash);
        if (!validSecretKey) {
            throw 'Wrong secret key';
        }

        if (!miner.deviceState) {
            miner.deviceState = new DeviceState({}, entityManager);
        }
        const rawInput = JSON.parse(JSON.stringify(deviceStateInput));
        miner.deviceState.assign(rawInput, { merge: true });

        await entityManager.persistAndFlush(miner);

        return miner.deviceState;
    }

}
