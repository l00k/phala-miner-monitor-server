import { Initializable } from '@100k/intiv/Initializable';
import RouteOptions from './RouteOptions';


class Route
{

    public path : string = null;

    public action : string = null;

    public options : RouteOptions = new RouteOptions();

}


export default class extends Initializable(Route) {};
