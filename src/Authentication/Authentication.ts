import { Query } from "../Common";
import {
    IAuthenticationSettings
} from "./AuthenticationSettings";

export interface Authentication {

    settings: IAuthenticationSettings;   

    fetch(
        query: Query,
        suppressCallbacks: boolean
    ): Promise<string>;

    update(query: Query, delay?: number): void;    
}