"use strict";

import 'jest';

// tslint:disable-next-line:no-var-requires
require("babel-core/register");
require("babel-polyfill");

import { SearchClient, Query, Matches, Categories, Autocomplete } from "./SearchClient";

describe("SearchClient basics", () => {

    it("Should have imported SearchClient class defined", () => {
        expect(typeof SearchClient).toBe("function");
    });

    it("Should be able to create SearchClient instance", () => {
        let searchClient = new SearchClient("http://localhost:9950/RestService/v3/");
        expect(typeof searchClient).toBe("object");
    });

    it("Should throw for invalid Urls", () => {
        expect(() => {
            let searchClient = new SearchClient("file://localhost:9950/RestService/v3/");
        }).toThrow();
        expect(() => {
            let searchClient = new SearchClient("http:+//localhost:9950/RestService/v3/");
        }).toThrow();
    });

    it("Search instance should have autocomplete(), find(), categorize(), allCategories() and bestBets() interface", () => {
        let searchClient = new SearchClient("http://localhost:9950/RestService/v3/");
        expect(typeof searchClient.autocomplete).toBe("function");
        expect(typeof searchClient.find).toBe("function");
        expect(typeof searchClient.categorize).toBe("function");
        expect(typeof searchClient.allCategories).toBe("function");
        expect(typeof searchClient.bestBets).toBe("function");
    });
});

describe("SearchClient live tests (require empty search-service to be instantiated)", () => {

    it("Should get an Autocomplete lookup for word with 0 suggestions on empty localhost:9950, if available", () =>{
        let searchClient = new SearchClient("http://localhost:9950/RestService/v3/");
        return searchClient.autocomplete("test")
        .then((suggestions: string[]) => {
            expect(suggestions.length).toEqual(0);
        });
    });

    it("Should get an Autocomplete lookup for Autocomplete options with 0 suggestions on empty localhost:9950, if available", () =>{
        let searchClient = new SearchClient("http://localhost:9950/RestService/v3/");
        return searchClient.autocomplete({ queryText:"test" } as Autocomplete)
        .then((suggestions: string[]) => {
            expect(suggestions.length).toEqual(0);
        });
    });

    it("Should get a Find result for queryText with 0 matches on empty localhost:9950, if available", () =>{
        let searchClient = new SearchClient("http://localhost:9950/RestService/v3/");
        return searchClient.find("test")
        .then((matches: Matches) => {
            expect(matches.searchMatches.length).toEqual(0);
        });
    });

    it("Should get a Find result for Query options with 0 matches on empty localhost:9950, if available", () =>{
        let searchClient = new SearchClient("http://localhost:9950/RestService/v3/");
        return searchClient.find({ queryText:"test" } as Query)
        .then((matches: Matches) => {
            expect(matches.searchMatches.length).toEqual(0);
        });
    });

    it("Should get a Categorize result for queryText with 0 categories on empty localhost:9950, if available", () =>{
        let searchClient = new SearchClient("http://localhost:9950/RestService/v3/");
        return searchClient.categorize("test")
        .then((categories: Categories) => {
            expect(categories.matchCount).toEqual(0);
        });
    });

    it("Should get a Categorize result for Query with 0 categories on empty localhost:9950, if available", () =>{
        let searchClient = new SearchClient("http://localhost:9950/RestService/v3/");
        return searchClient.categorize({ queryText: "test"} as Query)
        .then((categories: Categories) => {
            expect(categories.matchCount).toEqual(0);
        });
    });

    it("Should get a AllCategories result with 0 categories on empty localhost:9950, if available", () =>{
        let searchClient = new SearchClient("http://localhost:9950/RestService/v3/");
        return searchClient.allCategories()
        .then((categories: Categories) => {
            expect(categories.matchCount).toEqual(0);
        });
    });

    it("Should get a BestBets result with 0 best-bets on empty localhost:9950, if available", () =>{
        let searchClient = new SearchClient("http://localhost:9950/RestService/v3/");
        return searchClient.bestBets()
        .then((bestBets: string[]) => {
            expect(bestBets.length).toEqual(0);
        });
    });
});
