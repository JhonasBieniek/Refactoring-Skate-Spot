export interface Review {
    user_uid: string;
    user_name: string;
    review: string;
    created?: Date;
    modified?: Date;
}