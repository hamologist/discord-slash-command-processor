import { emojifyProcessor } from './emojify';
import { rollProcessor } from './roll';
import { Processor } from '../types/processor';

const processors: { [key: string]: Processor} = {
    emojify: emojifyProcessor,
    roll: rollProcessor,
};

export default processors;
