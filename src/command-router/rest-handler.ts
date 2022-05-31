import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { sign } from 'tweetnacl';
import { isVerifiedInteraction, UnverifiedInteraction } from './types/interaction';
import router from './router';

const buildErrorResponse = (message: string) => ({
    type: 4,
        data: {
        content: message,
            flags: 1<<6,
    }
});

export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    if (event.body === null) {
        throw Error('Event missing body');
    }

    const body: UnverifiedInteraction = JSON.parse(event.body);

    for (const [key, value] of Object.entries(event.headers)) {
        event.headers[key.toLowerCase()] = value;
    }

    const signature = event.headers['x-signature-ed25519'];
    const timestamp = event.headers['x-signature-timestamp']
    const discordPublicKey = process.env.DISCORD_PUBLIC_KEY;

    if (!signature || !timestamp) {
        throw new Error('Missing expected headers');
    }

    if (!discordPublicKey) {
        console.log('Missing Environment Variable: DISCORD_PUBLIC_KEY');
        throw new Error('Server not properly configured');
    }

    const isVerified = sign.detached.verify(
        Buffer.from(timestamp + event.body),
        Buffer.from(signature, 'hex'),
        Buffer.from(discordPublicKey, 'hex')
    )

    if (!isVerified) {
        return {
            statusCode: 401,
            body: 'bad signature',
        };
    }

    if (body.type === 1) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                type: 1
            }),
        }
    }

    const discordApplicationId = process.env.DISCORD_APPLICATION_ID;
    if (!discordApplicationId) {
        console.log('Missing Environment Variable: DISCORD_APPLICATION_ID');
        throw new Error('Server not properly configured');
    }
    body.applicationId = discordApplicationId;

    if (!isVerifiedInteraction(body)) {
        return {
            statusCode: 200,
            body: JSON.stringify(buildErrorResponse('Something went wrong.')),
        }
    }

    const invoke = router[body.data.name];
    if (invoke === undefined) {
        return {
            statusCode: 200,
            body: JSON.stringify(buildErrorResponse('Unsupported command name provided')),
        }
    }
    await invoke(body);

    return {
        statusCode: 200,
        body: JSON.stringify({
            type: 5,
        }),
    };
};
