import axios from 'axios';
import { Processor } from '../types/processor';

export const emojifyProcessor: Processor = async (input) => {
    const emojifyEndpoint = process.env.EMOJIFY_ENDPOINT;
    if (emojifyEndpoint === undefined) {
        console.log('Missing Environment Variable: EMOJIFY_ENDPOINT');
        throw new Error('Server not properly configured');
    }

    const emojifyResponse = await axios.post(emojifyEndpoint, {
        message: input
    });

    return { content: emojifyResponse.data.message };
}
