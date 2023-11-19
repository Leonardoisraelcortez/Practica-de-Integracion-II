import mongoose from "mongoose";

const usersSchema = new mongoose.Schema({
first_name: {
    type: String,
    required: true,
},
last_name: {
    type: String,
    required: true,
},
email: {
    type: String,
    required: true,
    unique: true,
},
password: {
    type: String,
    required: true,
},
cart: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Carts",
},
from_github: {
    type: Boolean,
    default: false,
},
fromGoogle: {
    type: Boolean,
    default: false,
},
});

export const usersModel = mongoose.model("Users", usersSchema);