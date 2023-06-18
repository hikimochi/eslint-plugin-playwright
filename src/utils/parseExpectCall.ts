import { Rule } from 'eslint';
import { isExpectCall, getMatchers, getStringValue } from './ast';
import * as ESTree from 'estree';

const MODIFIER_NAMES = new Set(['not', 'resolves', 'rejects']);

function getExpectArguments(node: Rule.Node): ESTree.Node[] {
  const grandparent = node.parent.parent;
  return grandparent.type === 'CallExpression' ? grandparent.arguments : [];
}

export interface ParsedExpectCall {
  members: ESTree.Node[];
  matcher: ESTree.Node;
  matcherName: string;
  modifiers: ESTree.Node[];
  args: ESTree.Node[];
}

export function parseExpectCall(
  node: ESTree.CallExpression & Rule.NodeParentExtension
): ParsedExpectCall | undefined {
  if (!isExpectCall(node)) {
    return;
  }

  const members = getMatchers(node);
  const modifiers: ESTree.Node[] = [];
  let matcher: Rule.Node | undefined;

  // Separate the matchers (e.g. toBe) from modifiers (e.g. not)
  members.forEach((item) => {
    if (MODIFIER_NAMES.has(getStringValue(item))) {
      modifiers.push(item);
    } else {
      matcher = item;
    }
  });

  // Rules only run against full expect calls with matchers
  if (!matcher) {
    return;
  }

  return {
    members,
    matcher,
    matcherName: getStringValue(matcher),
    modifiers,
    args: getExpectArguments(matcher),
  };
}