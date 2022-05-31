import { InvocationType, InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { TextEncoder } from 'util';
import { VerifiedInteraction } from './types/interaction';

const client = new LambdaClient({});
const diceRollHandlerArn = process.env.DICE_ROLL_DISCORD_HANDLER_ARN;
const emojifyHandlerArn = process.env.EMOJIFY_DISCORD_HANDLER_ARN;

if (!diceRollHandlerArn) {
    console.log('Missing Environment Variable: DICE_ROLL_DISCORD_HANDLER_ARN');
    throw new Error('Server not properly configured');
}

if (!emojifyHandlerArn) {
    console.log('Missing Environment Variable: EMOJIFY_DISCORD_HANDLER_ARN');
    throw new Error('Server not properly configured');
}

const buildInvoke = (handlerArn: string) => async (body: VerifiedInteraction) => {
    await client.send(new InvokeCommand({
        FunctionName: handlerArn,
        InvocationType: InvocationType.Event,
        Payload: new TextEncoder().encode(JSON.stringify(body)),
    }));
}

const router: {
    [key: string]: ReturnType<typeof buildInvoke>
} = {
    'roll': buildInvoke(diceRollHandlerArn),
    'emojify': buildInvoke(emojifyHandlerArn),
}

export default router;
