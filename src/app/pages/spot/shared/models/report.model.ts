export interface Report {
    spot_uid: string;
    user_uid: string;
    user: string;
    status: string;
    spot_country: string;
    reason: string;
    created?: Date;
    modified: Date;
    spot_name: string;
    moderation_uid: string | null;
}