import {
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from '@codemirror/autocomplete';
import {
  completionPath,
  scopeCompletionSource,
} from '@codemirror/lang-javascript';
import {syntaxTree} from '@codemirror/language';

const pageCompletions: readonly Completion[] = [
  {
    label: 'title',
    type: 'property',
    detail: 'string',
    info: 'The title of the current page.',
  },
  {
    label: 'url',
    type: 'property',
    detail: 'string',
    info: 'The URL of the current page.',
  },
  {
    label: 'content',
    type: 'property',
    detail: 'string | undefined',
    info: 'The HTML content of the current page, when available.',
  },
  {
    label: 'selectingText',
    type: 'property',
    detail: 'string | undefined',
    info: 'The text selected on the current page, when available.',
  },
  {
    label: 'modifier',
    type: 'property',
    detail: 'Modifier',
    info: 'The keyboard modifiers held when the function was invoked.',
  },
];

const modifierCompletions: readonly Completion[] = [
  {
    label: 'alt',
    type: 'property',
    detail: 'boolean',
    info: 'Whether the Alt key was held.',
  },
  {
    label: 'ctrl',
    type: 'property',
    detail: 'boolean',
    info: 'Whether the Ctrl key was held.',
  },
  {
    label: 'meta',
    type: 'property',
    detail: 'boolean',
    info: 'Whether the Meta key was held.',
  },
  {
    label: 'shift',
    type: 'property',
    detail: 'boolean',
    info: 'Whether the Shift key was held.',
  },
];

const rootCompletions: readonly Completion[] = [
  {
    label: 'render',
    type: 'function',
    detail: 'render(template, view)',
    info: 'Render a Mustache template with the given view.',
  },
];

const javascriptScope = Object.assign(Object.create(null), {
  Array,
  Boolean,
  Date,
  Error,
  JSON,
  Map,
  Math,
  Number,
  Object,
  Promise,
  RegExp,
  Set,
  String,
  console,
  decodeURIComponent,
  encodeURIComponent,
  isNaN,
  parseFloat,
  parseInt,
});

export const javascriptCompletionSource =
  scopeCompletionSource(javascriptScope);

const stringProperties = new Set(['title', 'url', 'content', 'selectingText']);
const javascriptIdentifier = /^[\w$]+$/;

type SyntaxNode = ReturnType<ReturnType<typeof syntaxTree>['resolveInner']>;

type PatternBinding = {
  name: string;
  property: string;
};

function findAncestor(node: SyntaxNode, name: string): SyntaxNode | null {
  for (
    let current: SyntaxNode | null = node;
    current;
    current = current.parent
  ) {
    if (current.name === name) return current;
  }
  return null;
}

function findDescendant(node: SyntaxNode, name: string): SyntaxNode | null {
  if (node.name === name) return node;

  for (let child = node.firstChild; child; child = child.nextSibling) {
    const result = findDescendant(child, name);
    if (result) return result;
  }

  return null;
}

function findParameterList(node: SyntaxNode): SyntaxNode | null {
  return findAncestor(node, 'ArrowFunction')?.getChild('ParamList') ?? null;
}

function findFunctionParameter(node: SyntaxNode): SyntaxNode | null {
  const parameterList = findParameterList(node);
  return parameterList
    ? findDescendant(parameterList, 'VariableDefinition')
    : null;
}

function isFunctionParameterPattern(node: SyntaxNode): boolean {
  for (let current = node.parent; current; current = current.parent) {
    if (current.name === 'ParamList') {
      return current.parent?.name === 'ArrowFunction';
    }
  }
  return false;
}

function isInDefaultValue(node: SyntaxNode, position: number): boolean {
  const property = findAncestor(node, 'PatternProperty');
  const equals = property?.getChild('Equals');
  return equals !== null && equals !== undefined && position >= equals.to;
}

function findParameterObjectPattern(node: SyntaxNode): SyntaxNode | null {
  for (
    let current: SyntaxNode | null = node;
    current;
    current = current.parent
  ) {
    if (
      current.name === 'ObjectPattern' &&
      isFunctionParameterPattern(current)
    ) {
      return current;
    }
  }
  return null;
}

function findArrowParameterObjectPattern(node: SyntaxNode): SyntaxNode | null {
  const parameterList = findParameterList(node);
  return parameterList ? findDescendant(parameterList, 'ObjectPattern') : null;
}

function findPatternBindings(
  pattern: SyntaxNode,
  context: CompletionContext,
): PatternBinding[] {
  const bindings: PatternBinding[] = [];

  for (let child = pattern.firstChild; child; child = child.nextSibling) {
    if (child.name !== 'PatternProperty') continue;

    const propertyName = child.getChild('PropertyName');
    if (!propertyName) continue;

    const nestedPattern = child.getChild('ObjectPattern');
    if (nestedPattern) {
      bindings.push(...findPatternBindings(nestedPattern, context));
      continue;
    }

    const variable = child.getChild('VariableDefinition');
    bindings.push({
      name: variable
        ? context.state.sliceDoc(variable.from, variable.to)
        : context.state.sliceDoc(propertyName.from, propertyName.to),
      property: context.state.sliceDoc(propertyName.from, propertyName.to),
    });
  }

  return bindings;
}

function findDestructuredBinding(
  node: SyntaxNode,
  name: string,
  context: CompletionContext,
): PatternBinding | null {
  const pattern = findArrowParameterObjectPattern(node);
  if (!pattern) return null;

  return (
    findPatternBindings(pattern, context).find(
      binding => binding.name === name,
    ) ?? null
  );
}

function isStringProperty(property: string): boolean {
  return stringProperties.has(property);
}

const stringCompletionOptions = Object.getOwnPropertyNames(String.prototype)
  .filter(label => javascriptIdentifier.test(label))
  .map(label => {
    const value = Object.getOwnPropertyDescriptor(
      String.prototype,
      label,
    )?.value;
    return {
      label,
      type:
        typeof value === 'function'
          ? /^[A-Z]/.test(label)
            ? 'class'
            : 'method'
          : 'property',
    } satisfies Completion;
  });

function findStringLiteralMember(node: SyntaxNode): SyntaxNode | null {
  const member =
    node.name === 'MemberExpression'
      ? node
      : node.parent?.name === 'MemberExpression'
        ? node.parent
        : null;
  return member?.firstChild?.name === 'String' ? member : null;
}

function destructuredVariableCompletions(
  node: SyntaxNode,
  context: CompletionContext,
): readonly Completion[] {
  const pattern = findArrowParameterObjectPattern(node);
  if (!pattern) return [];

  return findPatternBindings(pattern, context).flatMap(binding => {
    const propertyCompletion = [
      ...pageCompletions,
      ...modifierCompletions,
    ].find(completion => completion.label === binding.property);
    return propertyCompletion
      ? [{...propertyCompletion, label: binding.name, type: 'variable'}]
      : [];
  });
}

function isModifierPattern(
  pattern: SyntaxNode,
  context: CompletionContext,
): boolean {
  const property = pattern.parent;
  if (!property || property.name !== 'PatternProperty') return false;

  return /^\s*modifier\s*:/.test(
    context.state.sliceDoc(property.from, pattern.from),
  );
}

function isArgumentName(
  node: SyntaxNode,
  name: string,
  context: CompletionContext,
): boolean {
  const parameter = findFunctionParameter(node);
  return (
    parameter !== null &&
    context.state.sliceDoc(parameter.from, parameter.to) === name
  );
}

function optionsForPath(
  path: readonly string[],
  node: SyntaxNode,
  context: CompletionContext,
): readonly Completion[] | null {
  if (path.length === 0) {
    return [
      ...rootCompletions,
      ...destructuredVariableCompletions(node, context),
    ];
  }

  const destructuredBinding =
    path.length === 1 ? findDestructuredBinding(node, path[0], context) : null;
  if (
    path.length === 1 &&
    (path[0] === 'modifier' || destructuredBinding?.property === 'modifier')
  ) {
    return modifierCompletions;
  }

  if (
    path.length === 1 &&
    destructuredBinding &&
    isStringProperty(destructuredBinding.property)
  ) {
    return stringCompletionOptions;
  }

  if (path.length === 1 && isArgumentName(node, path[0], context)) {
    return pageCompletions;
  }

  if (path.length === 2 && isArgumentName(node, path[0], context)) {
    if (path[1] === 'modifier') return modifierCompletions;
    if (isStringProperty(path[1])) return stringCompletionOptions;
  }

  return null;
}

export function cocopyCompletionSource(
  context: CompletionContext,
): CompletionResult | null {
  const node = syntaxTree(context.state).resolveInner(context.pos, -1);
  if (isInDefaultValue(node, context.pos)) return null;

  const pattern = findParameterObjectPattern(node);
  if (pattern) {
    const word = context.matchBefore(/[\w$]*/);
    if (!word && !context.explicit) return null;

    return {
      from: word?.from ?? context.pos,
      options: isModifierPattern(pattern, context)
        ? modifierCompletions
        : pageCompletions,
      validFor: /^[\w$]*$/,
    };
  }

  if (findStringLiteralMember(node)) {
    const word = context.matchBefore(/[\w$]*/);
    return {
      from: word?.from ?? context.pos,
      options: stringCompletionOptions,
      validFor: /^[\w$]*$/,
    };
  }

  const path = completionPath(context);
  if (!path) return null;

  const options = optionsForPath(path.path, node, context);
  if (!options) return null;

  return {
    from: context.pos - path.name.length,
    options,
    validFor: /^[\w$]*$/,
  };
}
