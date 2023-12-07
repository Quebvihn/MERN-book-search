const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    // Resolver for getting a single user by id or username
    me: async (_, { id, username }) => {
      const foundUser = await User.findOne({
        $or: [{ _id: id }, { username: username }],
      });

      if (!foundUser) {
        throw new Error('User not found');
      }

      return foundUser;
    },
  },

  Mutation: {
    // Resolver for creating a user
    addUser: async (_, { input }) => {
      const user = await User.create(input);

      if (!user) {
        throw new Error('Failed to create user');
      }

      const token = signToken(user);
      return { token, user };
    },

    // Resolver for user login
    login: async (_, { input }) => {
      const user = await User.findOne({
        $or: [{ username: input.username }, { email: input.email }],
      });

      if (!user) {
        throw new Error("Can't find this user");
      }

      const correctPw = await user.isCorrectPassword(input.password);

      if (!correctPw) {
        throw new Error('Wrong password');
      }

      const token = signToken(user);
      return { token, user };
    },

    // Resolver for saving a book to a user's savedBooks field
    saveBook: async (_, { input }, { user }) => {
      try {
        const updatedUser = await User.findOneAndUpdate(
          { _id: user._id },
          { $addToSet: { savedBooks: input } },
          { new: true, runValidators: true }
        );

        return updatedUser;
      } catch (err) {
        console.error(err);
        throw new Error('Failed to save book');
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
