import axios from 'axios';
import { VerifiedInteraction } from './types/interaction';
import processors from './processor';

export interface ResponseData {
    content: string,
    flags?: number,
}

export const handler = async (
    body: VerifiedInteraction
): Promise<void> => {
    let responseData: ResponseData

    const discordApplicationId = process.env.DISCORD_APPLICATION_ID;
    if (!discordApplicationId) {
        console.log('Missing Environment Variable: DISCORD_APPLICATION_ID');
        throw new Error('Server not properly configured');
    }

    const processor = processors[body.data.name];
    if (processor !== undefined) {
        responseData = await processor(body.data.options[0].value);
    } else {
        responseData = { content: 'Unknown slash command', flags: 1<<6 }
    }

    if (!responseData.flags) {
        await axios.patch(
            `https://discord.com/api/v8/webhooks/${discordApplicationId}/${body.token}/messages/@original`,
            { content: responseData.content }
        );
    } else {
        await axios.delete(
            `https://discord.com/api/v8/webhooks/${discordApplicationId}/${body.token}/messages/@original`
        );
        await axios.post(
            `https://discord.com/api/v8/webhooks/${discordApplicationId}/${body.token}`,
            responseData
        )
    }
}
