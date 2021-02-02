// check: https://github.com/stems/graphql-bigint
import { GraphQLScalarType } from 'graphql';
const { INT } = require('graphql/language/kinds');

const MAX_INT = Number.MAX_SAFE_INTEGER;
const MIN_INT = Number.MIN_SAFE_INTEGER;

export default new GraphQLScalarType({
    name: 'BigInt',
    serialize: (number : BigInt) => number.toString(),
    parseValue: (rawValue : string) => BigInt(rawValue),
    parseLiteral(ast)
    {
        if (ast.kind === INT) {
            const num = parseInt((<any>ast).value, 10);
            if (num <= MAX_INT && num >= MIN_INT) {
                return num;
            }
        }
        return null;
    }
});
