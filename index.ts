export * from './src/mongodbGenerator';
import * as generator from './src/mongodbGenerator';

const query = generator.getQueryFromUrl('?$search=test', { regexSearchFields: [ 'test', 'test1' ] });

console.log(query)