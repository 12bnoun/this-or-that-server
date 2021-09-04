import express from 'express';
import { graphqlHTTP} from 'express-graphql';
import { buildSchema } from 'graphql';
import cors from 'cors';
import cron from 'node-cron';
import { AlreadyVoted } from './modules/mongo-connector.js';
import Resolve from './modules/resolvers.js';

const schema = buildSchema(`
  type Query {
    hello(s: String): String
    getNext(prevId: Int, otherId: Int): NFT
    getPair: Pair
    getRank: [Score]
    canVote: Boolean
    getNextPair(prevId: Int, otherId: Int): Pair
  },
  type Score {
    hash: Int
    uri: String
    score: Float
  },
  type NFT {
    hash: Int
    uri: String
  },
  type Pair {
    left: NFT
    right: NFT
  },
  type Mutation {
    addVote(id: Int, over: Int, address: String): Boolean
  }
`);

const root = {
    getNext: ({ prevId, otherId }) => {
      return Resolve.getNext(prevId, otherId);
    },
    canVote: ({ address }) => {
      return Resolve.canVote(address);
    },
    getPair: async () => {
      return Resolve.getPair();
    },
    hello: ({ s }) => {
      return 'Hello world! - 12BNoun.eth';
    },
    addVote: ({ id, over, address }) => {
      return Resolve.addVote(id, over, address);
    },
    getRank: () => {
      return Resolve.getRanking();
    },
    getNextPair: async ({ prevId, otherId }) => {
      return Resolve.getNextPair(prevId, otherId);
    },
}

cron.schedule('0 0 0 * * *', async () => {
  console.log('----cron---- running');
  try {
    await AlreadyVoted.deleteMany();
  } catch (error) {
    console.log('already voted delete fail');
  }
});

const app = express();
app.use(cors());

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
}));

app.listen(process.env.PORT || 4004)
console.log('Running a GraphQL API server at 4000');
