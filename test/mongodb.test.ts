import { describe, before, after, test } from 'mocha';

import * as testdata from './testdata.json'
import * as mongoDB from 'mongodb';
import * as dotenv from 'dotenv';

import * as testcases from './testcases.json';
import { getQueryFromUrl } from '../src/mongodbGenerator';
import { expect } from 'chai';

type InventoryItem = {
    id: number,
    name: string,
    category: number,
    price: number
}

type ExpectedResult = InventoryItem;

describe('MongoDB Query integration tests', () => {
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
                if(testcollection.tableName == "orders") {
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

    //@ts-expect-error load testcase json
    testcases.default.forEach((testcase: { name: string, url: string, tableName: string, expected: ExpectedResult[], checkOrder?: boolean }) => {
        test(testcase.name, async () => {
            const query = getQueryFromUrl(testcase.url);

            const queryResult = await mdbClient.db(dbname).collection(testcase.tableName).aggregate(query).toArray();

            const compResult = queryResult.every((res) => {
                return testcase.expected.some((expItem)=>{
                    try {
                        expect(res).to.deep.include(expItem);
                        return true;
                    } catch(e) {
                        return false;
                    }
                });
                
                

                /*
                return testcase.expected.filter((expItem) => {
                    return Object.keys(expItem).every(key => {
                        
                        return res[key] == expItem[key as keyof ExpectedResult]
                    });
                }).length == 1;
                */
            });

            const lengthResult = queryResult.length == testcase.expected.length;

            if(testcase.checkOrder) {
                for(let i=0; i<testcase.expected.length; i++) {
                    Object.keys(testcase.expected).forEach(key => {
                        expect(testcase.expected[i][key as keyof InventoryItem]).to.deep.equal(queryResult[i][key])
                    });
                }
            }

            if (!compResult || !lengthResult) {
                console.warn(`expected: ${JSON.stringify(testcase.expected, undefined, 4)}`);
                console.warn(`found: ${JSON.stringify(queryResult, undefined, 4)}`);
                console.warn(`query: ${JSON.stringify(query, undefined, 4)}`)
            }

            expect(compResult).to.equal(true);
            expect(lengthResult).to.equal(true);
        });
    });

    test('Test lookup', async () => {
        const query = getQueryFromUrl("?$computed=tolower('Test') as test");

        console.log(JSON.stringify(query, undefined, 4));

        const queryResult = await mdbClient.db(dbname).collection('orders').aggregate(query).toArray();

        console.log(queryResult);
    });

    after(async () => {
        await Promise.all((await mdbClient.db(dbname).collections()).map(async (collection) => {
            await collection.deleteMany({});
        }));

        mdbClient.close();
    });
});