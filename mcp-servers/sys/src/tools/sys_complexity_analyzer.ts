export const sysComplexityAnalyzer = {
  name: 'sys_complexity_analyzer',
  description: 'Analyzes a raw code string using cross-language heuristics to estimate cyclomatic complexity. Highlights decision points to guide comprehensive test generation.',
  inputSchema: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'The raw source code snippet to analyze.' }
    },
    required: ['code']
  },
  async handler(params: Record<string, unknown>) {
    if (!params.code || typeof params.code !== 'string') {
      return { error: 'Code snippet is required', isError: true };
    }

    const code = params.code;
    
    // Cross-language regex patterns for branching/complexity
    const patterns = [
      { name: 'if/else if', regex: /\b(if|else if|elif)\b\s*\(/g },
      { name: 'switch/case', regex: /\b(case)\b/g },
      { name: 'loops', regex: /\b(for|while|foreach)\b\s*\(/g },
      { name: 'catch', regex: /\b(catch|except)\b/g },
      { name: 'logical AND', regex: /&&|(\b)and(\b)/g },
      { name: 'logical OR', regex: /\|\||(\b)or(\b)/g },
      { name: 'ternary', regex: /\?/g },
      { name: 'optional chaining', regex: /\?\./g },
      { name: 'nullish coalescing', regex: /\?\?/g }
    ];

    let totalComplexity = 1; // Base path
    const analysis: Record<string, number> = {};

    for (const { name, regex } of patterns) {
      const matches = code.match(regex);
      if (matches) {
        totalComplexity += matches.length;
        analysis[name] = matches.length;
      }
    }

    return {
      result: {
        estimatedComplexity: totalComplexity,
        minimumTestCasesRequired: totalComplexity,
        branchBreakdown: analysis,
        advice: `To achieve full branch coverage, you must debate and write at least ${totalComplexity} test cases.`
      }
    };
  }
};
