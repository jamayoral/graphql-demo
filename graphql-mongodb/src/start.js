import {MongoClient, ObjectId} from 'mongodb'
import express from 'express'
import bodyParser from 'body-parser'
import {graphqlExpress, graphiqlExpress} from 'graphql-server-express'
import {makeExecutableSchema} from 'graphql-tools'
import cors from 'cors' 

const URL = 'http://localhost'
const PORT = 3001
const MONGO_URL = 'mongodb://localhost:27017/blog'

const prepare = (o) => {
  o._id = o._id.toString()
  return o
}

export const start = async () => {
  try {
    const db = await MongoClient.connect(MONGO_URL)

    const Posts = db.collection('posts')
    const Comments = db.collection('comments')

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
        postId: String
        content: String
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
          return prepare(await Posts.findOne(ObjectId(_id)))
        },
        posts: async () => {
          return (await Posts.find({}).toArray()).map(prepare)
        },
        comment: async (root, {_id}) => {
          return prepare(await Comments.findOne(ObjectId(_id)))
        },
        comments: async (root, {_id}) => {
          return (await Comments.find({}).toArray()).map(prepare)
        },
      },
      Post: {
        comments: async ({_id}) => {
          return await Comments.find({postId: _id}).toArray();
        }
      },
      Comment: {
        post: async ({postId}) => {
          return await Posts.findOne(ObjectId(postId))
        }
      },
      Mutation: {
        createPost: async (root, args, context, info) => {
          const res = await Posts.insert(args)
          return await Posts.findOne({_id: res.insertedIds[0]})
        },
        createPostInput: async (root, {input}) => {
          const res = await Posts.insert(input);
          return await Posts.findOne({_id: res.insertedIds[0]});
        },
        createComment: async (root, args) => {
          const res = await Comments.insert(args)
          return await Comments.findOne({_id: res.insertedIds[0]})
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

    app.use(homePath, graphiqlExpress({
      endpointURL: '/graphql'
    }))

    app.listen(PORT, () => {
      console.log(`Visit ${URL}:${PORT}${homePath}`)
    })

  } catch (e) {
    console.log(e)
  }

}
