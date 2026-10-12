import { createLogger } from '@procureguard/shared/log';
import seed from '../../seed/shop.json';
import { createStore, type Shop } from '../src/store';

export const shopSeed = seed as Shop;
export const quietLog = createLogger('test', 'error');
export const freshStore = () => createStore(shopSeed);
