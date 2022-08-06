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

    test('test getQueryFromUrl with malformed url', () => {
        const url = '?filter=test eq 1&$filter=test eq 2';
        try {
            getQueryFromUrl(url)
        } catch(e) {
            expect((<Error>e).message).to.equal('Malformed oData url, cannot contain param: filter and param: $filter');
        }
    });

    test('test that pipeline is not empty', async ()=>{
        const url = '';
        const query = getQueryFromUrl(url);

        expect(query.length).not.to.equal(0);

        const queryResult = await mdbClient.db(dbname).collection('categories').aggregate(query).toArray();

        queryResult.forEach(qR => {
            expect(qR).to.not.have.property('odatafyMongoDBTempField');
        });
    });

    after(async () => {
        await Promise.all((await mdbClient.db(dbname).collections()).map(async (collection) => {
            await collection.deleteMany({});
        }));

        mdbClient.close();
    });
});