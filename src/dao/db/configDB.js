import dotenv from 'dotenv';
dotenv.config();

import mongoose from "mongoose";
import config from '../../config.js';


const URI = config.mongodbUri;

const dbConnection = mongoose.connect(URI, {
useNewUrlParser: true,
useUnifiedTopology: true,
useCreateIndex: true,
})
.then((db) => {
console.log("DB connected");
return db;
})
.catch((err) => {
console.error("Error connecting to DB:", err);
throw err;
});

export default dbConnection;

