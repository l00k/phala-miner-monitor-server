import { InitiationException } from '@100k/intiv/Exception';
import path from 'path';
import glob from 'glob';


type Callback = (data : any, previousResult : any) => any;

type Listners = {
    [eventName : string] : Callback[]
};


class ModuleLoader
{

    public load<T>(types : string[]): T[]
    {
        const modules = [];
        const baseDir = global['__basedir'];

        for (const type of types) {
            glob.sync(`modules/*/${type}/**/*.ts`, { cwd: baseDir })
                .forEach((path) => {
                    modules.push(require(path).default);
                });
        }

        return modules;
    }

}


export default ModuleLoader;
