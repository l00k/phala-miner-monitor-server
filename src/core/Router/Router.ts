import { EventBus } from '@100k/intiv/EventBus';
import { ObjectManager, Inject } from '@100k/intiv/ObjectManager';
import { ValidationException } from '@100k/intiv/Validator';
import { Result, Controller } from 'core/Controller';
import express from 'express';
import { isEmpty } from 'lodash-es';
import { Exception } from '../Exception';
import Route from './Route';
import RouteOptions from './RouteOptions';

// deployment mode
const env = process.env.NODE_ENV || 'production';

type RouteDscr = {
    controller : Controller,
    action : string,
    options : RouteOptions
};

type RouteCallback = (
    parameters ? : { [field : string] : any },
    body ? : any
) => boolean;


class Router
{

    protected controllers : Map<typeof Controller, Controller> = new Map();

    protected routes : { [path : string] : RouteDscr } = {};

    @Inject()
    protected eventBus : EventBus;

    public registerRoute(controller : typeof Controller, route : Route)
    {
        if (!this.controllers.has(controller)) {
            const instance = ObjectManager.getInstance(controller);
            this.controllers.set(controller, instance);
        }

        const instance = this.controllers.get(controller);

        this.routes[route.path] = {
            controller: instance,
            action: route.action,
            options: route.options,
        };
    }

    public bindExpress(express : express.Application)
    {
        for (let path in this.routes) {
            let routeDscr = this.routes[path];
            express[routeDscr.options.method](
                path,
                async(request, response) => this.handleRequest(path, request, response)
            );
        }
    }

    protected async handleRequest(
        route : string,
        request : express.Request,
        response : express.Response
    )
    {
        const routeDscr = this.routes[route];

        // collect parameters
        let parameters : {} = {};

        if (!Object.values(request.params)) {
            Object.assign(parameters, request.params);
        }
        if (!isEmpty(request?.query)) {
            Object.assign(parameters, request.query);
        }

        // handle route
        const controller : Controller = routeDscr.controller;

        try {
            const result : any = await controller[routeDscr.action](parameters, request.body);

            // prepared result
            if (result instanceof Result) {
                response.status(result.code);
                response.json(result.payload);
            }
            // inline json result
            else if (typeof result != 'undefined') {
                response.status(200);
                response.json(result);
            }
        }
        catch (exception) {
            // prepared result
            if (exception instanceof Result) {
                response.status(exception.code);
                response.json(exception.payload);
            }
            // validation exception
            else if (exception instanceof ValidationException) {
                response.status(exception.metadata.responseCode);
                response.json({
                    exception: exception.name,
                    code: exception.code,
                    details: exception.details,
                });
            }
            // generic exception
            else if (exception instanceof Exception) {
                response.status(exception.metadata.responseCode);
                response.json({
                    exception: exception.name,
                    message: exception.message,
                    code: exception.code,
                });
            }
            // default error handling
            else {
                response.contentType('text/plain');
                response.status(500);

                let msg = 'Internal error!\n';

                msg += env == 'development'
                    ? exception
                    : 'Code: ' + exception.code;

                if (env == 'development') {
                    msg += '\n\n\n' + exception.stack;
                }

                response.send(msg);

                console.error(`### Error 500\n${exception}`);
            }
        }

        response.end();
    }

}


export default Router;
