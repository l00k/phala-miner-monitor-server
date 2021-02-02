import { Configuration } from '@100k/intiv/Configuration';
import { EventBus } from '@100k/intiv/EventBus';
import { Inject } from '@100k/intiv/ObjectManager';
import ModuleLoader from 'core/Loader/ModuleLoader';
import ServiceLoader from 'core/Loader/ServiceLoader';


export default abstract class AbstractApp
{

    @Inject()
    public configuration : Configuration;

    @Inject()
    public eventBus : EventBus;

    @Inject()
    public serviceLoader : ServiceLoader;

    @Inject()
    public moduleLoader : ModuleLoader;

    public async run()
    {
        // load configuration
        const configData = require('config/configuration').default;
        this.configuration.load(configData);

        // load services
        await this.serviceLoader.load();

        // load entries
        this.moduleLoader.load(['Domain/Repository', 'Domain/Model', 'Observer', 'Controller']);

        // run
        await this.main()
    }

    protected abstract main();

}
