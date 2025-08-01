import { gql } from 'apollo-server';
import { accountTypeDefs } from '../modules/account/typeDefs';

const baseTypeDefs = gql`
  type Query
  type Mutation
`;

export const typeDefs = [
  baseTypeDefs,
  accountTypeDefs,
];
