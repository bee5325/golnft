import "dotenv/config";
import mongoose from "mongoose";

// collections
interface CollectionType {
  account: string;
  collections: [string];
}
const collectionSchema = new mongoose.Schema<CollectionType>({
  account: String,
  collections: [String],
});
const Collection = mongoose.model<CollectionType>(
  "Collection",
  collectionSchema
);

// minted
type UrlString = string;
type Traits =
  | { trait_types: "Step count"; value: number }
  | { trait_types: "Loop"; value: "Yes" | "No" };

interface TokenMeta {
  name: string;
  date: number;
  rows: number;
  description: string;
  initState: string;
  image: UrlString;
  externalUrl: UrlString;
  attributes: Array<Traits>;
  baseTokenUri?: UrlString;
  tokenId?: number;
}
const mintedSchema = new mongoose.Schema<TokenMeta>({
  name: { type: String, required: true },
  date: { type: Number, required: true },
  rows: { type: Number, index: true, required: true },
  description: { type: String, required: true },
  initState: { type: String, index: true },
  image: { type: String, required: true },
  externalUrl: { type: String, required: true },
  attributes: { type: [{}], required: true },
  baseTokenUri: { type: String, required: true },
  tokenId: { type: Number, required: true },
});
const Minted = mongoose.model<TokenMeta>("Minted", mintedSchema);

// setup
let dbUrl =
  process.env.NODE_ENV === "development"
    ? process.env.DB_URL_TEST
    : process.env.DB_URL;

if (!dbUrl) {
  throw new Error("DB_URL not set in environment variables");
}
mongoose.connect(dbUrl);

export { Collection, Minted, TokenMeta };
