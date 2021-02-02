import PolkadotApi from '#/Polkadot/Service/PolkadotApi';
import { ApiPromise } from '@polkadot/api';
import PhalaParachainTypes from '@phala/typedefs/dist/phala-dev';
import { dev } from '@phala/typedefs';


const env = process.env.NODE_ENV || 'production';
const isDev = env !== 'production';


export default class PhalaApi
    extends PolkadotApi
{

    protected static readonly API_WS_URL : string = isDev
        ? 'ws://100k-dev-server:9944/ws'
        : 'ws://host.docker.internal:9944/ws';

    protected createApi() : Promise<any>
    {
        return ApiPromise.create({
            provider: this.wsProvider,
            types: dev,
        }).then((api) => this.bindApi(api));
    }

}
