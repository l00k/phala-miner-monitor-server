import Miner from '#/Monitor/Domain/Model/Miner';
import Reward from '#/Monitor/Domain/Model/Reward';
import { EntityRepository } from '@mikro-orm/mysql';


export default class MinerRepository
    extends EntityRepository<Miner>
{

    public async findOneByController(address : string) : Promise<Miner | null>
    {
        return this.findOne({
            controllerAccount: {
                address: { $eq: address }
            }
        });
    }

    public async findByPayoutTarget(address : string) : Promise<Miner[]>
    {
        return this.find({
            payoutTarget: {
                address: { $eq: address }
            }
        });
    }

    public async getFireMined(miner : Miner) : Promise<bigint>
    {
        const result = await this.createQueryBuilder('m')
            .select('SUM(r.fire) AS fireMined')
            .leftJoin('minedRewards', 'r')
            .where({
                'm.id': { $eq: miner.id }
            })
            .execute<{ fireMined: string }>('get');

        return BigInt(result.fireMined || 0);
    }

}
