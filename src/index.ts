import { Client } from '@elastic/elasticsearch';
import { Delete, Index, Search, Update } from '@elastic/elasticsearch/api/requestParams';
import { NamedQuery, QueryContainer, SearchRequest } from '@elastic/elasticsearch/api/types';
import faker from 'faker';
import logger from './logger';

const host = 'http://localhost:9200';
const log = 'trace';

const indexName = `user`;

const client = new Client({
	node: host,
});

type User = {
	id: number;
	name: string;
	age: number;
	address: string;
	description: string;
};

async function addUser(user: User) {
	const data: Index = {
		index: indexName,
		id: String(user.id),
		body: {
			...user,
		},
	};
	return await client.index(data);
}

async function updateUser(id: number, user: Partial<Omit<User, 'id'>>) {
	const data: Update = {
		index: indexName,
		id: String(id),
		body: {
			...user,
		},
	};
	return await client.update(data);
}

async function deleteUser(id: number) {
	const data: Delete = {
		index: indexName,
		id: String(id),
	};
	return await client.delete(data);
}

async function searchUser(page: number, limit: number, text: string) {
	const data: SearchRequest = {
		index: indexName,
		track_total_hits: true,
		from: page ?? 0,
		size: limit ?? 100,
		body: {
			query: {
				match: {
					description: {
						query: text,
						operator: 'and',
						fuzziness: 'auto',
					},
				},
			},
		},
	};
	return await client.search(data as any);
}

type Page = { limit?: number; offset?: number };

type SearchTitleCondition = { title: string };

type SearchUserByTitleRequirements = SearchTitleCondition & Page;

function _createBasicSearchRequest({ limit, offset }: Page) {
	const data: SearchRequest = {
		index: indexName,
		track_total_hits: true,
		from: offset ?? 0,
		size: limit ?? 100,
		body: {
			query: {},
		},
	};
	return data;
}

async function searchUserByTitle({ title, limit, offset }: SearchUserByTitleRequirements) {
	const data = _createBasicSearchRequest({ limit, offset });

	const query: NamedQuery = {
		name: {
			value: title,
		},
	};
	data.body.query['prefix'] = query;

	return await client.search(data as any);
}

type SearchDescriptionCondition = { descriptions: string[] };

type SearchUserByDescriptionRequirements = SearchDescriptionCondition & Page;

async function searchUserByDecriptions({ offset, limit, descriptions }: SearchUserByDescriptionRequirements) {
	const data = _createBasicSearchRequest({ limit, offset });
	const query: QueryContainer = {
		terms: {
			description: descriptions,
		},
	};
	data.body.query = query;
	return await client.search(data as any);
}

async function check() {
	const exists = await client.indices.exists({ index: indexName });
	console.log(exists);
}

async function init(count: number) {
	const users = Array(count)
		.fill('')
		.map(
			(_, i): User => ({
				id: i,
				name: faker.name.firstName(),
				address: faker.address.city(),
				age: faker.datatype.number({ min: 10, max: 50 }),
				description:
					faker.lorem.sentences() +
					' ' +
					Array(100)
						.fill('')
						.map(() => faker.random.words())
						.join(' '),
			})
		);
	const promises = users.map(async (user) => await addUser(user));
	const result = await Promise.all(promises);
	return result;
}

async function searchExample() {
	const result = await searchUser(10, 50, 'Pizza');
	console.log(result.body.hits.hits.length);
	console.log(result.body.hits.hits.filter((item: any) => item._source.description.includes('Pizza')).length);
}

async function searchExampleTitle() {
	const result = await searchUserByTitle({ limit: 200, offset: 0, title: 'dan' });
	logger.log('search title result');
	console.log(result.body.hits.hits);
}

async function searchExampleDescription() {
	const result = await searchUserByDecriptions({ limit: 10, offset: 0, descriptions: ['Music', 'eum'] });
	const hits = result.body.hits.hits;
	// console.log(hits)
	const filterd = hits
		.map((hit:any) => hit._source)
		.filter((item: User) => !item.description.toLowerCase().includes('music'))
		.filter((item: User) => !item.description.toLowerCase().includes('eum'));
	console.log(filterd);
}

async function bootstrap() {
	logger.log('start');
	// await init(1000);
	// await searchExampleTitle();
	await searchExampleDescription();
	logger.log('end');
}

bootstrap();
