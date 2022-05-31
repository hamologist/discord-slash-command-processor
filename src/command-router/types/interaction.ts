interface Data {
    id: string;
    name: string;
    options: Array<{
        name: string;
        value: string;
    }>;
}

export interface UnverifiedInteraction {
    data: Data | undefined;
    type: number;
    token: string;
    applicationId?: string;
}

export interface VerifiedInteraction extends Omit<UnverifiedInteraction, 'data'> {
    data: Data
    applicationId: string;
}

export const isVerifiedInteraction = (obj: UnverifiedInteraction): obj is VerifiedInteraction => {
    if (obj.data === undefined || obj.applicationId === undefined) {
        return false;
    }

    return true;
}
