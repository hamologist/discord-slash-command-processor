import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DiscordSlashCommandProcessor } from '../discord-slash-command-processor';

export class DevStack extends Stack {
  public readonly discordSlashCommandProcessor: DiscordSlashCommandProcessor

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.discordSlashCommandProcessor = new DiscordSlashCommandProcessor(
        this,
        'DiscordSlashCommandProcessor',
        {
          apiDeployOptions: {
            stageName: 'dev',
          },
          scope: 'dev',
        },
    )
  }
}
