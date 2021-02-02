import glob from 'glob';


const servicesConfiguration = {};
const servicesConfigurationPath = __dirname + '/services/';
glob.sync('*.ts', { cwd: servicesConfigurationPath })
    .forEach((filename) => {
        const serviceName = filename.replace(/\.ts$/, '');
        servicesConfiguration[serviceName] = require(servicesConfigurationPath + filename).default;
    });


export default {
    core: {
        express: {
            rateLimit: {
                windowMs: 60 * 1000,
                max: 100,
            }
        }
    },
    services: servicesConfiguration,
};
