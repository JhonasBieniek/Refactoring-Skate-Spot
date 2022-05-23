export interface Skater {
    user_uid: string;
    name: string;
    nickname?: string;
    city?: string;
    country?: string;
    bio?: string;
    sponsorships?: Array<string>;
    brands?: Array<string>;
    deck?: string;
    truck?: string;
    wheel?: string;
    bearings?: string;
    pros?: Array<string>;
    favorites?: Array<string>;
    email?: string;
    terms?: Array<any>;
    created?: Date;
    modified?: Date;
}

// export interface Adress {
//     long_name: string;
//     short_name: string;
//     types: Array<string>
// }