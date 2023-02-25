import { describe, test, before, after } from 'mocha';
import { expect } from 'chai';

import * as mongoDB from 'mongodb';
import * as dotenv from 'dotenv';

import { getQueryFromUrl } from '../src/mongodbGenerator';

import * as testdata from './testdata.json';

describe('Function integration tests', () => {
    dotenv.config();
    const dbUri = process.env.DB_URL as string;
    const dbname = 'test';
    let mdbClient: mongoDB.MongoClient;

    before(async () => {
        //create test db

        mdbClient = new mongoDB.MongoClient(dbUri);
        await mdbClient.connect();

        //@ts-expect-error load json to db
        await Promise.all(testdata.default.map(async (testcollection: { tableName: string, data: any[] }) => {
            return await mdbClient.db(dbname).collection(testcollection.tableName).insertMany(testcollection.data.map(doc => {
                if (testcollection.tableName == "orders") {
                    return {
                        ...doc,
                        ...{ _id: doc.id },
                        ...{ orderDate: new Date(doc.orderDate) }
                    }
                }

                return {
                    ...doc,
                    ...{ _id: doc.id }
                }
            }))
        }));
    });

    test('search with normal search', ()=>{
        const query = getQueryFromUrl("?$search=test");

        expect(JSON.stringify(query)).to.be.equal(JSON.stringify([ { '$search': 'test' } ]));
    });

    test('search with regex', async ()=>{
        const query = getQueryFromUrl("?$search=test", { regexSearchFields: [ "test" ] });

        const queryResult = await mdbClient.db(dbname).collection("orders").aggregate(query).toArray();

        console.log(queryResult);
    });


    after(async () => {
        await Promise.all((await mdbClient.db(dbname).collections()).map(async (collection) => {
            await collection.deleteMany({});
        }));

        mdbClient.close();
    });
})