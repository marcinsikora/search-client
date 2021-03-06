import { BaseQueryConverter, Query } from "../Common";

/**
 * Class to handle creating autocomplete lookups.
 */
export class AutocompleteQueryConverter extends BaseQueryConverter {
    /**
     * Converts the query params to an array of key=value segments.
     */
    protected getUrlParams(query: Query): string[] {
        let params: string[] = [];

        // TODO: Add clientId also for autocomplete?
        this.addParamIfSet(params, "l", 1); // Forces this to always do server-side when called. The client will skip calling when not needed instead.
        this.addParamIfSet(params, "q", query.queryText);
        this.addParamIfSet(params, "s", query.maxSuggestions);

        return params;
    }
}
