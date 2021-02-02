import { Configuration } from '@100k/intiv/Configuration';
import { EventBus } from '@100k/intiv/EventBus';
import { Inject } from '@100k/intiv/ObjectManager';
import { MikroORM } from '@mikro-orm/core';
import bodyParser from 'body-parser';
import { Context } from 'core/GraphQL';
import ModuleLoader from 'core/Loader/ModuleLoader';
import AbstractResolver from 'core/Module/AbstractResolver';
import cors from 'cors';
import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import * as fs from 'fs';
import { GraphQLSchema } from 'graphql';
import http from 'http';
import https from 'https';
import rateLimit from 'express-rate-limit';
import { buildSchema } from 'type-graphql';


const env = process.env.NODE_ENV || 'production';
const isDev = env !== 'production';


export default class ExpressFactory
{

    @Inject()
    protected configuration : Configuration;

    @Inject()
    public moduleLoader : ModuleLoader;

    @Inject()
    public eventBus : EventBus;

    @Inject({ name: 'orm' })
    protected orm : MikroORM;

    public async create() : Promise<express.Application>
    {
        // create and configure express
        const expressServer = express();

        expressServer.disable('x-powered-by');
        expressServer.use(cors());

        let httpServer = null;
        if (isDev) {
            console.log('Running in development mode');
            httpServer = http.createServer(expressServer);
        }
        else {
            // get certs
            const rootPath = process.cwd();
            const credentials = {
                key: fs.readFileSync(`${ rootPath }/.cert/privkey.pem`, 'utf8'),
                cert: fs.readFileSync(`${ rootPath }/.cert/cert.pem`, 'utf8'),
                ca: fs.readFileSync(`${ rootPath }/.cert/chain.pem`, 'utf8'),
            };

            httpServer = https.createServer(credentials, expressServer);
        }

        expressServer.set('trust proxy', 1);

        // limit request / s
        if (!isDev) {
            const rateLimitConfig = this.configuration.get<any>('core.express.rateLimit');
            if (rateLimitConfig) {
                console.log('Using rate limit', rateLimitConfig);

                const limiter = new rateLimit(rateLimitConfig);
                expressServer.use(limiter);
            }
        }

        // playground
        if (isDev) {
            const expressPlayground = require('graphql-playground-middleware-express').default;
            expressServer.get('/graphql', expressPlayground({ endpoint: '/graphql' }));
        }

        return new Promise(async(resolve, reject) => {
            try {
                const resolvers : any = this.moduleLoader.load<AbstractResolver>([ 'Resolver' ]);

                const schema : GraphQLSchema = await buildSchema({
                    resolvers: resolvers,
                    dateScalarMode: 'isoDate',
                    emitSchemaFile: 'etc/schema.gql',
                });

                expressServer.post(
                    '/graphql',
                    bodyParser.json(),
                    graphqlHTTP(<any> ((request, response) => ({
                        schema,
                        context: {
                            request,
                            response,
                            entityManager: this.orm.em.fork()
                        } as Context,
                    }))),
                );

                expressServer.use((
                    error : Error,
                    req : express.Request,
                    res : express.Response,
                    next : express.NextFunction
                ) : void => {
                    console.error('Something went wrong', error);
                    res.status(400).send(error);
                });

                const port = process.env.API_PORT;
                httpServer.listen(port, () => {
                    console.log(`GraphQL ready on port ${port}...`);
                    resolve(expressServer);
                });
            }
            catch (error) {
                console.error('Could not start server', error);
                reject();
            }
        });
    }

}
