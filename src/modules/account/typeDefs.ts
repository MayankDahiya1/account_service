/*
 * IMPORTS
 */
import { gql } from 'apollo-server';
import fs from 'fs';
import path from 'path';

/*
 * CONST
 */
const accountSDL = fs.readFileSync(
  path.join(__dirname, './typeDefs.graphql'),
  'utf8'
);

/*
 * EXPORTS
 */
export const accountTypeDefs = gql`${accountSDL}`;
