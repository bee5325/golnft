import "dotenv/config";
import mongoose from 'mongoose';

// collections
interface Col {
  account: string;
  collections: [string];
}
const collectionSchema = new mongoose.Schema<Col>({
  account: String,
  collections: [String],
});
const Collection = mongoose.model<Col>("Collection", collectionSchema);

// taken
interface Tak {
  rows: number;
  initStates: [string];
}
const takenSchema = new mongoose.Schema<Tak>({
  rows: Number,
  initStates: [String],
});
const Taken = mongoose.model<Tak>("Taken", takenSchema);

// setup
if (!process.env.DB_URL) {
  throw new Error("DB_URL not set in environment variables");
}
mongoose.connect(process.env.DB_URL);

export { Col, Collection, Tak, Taken };
