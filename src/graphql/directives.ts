import { GraphQLSchema } from "graphql";
import { rateLimitDirective } from "graphql-rate-limit-directive";
import { accountAuthDirective } from "../modules/account/directives/authDirective";

// Get the rate limit directive configuration
const { rateLimitDirectiveTypeDefs, rateLimitDirectiveTransformer } =
  rateLimitDirective();

export function getDirectiveTypeDefs() {
  return [
    rateLimitDirectiveTypeDefs,
    `directive @accountAuth(accountType: String) on FIELD_DEFINITION`,
  ];
}

export function applyDirectives(schema: GraphQLSchema) {
  // Apply rate limiting first
  schema = rateLimitDirectiveTransformer(schema);

  // Then apply authentication
  schema = accountAuthDirective(schema, "accountAuth");

  return schema;
}
