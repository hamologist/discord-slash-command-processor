import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from "aws-cdk-lib/aws-route53-targets";
import { DiscordSlashCommandProcessor } from '../discord-slash-command-processor';

export class ProdStack extends Stack {
    public readonly discordSlashCommandProcessor: DiscordSlashCommandProcessor

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);
        this.discordSlashCommandProcessor = new DiscordSlashCommandProcessor(this,
            'DiscordSlashCommandProcessor',
            {
                scope: 'prod',
            }
        );
        const rootDomain = ssm.StringParameter.valueFromLookup(
            this,
            '/discord-slash-command-processor/prod/root-domain',
        );
        const certificate = certificatemanager.Certificate.fromCertificateArn(
            this,
            'Certificate',
            ssm.StringParameter.valueForStringParameter(
                this,
                '/discord-slash-command-processor/prod/certificate-arn',
            ),
        );
        const zone = route53.HostedZone.fromLookup(this, 'BaseZone', {
            domainName: rootDomain,
        })
        this.discordSlashCommandProcessor.restApi.addDomainName('DomainName', {
            domainName: `discord.${rootDomain}`,
            certificate,
        });
        new route53.ARecord(this, 'ApiDNS', {
            zone,
            recordName: 'discord',
            target: route53.RecordTarget.fromAlias(
                new route53Targets.ApiGateway(this.discordSlashCommandProcessor.restApi),
            ),
        });
    }
}
