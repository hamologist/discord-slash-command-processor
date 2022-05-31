import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DiscordSlashCommandProcessor } from '../discord-slash-command-processor';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export class DevStack extends Stack {
    public readonly discordSlashCommandProcessor: DiscordSlashCommandProcessor

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const diceRollDiscordHandlerArn = ssm.StringParameter.valueForStringParameter(this, '/dice-roll/dev/discord-handler-arn');
        const emojifyDiscordHandlerArn = ssm.StringParameter.valueForStringParameter(this, '/emojify/dev/discord-handler-arn');
        this.discordSlashCommandProcessor = new DiscordSlashCommandProcessor(
            this,
            'DiscordSlashCommandProcessor',
            {
                apiDeployOptions: {
                    stageName: 'dev',
                },
                scope: 'dev',
                diceRollDiscordHandlerArn,
                emojifyDiscordHandlerArn,
            },
        );
  }
}
