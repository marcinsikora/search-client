import { IMatches } from '../../../Data/IMatches';
import { IMetaData } from '../../../Data/IMetaData';
import { Index, Categories, Metadata } from '../Typings/Typings';

export class SearchResultMapper {
     public static map(indexId: number, data: Index): IMatches {
        let matches = {
            id: 1,
            bestBets: new Array<any>(),
            didYouMeanList: new Array<any>(),
            estimatedMatchCount: data.index.items.hits,
            expandedQuery: "",
            nextPageRef: 1,
            searchMatches: new Array<any>(),
            statusCode: 0,
            errorMessage: "",
        };

        data.index.items.results.forEach((item) => {
        {                                        
            matches.searchMatches.push({
                id: 0,
                abstract: item.content,
                categories: this.mapCategories(item.categories),
                matchedPermissions: new Array<string>(),
                content: [ item.content ],
                date: item.date,
                extracts: [ item.extracts ],
                instanceId: indexId,
                internalId: -1,
                isTrueMatch: true,
                itemId: item.id,
                metaList: this.mapMetadata(item.metadata),
                parentInternalId: -1,
                parentLevel: 1,
                relevance: item.relevance,
                sourceName: "Hapi",
                title: item.title,
                url: item.url
                });
            }});

        return matches;
     }

    private static mapCategories(categories: Categories[]): string[] {
        let result = new Array<string>();   
        if (categories) {
            categories.forEach((c) => {
                c.values.forEach((v) => {
                    result.push(v);
                });
            });
        }

        return result;
     }

     private static mapMetadata(metadata: Metadata[]): IMetaData[] {
        let result = new Array<IMetaData>();   
        if (metadata) {
            metadata.forEach((m) => {
                result.push({
                    key: m.name,
                    value: m.value
                });
            });
        }

        return result;
     }
}