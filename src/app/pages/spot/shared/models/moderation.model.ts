export interface Moderation {
    spot_uid: string;
    spot_name: string;
    moderation_uid: string | null;
    situation: string;
    user_uid: string;
    spot_country: string;
    user: any;
    created?: Date;
    modified: Date;
}
