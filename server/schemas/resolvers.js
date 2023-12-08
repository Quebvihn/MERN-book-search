const { User } = require("../models");
const { signToken, AuthenticationError } = require("../utils/auth");

const resolvers = {
  Query: {
    // Resolver for getting a single user by id or username
    me: async (_, args, context) => {
      if (context.user) {
        const foundUser = await User.findOne({ _id: context.user._id }).select(
          "-__v -password"
        );

        return foundUser;
      }
      throw AuthenticationError;
    },
  },
  Mutation: {
    // Resolver for creating a user
    addUser: async (_, { username, email, password }) => {
      const user = await User.create({ username, email, password });

      if (!user) {
        throw new Error("Failed to create user");
      }

      const token = signToken(user);
      return { token, user };
    },

    // Resolver for user login
    login: async (_, { email, password }) => {
      const user = await User.findOne({email});

      if (!user) {
        throw new Error("Can't find this user");
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new Error("Wrong password");
      }

      const token = signToken(user);
      return { token, user };
    },

    // Resolver for saving a book to a user's savedBooks field
    saveBook: async (_, { newBook }, { user }) => {
      try {
        const updatedUser = await User.findOneAndUpdate(
          { _id: user._id },
          { $addToSet: { savedBooks: newBook } },
          { new: true, runValidators: true }
        );

        return updatedUser;
      } catch (err) {
        console.error(err);
        throw new Error("Failed to save book");
      }
    },

    // Resolver for deleting a book from savedBooks
    removeBook: async (_, { bookId }, { user }) => {
      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id },
        { $pull: { savedBooks: { bookId: bookId } } },
        { new: true }
      );

      if (!updatedUser) {
        throw new Error("Couldn't find user with this id");
      }

      return updatedUser;
    },
  },
};

module.exports = resolvers;
