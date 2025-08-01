/*
 * IMPORTS
 */
import {
  defaultFieldResolver,
  GraphQLSchema,
  GraphQLFieldConfig,
} from 'graphql';
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';

interface AuthDirectiveArgs {
  accountType?: string;
}

/*
 * EXPORTS
 */
export function accountAuthDirective(
  schema: GraphQLSchema,
  directiveName = 'accountAuth'
) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (
      fieldConfig: GraphQLFieldConfig<any, any>
    ): GraphQLFieldConfig<any, any> => {
      const directive = getDirective(schema, fieldConfig, directiveName)?.[0] as AuthDirectiveArgs;
      if (!directive) return fieldConfig;

      const { resolve = defaultFieldResolver } = fieldConfig;
      const { accountType } = directive;

      fieldConfig.resolve = async (source, args, context, info) => {
        const user = context.user;

        // Authentication check
        if (!user) throw new Error('REQUIRE__LOGIN');

        // Authorization check
        if (accountType && user.role !== accountType) {
          throw new Error('ACCOUNT__AUTHORIZATION__FAILED');
        }

        return resolve(source, args, context, info);
      };

      return fieldConfig;
    },
  });
}
