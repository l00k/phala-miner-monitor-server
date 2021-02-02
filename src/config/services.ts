import { ObjectManager } from '@100k/intiv/ObjectManager';
import OrmFactory from 'core/ORM/Factory';


export default {
    'orm': () => ObjectManager.getInstance(OrmFactory).create(),
};
