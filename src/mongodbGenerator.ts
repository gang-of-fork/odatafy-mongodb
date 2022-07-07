import url from 'url';

import { generateMatchFromFilterExpr } from './filterGenerator';
import { generateLimitFromTopExpr } from './limitGenerator';
import { generateSkipFromSkipExpr } from './skipGenerator';
import { generateSortFromOrderbyExpr } from './sortGenerator';
import { generateLookupFromExpand } from './lookupGenerator';
import { generateComputedStageFromComputedExpr } from './computedGenerator';

import { oDataParameters } from 'odatafy-parser';
import { Document } from 'mongodb';

export function getQueryFromUrl(oDataUrl: string): Document[] {
    const query = url.parse(oDataUrl, true).query;
    const validParams = ['filter', 'orderby', 'skip', 'top', 'expand', 'computed'];
    const params = Object.keys(query);

    let parseParameters: oDataParameters = {}

    validParams.forEach((param: string) => {
        //check if url 
        if (params.includes(param) && params.includes('$' + param)) {
            throw new Error(`Malformed oData url, cannot contain param: ${param} and param: $${param}`)
        }

        if (params.includes(param) || params.includes('$' + param)) {
            parseParameters[param as keyof oDataParameters] = query[(params.includes(param) ? param : '$' + param)] as string
        }
    });

    return getQuery(parseParameters);
}

export function getQuery(parameters: oDataParameters): Document[] {
    const pipeline: Document[] = [];

    if (parameters.expand) {
        pipeline.push(...generateLookupFromExpand(parameters.expand, { 'items': 'orderItems' }));
    }

    if (parameters.computed) {
        pipeline.push(generateComputedStageFromComputedExpr(parameters.computed));
    }

    if (parameters.filter) {
        pipeline.push(generateMatchFromFilterExpr(parameters.filter));
    }

    if (parameters.orderby) {
        pipeline.push(generateSortFromOrderbyExpr(parameters.orderby));
    }

    if (parameters.skip) {
        pipeline.push(generateSkipFromSkipExpr(parameters.skip));
    }

    if (parameters.top) {
        pipeline.push(generateLimitFromTopExpr(parameters.top));
    }

    return pipeline;
}

export function testMongoDB() {
    console.log(JSON.stringify(getQuery({
        computed: "Test eq null as lol"
    }), undefined, 4));
}