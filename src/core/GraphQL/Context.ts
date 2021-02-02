import { EntityManager, MySqlDriver, MySqlConnection } from '@mikro-orm/mysql';
import { Request, Response } from 'express';


export default interface Context
{
    request : Request;
    response : Response;
    entityManager : EntityManager<MySqlDriver>;
}
