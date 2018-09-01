import { AuthToken } from "../Authentication";
import {
    BaseCall,
    DateSpecification,
    Fetch,
    Filter,
    Query,
    SearchType
} from "../Common";
import { Categories, Category, Group } from "../Data";
import { CategorizeQueryConverter } from "./CategorizeQueryConverter";
import { CategorizeSettings } from "./CategorizeSettings";

/**
 * The Categorize service queries the search-engine for which categories that any
 * search-matches for the same query will contain.
 *
 * It is normally used indirectly via the SearchClient class.
 */
export class Categorize extends BaseCall<Categories> {
    /**
     * This represents the last categories that was received from the backend.
     *
     * Note: Normally these are only used internally. You *can* however
     * populate these yourself, but if you are also executing fetches (which
     * the SearchClient is often doing in the automatic mode) then the contents
     * may be overwritten at any time.
     */
    public categories: Categories;

    public clientCategoryExpansion: { [key: string]: boolean } = {};

    public clientCategoryFilter: { [key: string]: string | RegExp } = {};

    private queryConverter: CategorizeQueryConverter;

    /**
     * Creates a Categorize instance that handles fetching categories dependent on settings and query.
     * Supports registering a callback in order to receive categories when they have been received.
     * @param baseUrl - The base url that the categorize is to fetch categories from.
     * @param settings - The settings that define how the Categorize instance is to operate.
     * @param auth - An object that handles the authentication.
     */
    constructor(
        baseUrl: string,
        protected settings?: CategorizeSettings,
        auth?: AuthToken,
        fetchMethod?: Fetch
    ) {
        super();
        settings = new CategorizeSettings(settings);
        auth = auth || new AuthToken();
        super.init(baseUrl, settings, auth, fetchMethod);
        this.queryConverter = new CategorizeQueryConverter();
    }

    /**
     * Fetches the search-result categories from the server.
     * @param query - The query-object that controls which results that are to be returned.
     * @param suppressCallbacks - Set to true if you have defined callbacks, but somehow don't want them to be called.
     * @returns a promise that when resolved returns a Categories object.
     */
    public fetch(
        query: Query = new Query(),
        suppressCallbacks: boolean = false
    ): Promise<Categories> {
        let url = this.queryConverter.getUrl(
            this.baseUrl,
            this.settings.url,
            query
        );
        let reqInit = this.requestObject();

        if (this.cbRequest(suppressCallbacks, url, reqInit)) {
            return this.fetchMethod(url, reqInit)
                .then((response: Response) => {
                    if (!response.ok) {
                        throw Error(
                            `${response.status} ${
                                response.statusText
                            } for request url '${url}'`
                        );
                    }
                    return response.json();
                })
                .then((categories: Categories) => {
                    this.categories = categories;
                    this.filterCategories(categories);
                    this.cbSuccess(suppressCallbacks, categories, url, reqInit);
                    return categories;
                })
                .catch(error => {
                    this.cbError(suppressCallbacks, error, url, reqInit);
                    return Promise.reject(error);
                });
        } else {
            // TODO: When a fetch is stopped due to cbRequest returning false, should we:
            // 1) Reject the promise (will then be returned as an error).
            // or
            // 2) Resolve the promise (will then be returned as a success).
            // or
            // 3) should we do something else (old code returned undefined...)
            return Promise.resolve(null);
        }
    }
    public clientCategoryExpansionChanged(
        oldValue: { [key: string]: boolean },
        value: { [key: string]: boolean }
    ): void {
        this.clientCategoryExpansion = value;
        if (
            this.shouldUpdate() &&
            this.settings.triggers.clientCategoryExpansionChanged
        ) {
            this.cbSuccess(
                false,
                this.filterCategories(this.categories),
                null,
                null
            );
        }
    }

    public clientCategoryFiltersChanged(
        oldValue: { [key: string]: string | RegExp },
        value: { [key: string]: string | RegExp }
    ): void {
        this.clientCategoryFilter = value;
        if (
            this.shouldUpdate() &&
            this.settings.triggers.clientCategoryFilterChanged
        ) {
            this.cbSuccess(
                false,
                this.filterCategories(this.categories),
                null,
                null
            );
        }
    }

    public clientIdChanged(oldValue: string, query: Query) {
        if (this.shouldUpdate() && this.settings.triggers.clientIdChanged) {
            this.update(query);
        }
    }

    public dateFromChanged(oldValue: DateSpecification, query: Query) {
        if (this.shouldUpdate() && this.settings.triggers.dateFromChanged) {
            this.update(query);
        }
    }

    public dateToChanged(oldValue: DateSpecification, query: Query) {
        if (this.shouldUpdate() && this.settings.triggers.dateToChanged) {
            this.update(query);
        }
    }

    public filtersChanged(oldValue: Filter[], query: Query) {
        if (this.shouldUpdate() && this.settings.triggers.filterChanged) {
            this.update(query);
        }
    }

    public queryTextChanged(oldValue: string, query: Query) {
        if (this.shouldUpdate() && this.settings.triggers.queryChange) {
            if (
                query.queryText.length >
                this.settings.triggers.queryChangeMinLength
            ) {
                if (
                    this.settings.triggers.queryChangeInstantRegex &&
                    this.settings.triggers.queryChangeInstantRegex.test(
                        query.queryText
                    )
                ) {
                    this.update(query);
                    return;
                } else {
                    if (this.settings.triggers.queryChangeDelay > -1) {
                        this.update(
                            query,
                            this.settings.triggers.queryChangeDelay
                        );
                        return;
                    }
                }
            }
        }
        clearTimeout(this.delay);
    }

    public searchTypeChanged(oldValue: SearchType, query: Query) {
        if (this.shouldUpdate() && this.settings.triggers.searchTypeChanged) {
            this.update(query);
        }
    }

    public uiLanguageCodeChanged(oldValue: string, query: Query) {
        if (
            this.shouldUpdate() &&
            this.settings.triggers.uiLanguageCodeChanged
        ) {
            this.update(query);
        }
    }

    /**
     * Creates a Filter object based on the input id (string [] or Category).
     *
     * NB! This method does NOT apply the filter in the filters collection.
     * It is used behind the scenes by the filter* methods in SearchClient.
     * To apply a filter you need to use the filter* properties/methods in
     * SearchClient.
     *
     * If the category doesn't exist then the filter
     * will not be created.
     *
     * If passing in a string[] then the value is expected to match the categoryName
     * property of a listed category.
     *
     * @param categoryName A string array or a Category that denotes the category to create a filter for.
     */
    public createCategoryFilter(categoryName: string[] | Category): Filter {
        let catName = Array.isArray(categoryName)
            ? categoryName
            : categoryName.categoryName;
        let result: string[] = [];
        let path = catName.slice(0);
        let groupId = path.splice(0, 1)[0].toLowerCase();

        if (
            !this.categories ||
            !this.categories.groups ||
            this.categories.groups.length === 0
        ) {
            return null;
        }

        let group = this.categories.groups.find(
            g => g.name.toLowerCase() === groupId
        );

        if (!group) {
            return null;
        }

        result.push(group.displayName);

        if (group.categories.length > 0) {
            let {
                displayName,
                ref
            } = this.getCategoryPathDisplayNameFromCategories(
                path,
                group.categories
            );
            if (displayName && displayName.length > 0) {
                result = result.concat(displayName);
                return new Filter(result, ref);
            }
        }

        return null;
    }

    private getCategoryPathDisplayNameFromCategories(
        categoryName: string[],
        categories: Category[]
    ): { displayName: string[]; ref: Category } {
        let result: string[] = [];
        let path = categoryName.slice(0);
        let catId = path.splice(0, 1)[0].toLowerCase();

        let category = categories.find(c => c.name.toLowerCase() === catId);

        if (!category) {
            return null;
        }

        result.push(category.displayName);

        let res: { displayName: string[]; ref: Category };

        if (category.children.length > 0 && path.length > 0) {
            res = this.getCategoryPathDisplayNameFromCategories(
                path,
                category.children
            );
            if (res.displayName && res.displayName.length > 0) {
                result = result.concat(res.displayName);
            }
        }

        return { displayName: result, ref: res ? res.ref : category };
    }

    private filterCategories(categories: Categories): Categories {
        if (
            (!this.clientCategoryFilter ||
                Object.getOwnPropertyNames(this.clientCategoryFilter).length ===
                    0) &&
            (!this.clientCategoryExpansion ||
                Object.getOwnPropertyNames(this.clientCategoryExpansion)
                    .length === 0)
        ) {
            return categories;
        }

        let cats = { ...categories };
        let groups = cats.groups.map((inGroup: Group) => {
            let group = { ...inGroup };
            if (group.categories && group.categories.length > 0) {
                group.categories = this.mapCategories(group.categories);
            }
            if (this.clientCategoryExpansion.hasOwnProperty(group.name)) {
                group.expanded = this.clientCategoryExpansion[group.name];
            } else {
                group.expanded =
                    group.expanded ||
                    group.categories.some(c => c.expanded === true);
            }
            return group;
        });
        cats.groups = groups.filter(g => g !== undefined);
        return cats;
    }

    private mapCategories(categories: Category[]): Category[] {
        let cats = [...categories];
        cats = cats.map((inCategory: Category) => {
            let category = { ...inCategory };
            let result = this.inClientCategoryFilters({ ...category });
            if (result !== false) {
                if (result) {
                    if (category.children && category.children.length > 0) {
                        category.children = this.mapCategories(
                            category.children
                        );
                    }
                    category.expanded = true;
                }
                let catKey = category.categoryName.join("|");
                if (this.clientCategoryExpansion.hasOwnProperty(catKey)) {
                    category.expanded = this.clientCategoryExpansion[catKey];
                } else {
                    category.expanded =
                        category.expanded ||
                        category.children.some(c => c.expanded === true);
                }
                return category;
            }
        });

        cats = cats.filter(c => c !== undefined);
        return cats;
    }

    private inClientCategoryFilters(category: Category): boolean {
        if (!this.clientCategoryFilter) {
            return null;
        }
        for (let prop in this.clientCategoryFilter) {
            if (this.clientCategoryFilter.hasOwnProperty(prop)) {
                let filterKey = prop.toLowerCase();
                let cat = category.categoryName.slice(0, -1);
                let categoryKey = cat
                    .join(this.settings.clientCategoryFiltersSepChar)
                    .toLowerCase();
                if (filterKey === categoryKey) {
                    let displayExpression = this.clientCategoryFilter[prop];
                    if (!displayExpression) {
                        continue;
                    }
                    let regex = new RegExp(displayExpression as string, "i");
                    let result = regex.test(category.displayName);
                    return result;
                } else {
                    continue;
                }
            }
        }
        return null;
    }
}
