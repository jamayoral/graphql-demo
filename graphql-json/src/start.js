import express from 'express'
import bodyParser from 'body-parser'
import {graphqlExpress, graphiqlExpress} from 'graphql-server-express'
import {makeExecutableSchema} from 'graphql-tools'
import cors from 'cors'
import * as _ from 'lodash';

const URL = 'http://localhost'
const PORT = 3001

const posts = [
  {
    _id: "1",
    title: "Hello",
    content: "World",
  },
  {
    _id: "2",
    title: "Article",
    content: "Some content",
  },
]
const comments = [
  {
    _id: "1",
    postId: "1",
    content: "Very smart comment",
  },
  {
    _id: "2",
    postId: "1",
    content: "This comment is awesome",
  },
  {
    _id: "3",
    postId: "2",
    content: "Good job!!",
  },
  {
    _id: "4",
    postId: "2",
    content: "The most important comment",
  },
]

export const start = async () => {
  try {

    const typeDefs = [`
    
      type Query {
        post(_id: String): Post!
        posts: [Post]!
        postsFragment: [Post]!
        comment(_id: String): Comment!
        comments: [Comment]!
      }

      type Post {
        _id: String
        title: String!
        content: String!
        photo: String
        description: String
        comments: [Comment]
      }

      input PostInput {
        title: String!
        content: String!
        photo: String
        description: String
      }

      type Comment {
        _id: String
        postId: String!
        content: String!
        post: Post
      }

      type Mutation {
        createPost(title: String, content: String): Post!
        createPostInput(input: PostInput): Post!
        createComment(postId: String, content: String): Comment!
      }

      schema {
        query: Query
        mutation: Mutation
      }
    `];

    const resolvers = {
      Query: {
        post: async (root, {_id}) => {
          return posts.find(post => post._id === _id)
        },
        posts: async () => {
          return posts
        },
        comment: async (root, {_id}) => {
          return comments.find(comment => comment._id === _id)
        },
        comments: async () => {
          return comments
        },
      },
      Post: {
        comments: async ({_id}) => {
          return comments.filter(comment => comment.postId === _id)
        }
      },
      Comment: {
        post: async ({postId}) => {
          return posts.find(post => post._id === postId)
        }
      },
      Mutation: {
        createPost: async (root, args, context, info) => {
          const post = _.last(_.orderBy(posts, ['_id'], ['asc']));
          args._id = post._id++;
          posts.push(args);
          return _.last(posts);
        },
        createPostInput: async (root, {input}) => {
          const post = _.last(_.orderBy(posts, ['_id'], ['asc']));
          input._id = post._id + 1;
          posts.push(input);
          return _.last(posts);
        },
        createComment: async (root, args) => {
          const comment = _.last(_.orderBy(comments, ['_id'], ['asc']));
          args._id = comment._id + 1;
          comments.push(args);
          return _.last(comments);
        },
      },
    }

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers
    })

    const app = express()

    app.use(cors())

    app.use('/graphql', bodyParser.json(), graphqlExpress({schema}))

    const homePath = '/graphiql'
    
    app.use('/graphiql', graphiqlExpress({
      endpointURL: '/graphql'
    }))

    app.listen(PORT, () => {
      console.log(`Visit ${URL}:${PORT}${homePath}`)
    })

  } catch (e) {
    console.log(e)
  }

}
