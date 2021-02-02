import { Initializable } from '@100k/intiv/Initializable';


class Result
{

    private _code : number = 200;

    private _payload : any = null;

    constructor(json : any = null) {}

    get code() : number
    {
        return this._code;
    }

    set code(value : number)
    {
        this._code = value;
    }

    get payload() : any
    {
        return this._payload;
    }

    set payload(value : any)
    {
        this._payload = value;
    }

}


export default class extends Initializable(Result) {};
