import { Route as RouteInfo, RouteOptions } from 'core/Router';


export default function Route(path : string, options ? : RouteOptions)
{
    return (Target : any, method : string) => {
        if (!Target.constructor.prototype.__routes) {
            Target.constructor.prototype.__routes = [];
        }

        let route = new RouteInfo({
            path: path,
            action: method,
            options: options,
        });

        Target.constructor.prototype.__routes.push(route);
    };
}
