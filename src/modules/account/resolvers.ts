/*
 * IMPORTS
 */
import { AccountGetAll } from "./queries/getAll";
import { AccountGetById } from "./queries/getById";
import { AccountCreate } from "./mutations/create";
import { AccountLogin } from "./mutations/login/index";
import { AccountTokenGenerate } from "./mutations/token";
import { AccountDelete } from "./mutations/delete";

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
    AccountDelete,
  },
};
