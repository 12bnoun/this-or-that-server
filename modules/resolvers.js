import { Ranking, NFT, Score, AlreadyVoted } from './mongo-connector.js';
import _ from 'lodash';

const Resolve = {};

Resolve.addVote = async (choosen, ignored, address) => {

  const exist = await AlreadyVoted.findOne(
    { 'address': address }
  ).lean();

  if (exist && exist.limit == 50) {
    return false;
  }

  let limit = 1;

  if (exist && exist.limit) {
    limit = exist.limit ? exist.limit + 1 : 1;
  }

  const already = await AlreadyVoted.findOneAndUpdate(
    { 'address': address },
    { $set: { limit: limit }},
    { upsert: true, new: true },
  );

  const choosenObj = await Ranking.findOne({
    'hash': choosen,
    'over': ignored,
  }).lean();

  const ignoredObj = await Ranking.findOne({
    'hash': ignored,
    'over': choosen,
  }).lean();

  let newScore = 1;
  let newWeight = 1;


  if (choosenObj && ignoredObj) {
    newScore = (choosenObj.weight + 1) - ignoredObj.weight;
    newWeight = choosenObj.weight + 1;
  } else if (choosenObj) {
    newScore = choosenObj.weight;
    newWeight = choosenObj.weight + 1;
  } else if (ignoredObj) {
    newScore = 1 - ignoredObj.weight;
  }

  const vote = await Ranking.findOneAndUpdate(
    { 'hash': choosen, 'over': ignored },
    { $set: { weight: newWeight }},
    { upsert: true, new: true },
  );

  const votes = await Score.findOne({
    'hash': choosen,
  }).lean();

  let totalVotes = 1;
  if (votes && votes.vote) {
    totalVotes = totalVotes + votes.vote;
  }

  const score = await Score.findOneAndUpdate(
    { 'hash': choosen },
    { $set: { score: newScore, vote: totalVotes }},
    { upsert: true, new: true },
  );

  return true;
}

Resolve.getNext = async (prevId, other) => {

  const count = await NFT.countDocuments({});
  const id = generateRandomPair(0, count - 1, prevId, other);

  const next = await NFT.findOne({
    'hash': id
  }).lean();

  const { hash, uri } = next;

  return {
    hash,
    uri,
  };
};

Resolve.getNextPair = async (prevId, other) => {

  const count = await NFT.countDocuments({});

  const leftId = generateRandomPair(0, count - 1, prevId, other);
  const left = await NFT.findOne({ 'hash': leftId }).lean();

  const rightId = generateRandomTriad(0, count - 1, prevId, other, leftId);

  console.log(leftId, rightId);
  const right =  await NFT.findOne({ 'hash': rightId }).lean();

  return {
    left,
    right,
  };
}

Resolve.getPair = async () => {

  const count = await NFT.countDocuments({});

  const leftId = generateRandom(0, count - 1, -1);
  const left = await NFT.findOne({ 'hash': leftId }).lean();

  const rightId = generateRandom(0, count - 1, leftId);
  const right = await NFT.findOne({ 'hash': rightId }).lean();

  return {
    left,
    right,
  };
}

Resolve.getRanking = async () => {

  let scores = await Score.find({}).sort({ vote: 'descending' }).lean();

  const newScores = await Promise.all(scores.map(async (score) => {
    const nft = await NFT.findOne({ 'hash': score.hash }).lean();

    const v = score.vote * 1.14;
    return { hash: score.hash, score: v, uri: nft.uri };
  }));

  return newScores;
};

Resolve.canVote = async (address) => {

  let exist = await AlreadyVoted.findOne({
    address: address,
  }).lean();

  if (exist.length > 0) {
    return true;
  }

  return false;
};

const generateRandom = (min, max, id) => {
  const num = Math.floor(Math.random() * (max - min + 1)) + min;
  return (num == id) ? generateRandom(min, max, id) : num;
};

const generateRandomPair = (min, max, id, other) => {
  const num = Math.floor(Math.random() * (max - min + 1)) + min;
  return (num == id || num == other) ? generateRandomPair(min, max, id, other) : num;
};

const generateRandomTriad = (min, max, id, other, tri) => {
  const num = Math.floor(Math.random() * (max - min + 1)) + min;
  return (num == id || num == other || num == tri) ? generateRandomTriad(min, max, id, other, tri) : num;
}

export default Resolve;
