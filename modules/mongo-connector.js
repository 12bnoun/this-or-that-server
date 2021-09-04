import mongoose from 'mongoose';
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const NFT = mongoose.model('noun', {
  hash: Number,
  uri: String,
});

const Ranking = mongoose.model('ranking', {
  hash: Number,
  over: Number,
  weight: Number,
});

const Score = mongoose.model('score', {
  hash: Number,
  score: Number,
  vote: Number,
});

const AlreadyVoted = mongoose.model('sybil', {
  address: String,
  limit: Number,
});

export { NFT, Ranking, Score, AlreadyVoted };
