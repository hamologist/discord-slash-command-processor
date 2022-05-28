import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export interface DiscordSlashCommandProcessorProps {
    scope: string;
    apiDeployOptions?: apigateway.StageOptions;
}

export class DiscordSlashCommandProcessor extends Construct {
    public restApi: apigateway.RestApi;
    public routerHandler: lambda.Function;
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

        this.routerHandler = new lambda.Function(this, 'RouterHandler', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'router.handler',
            code: lambda.Code.fromAsset('src/command-router', { exclude: ['*.ts'] }),
            memorySize: 256,
            environment: {
                'DISCORD_APPLICATION_ID': ssm.StringParameter.valueFromLookup(
                    this,
                    `/discord-slash-command-processor/${props.scope}/discord-application-id`,
                ),
                'EMOJIFY_ENDPOINT': ssm.StringParameter.valueFromLookup(
                    this,
                    `/discord-slash-command-processor/${props.scope}/emojify-endpoint`,
                ),
                'ROLL_ENDPOINT': ssm.StringParameter.valueFromLookup(
                    this,
                    `/discord-slash-command-processor/${props.scope}/roll-endpoint`,
                )
            }
        });

        this.restHandler = new lambda.Function(this, 'RestHandler', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'rest-handler.handler',
            code: lambda.Code.fromAsset('src/command-router', { exclude: ['*.ts'] }),
            memorySize: 256,
            environment: {
                'DISCORD_PUBLIC_KEY': ssm.StringParameter.valueFromLookup(
                    this,
                    `/discord-slash-command-processor/${props.scope}/discord-public-key`
                ),
                'COMMAND_ROUTER_FUNCTION_NAME': this.routerHandler.functionName
            }
        });
        this.routerHandler.grantInvoke(this.restHandler);

        const slashCommandResource = this.restApi.root.addResource('slash-command');
        slashCommandResource.addMethod(
            'POST',
            new apigateway.LambdaIntegration(this.restHandler),
        );

        new CfnOutput(this, 'RestHandler Path', { value: slashCommandResource.path });
    }
}
