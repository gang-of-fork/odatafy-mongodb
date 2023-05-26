export * from './src/mongodbGenerator';
import * as omdb from './src/mongodbGenerator';

console.log(JSON.stringify(omdb.getQueryFromUrl(`?$filter=name eq 'Ergonomic Soft Tuna'&$top=4`, { returnDataCountQuery: true }), null, 4));