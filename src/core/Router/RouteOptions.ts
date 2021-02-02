import { Initializable } from '@100k/intiv/Initializable';


type Arguments = {
    [index : string] : any
};


class RouteOptions
{

    public method : string = 'GET';

    public arguments : Arguments = {};

}

export default class extends Initializable(RouteOptions) {};
