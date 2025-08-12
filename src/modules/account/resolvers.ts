/*
 * IMPORTS
 */
import { AccountGetAll } from "./queries/getAll";
import { AccountGetById } from "./queries/getById";
import { AccountCreate } from "./mutations/create";
import { AccountLogin } from "./mutations/login/index";
import { AccountTokenGenerate } from "./mutations/token";

/*
 * EXPORTS
 */
export const accountResolvers = {
  Query: {
    AccountGetAll,
    AccountGetById,
  },
  Mutation: {
    AccountCreate,
    AccountLogin,
    AccountTokenGenerate,
  },
};
