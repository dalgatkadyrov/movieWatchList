import mongoose from "mongoose";

const listSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: ''
    },
    imagePublicId: {
        type: String,
        default: ''
    },
    id: {
        type: Number,
        // required: true 
    },
    pageStatus: {
        type: String,
        required: true,
        enum: ['completed', 'watching', 'wishlist', 'dropped']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
})

const List = mongoose.model('List', listSchema)

export default List
