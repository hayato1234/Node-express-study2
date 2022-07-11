const mongoose = require("mongoose");
// const passportLocalMongoose = require("passport-local-mongoose");
const Schema = mongoose.Schema;

const favoriteSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  campsites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campsite",
    },
  ],
});

// favoriteSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("Favorite", favoriteSchema);
