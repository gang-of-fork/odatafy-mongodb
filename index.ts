export * from './src/mongodbGenerator';
import { parseODataUrl } from 'odatafy-parser';

console.log(JSON.stringify(parseODataUrl("https://services.odata.org/v2/northwind/northwind.svc/Customers?$select=test,test1"), null, 4))