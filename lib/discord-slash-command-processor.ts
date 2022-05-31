import { CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export interface DiscordSlashCommandProcessorProps {
    scope: string;
    apiDeployOptions?: apigateway.StageOptions;
    diceRollDiscordHandlerArn: string;
    emojifyDiscordHandlerArn: string;
}

export class DiscordSlashCommandProcessor extends Construct {
    public restApi: apigateway.RestApi;
    public restHandler: lambda.Function;

    constructor(scope: Construct, id: string, props: DiscordSlashCommandProcessorProps) {
        super(scope, id);

        this.restApi = new apigateway.RestApi(this,  'Api', {
            defaultCorsPreflightOptions: {
                allowMethods: [
                    'OPTIONS',
                    'POST'
                ],
                allowHeaders: [
                    'Content-Type',
                    'X-Amz-Date',
                    'Authorization',
                    'X-Api-Key',
                    'X-Amz-Security-Token'
                ],
                allowOrigins: ['*']
            },
            deployOptions: props.apiDeployOptions,
        });

        const diceRollDiscordHandler = lambda.Function.fromFunctionAttributes(
            this,
            'DiceRollDiscordHandler',
            {
                functionArn: props.diceRollDiscordHandlerArn,
                sameEnvironment: true,
            },
        );
        const emojifyDiscordHandler = lambda.Function.fromFunctionAttributes(
            this,
            'EmojifyDiscordHandler',
            {
                functionArn: props.emojifyDiscordHandlerArn,
                sameEnvironment: true,
            },
        );

        this.restHandler = new lambda.Function(this, 'RestHandler', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'rest-handler.handler',
            code: lambda.Code.fromAsset('src/command-router', { exclude: ['*.ts'] }),
            memorySize: 256,
            environment: {
                'DISCORD_APPLICATION_ID': ssm.StringParameter.valueFromLookup(
                    this,
                    `/discord-slash-command-processor/${props.scope}/discord-application-id`,
                ),
                'DISCORD_PUBLIC_KEY': ssm.StringParameter.valueFromLookup(
                    this,
                    `/discord-slash-command-processor/${props.scope}/discord-public-key`
                ),
                'DICE_ROLL_DISCORD_HANDLER_ARN': props.diceRollDiscordHandlerArn,
                'EMOJIFY_DISCORD_HANDLER_ARN': props.emojifyDiscordHandlerArn,
            }
        });
        diceRollDiscordHandler.grantInvoke(this.restHandler);
        emojifyDiscordHandler.grantInvoke(this.restHandler);

        const slashCommandResource = this.restApi.root.addResource('slash-command');
        slashCommandResource.addMethod(
            'POST',
            new apigateway.LambdaIntegration(this.restHandler),
        );

        new CfnOutput(this, 'RestHandler Path', { value: slashCommandResource.path });
    }
}
