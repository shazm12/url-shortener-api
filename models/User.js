import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, required: true },
  email: { type: String, required: true, unique: true },
  name: { type: String }
});

const User = mongoose.model("User", UserSchema);

export default User;