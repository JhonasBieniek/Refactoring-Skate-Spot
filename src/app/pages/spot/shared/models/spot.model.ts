export interface Spot {
    uid?: string;
    user_uid: string;
    user: string;
    name: string;
    address: Address;
    types: Array<string>;
    conditions: string;
    pictures?: Array<imgFiles>;
    thumbnail?: imgFiles;
    lat: number;
    lng: number;
    hash: string;
    last_modifier_user_uid?: string;
    created?: Date;
    modified: Date;
    status: string;
}

export interface Address {
    city: string;
    state: string;
    country: string;
    point_of_interest?: string;
    postal_code?: string;
    route: string;
    street_number?: string;
}

export interface imgFiles {
    downloadURL: string;
    path: string;
}

