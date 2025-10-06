/**
 * API Testing Script
 * Tests OpenRouter and Groq APIs for speed, quality, and reliability
 */

import 'dotenv/config';

// Set API keys for testing from environment variables
if (!process.env['OPENROUTER_API_KEY']) {
  throw new Error('OPENROUTER_API_KEY environment variable is required');
}
if (!process.env['GROQ_API_KEY']) {
  throw new Error('GROQ_API_KEY environment variable is required');
}

import { callOpenRouter, OPENROUTER_MODELS } from '../lib/api/openrouter';

// Test configuration
const TEST_PROMPT = {
  businessName: 'TechFlow',
  description: 'A modern software development platform for agile teams',
  industry: 'tech' as const,
  symbols: {
    primary: 'flowing data stream',
    secondary: 'geometric nodes',
    mood: 'innovative and dynamic',
  },
  colors: {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    accent: '#10B981',
  },
};

interface TestResult {
  provider: string;
  model: string;
  stage: string;
  success: boolean;
  duration: number;
  error?: string;
  outputLength?: number;
  quality?: string;
}

const results: TestResult[] = [];

/**
 * Test OpenRouter models
 */
async function testOpenRouter() {
  console.log('\n🧪 Testing OpenRouter API...\n');

  // Test Stage 1: Template Generation
  console.log('Stage 1: Template Generation (Claude Sonnet 3.7)...');
  const templateStart = Date.now();
  try {
    const templatePrompt = `Create a detailed logo specification for "${TEST_PROMPT.businessName}" - ${TEST_PROMPT.description}

Industry: ${TEST_PROMPT.industry}
Primary Symbol: ${TEST_PROMPT.symbols.primary}
Secondary Element: ${TEST_PROMPT.symbols.secondary}
Mood: ${TEST_PROMPT.symbols.mood}

Expand this into three layers:

SCENE-LEVEL:
List 3-5 essential visual objects that should appear in the logo.

OBJECT-LEVEL:
For each object, describe its semantic components.

LAYOUT-LEVEL:
Specify exact positioning, relative sizes, color palette (hex codes), and spatial relationships.

Output format:
SCENE: [list objects]
OBJECTS: [component breakdown]
LAYOUT: [detailed specifications]`;

    const response = await callOpenRouter(
      OPENROUTER_MODELS.CLAUDE_SONNET,
      [
        {
          role: 'system',
          content:
            'You are an expert brand designer specializing in minimalist logo design.',
        },
        { role: 'user', content: templatePrompt },
      ],
      { temperature: 0.8, maxTokens: 2000 }
    );

    const duration = Date.now() - templateStart;
    results.push({
      provider: 'OpenRouter',
      model: 'claude-3.7-sonnet',
      stage: 'Template Generation',
      success: true,
      duration,
      outputLength: response.length,
      quality: response.includes('SCENE') && response.includes('OBJECTS') ? 'Good' : 'Poor',
    });

    console.log(`✅ Success (${duration}ms, ${response.length} chars)`);
    console.log(`Quality: ${response.includes('SCENE') ? '✓' : '✗'} SCENE, ${response.includes('OBJECTS') ? '✓' : '✗'} OBJECTS, ${response.includes('LAYOUT') ? '✓' : '✗'} LAYOUT`);
  } catch (error) {
    const duration = Date.now() - templateStart;
    results.push({
      provider: 'OpenRouter',
      model: 'claude-3.7-sonnet',
      stage: 'Template Generation',
      success: false,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log(`❌ Failed: ${error instanceof Error ? error.message : error}`);
  }

  // Test Stage 2: SVG Code Generation
  console.log('\nStage 2: SVG Code Generation (Qwen Coder 2.5)...');
  const svgStart = Date.now();
  try {
    const svgPrompt = `Generate SVG logo code for TechFlow based on this specification:

SCENE: flowing data stream icon, geometric connector nodes, dynamic arrow element
OBJECTS: Stream (curved path with gradient), Nodes (3 circles connected), Arrow (forward-pointing triangle)
LAYOUT: Centered composition, stream flows left-to-right, nodes at intersection points, primary color ${TEST_PROMPT.colors.primary}

Create a professional, minimalist logo using ONLY basic SVG primitives.
Return ONLY the SVG code.`;

    const response = await callOpenRouter(
      OPENROUTER_MODELS.QWEN_CODER,
      [
        {
          role: 'system',
          content:
            'You are an expert SVG code generator. Generate clean, semantic SVG code with only basic primitives.',
        },
        { role: 'user', content: svgPrompt },
      ],
      { temperature: 0.3, maxTokens: 4000 }
    );

    const duration = Date.now() - svgStart;
    const hasSVG = response.includes('<svg') && response.includes('</svg>');
    const svgMatch = response.match(/<svg[\s\S]*<\/svg>/i);

    results.push({
      provider: 'OpenRouter',
      model: 'qwen-2.5-coder-32b',
      stage: 'SVG Generation',
      success: hasSVG,
      duration,
      outputLength: response.length,
      quality: hasSVG && svgMatch ? 'Good' : 'Poor',
    });

    console.log(`${hasSVG ? '✅' : '❌'} ${hasSVG ? 'Success' : 'Failed'} (${duration}ms, ${response.length} chars)`);
    if (hasSVG && svgMatch) {
      console.log(`SVG Length: ${svgMatch[0].length} chars`);
    }
  } catch (error) {
    const duration = Date.now() - svgStart;
    results.push({
      provider: 'OpenRouter',
      model: 'qwen-2.5-coder-32b',
      stage: 'SVG Generation',
      success: false,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log(`❌ Failed: ${error instanceof Error ? error.message : error}`);
  }

  // Test Stage 3: Review
  console.log('\nStage 3: Quality Review (DeepSeek Chat)...');
  const reviewStart = Date.now();
  try {
    const reviewPrompt = `Review this SVG logo for "TechFlow":

<svg viewBox="0 0 512 512"><circle cx="256" cy="256" r="100" fill="#3B82F6"/></svg>

Rate on a scale of 1-10 and provide feedback.

Output format:
SCORE: [score]/10
FEEDBACK: [2-3 sentences]`;

    const response = await callOpenRouter(
      OPENROUTER_MODELS.DEEPSEEK_CHAT,
      [
        { role: 'system', content: 'You are a professional brand design critic.' },
        { role: 'user', content: reviewPrompt },
      ],
      { temperature: 0.5, maxTokens: 500 }
    );

    const duration = Date.now() - reviewStart;
    const hasScore = response.includes('SCORE');
    const hasFeedback = response.includes('FEEDBACK');

    results.push({
      provider: 'OpenRouter',
      model: 'deepseek-chat',
      stage: 'Quality Review',
      success: hasScore && hasFeedback,
      duration,
      outputLength: response.length,
      quality: hasScore && hasFeedback ? 'Good' : 'Poor',
    });

    console.log(
      `${hasScore && hasFeedback ? '✅' : '❌'} ${hasScore && hasFeedback ? 'Success' : 'Failed'} (${duration}ms)`
    );
    console.log(`Structure: ${hasScore ? '✓' : '✗'} SCORE, ${hasFeedback ? '✓' : '✗'} FEEDBACK`);
  } catch (error) {
    const duration = Date.now() - reviewStart;
    results.push({
      provider: 'OpenRouter',
      model: 'deepseek-chat',
      stage: 'Quality Review',
      success: false,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log(`❌ Failed: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Print test results summary
 */
function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(80) + '\n');

  const totalTests = results.length;
  const successCount = results.filter((r) => r.success).length;
  const failureCount = totalTests - successCount;
  const avgDuration =
    results.reduce((sum, r) => sum + r.duration, 0) / totalTests;

  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`⏱️  Avg Duration: ${avgDuration.toFixed(0)}ms`);
  console.log(`📊 Success Rate: ${((successCount / totalTests) * 100).toFixed(1)}%`);

  console.log('\nDetailed Results:');
  console.log('-'.repeat(80));
  console.log(
    'Provider'.padEnd(15) +
      'Model'.padEnd(25) +
      'Stage'.padEnd(20) +
      'Status'.padEnd(10) +
      'Duration'
  );
  console.log('-'.repeat(80));

  results.forEach((r) => {
    const status = r.success ? '✅ Pass' : '❌ Fail';
    console.log(
      r.provider.padEnd(15) +
        r.model.padEnd(25) +
        r.stage.padEnd(20) +
        status.padEnd(10) +
        `${r.duration}ms`
    );
    if (!r.success && r.error) {
      console.log(`  Error: ${r.error}`);
    }
    if (r.quality) {
      console.log(`  Quality: ${r.quality}`);
    }
  });

  console.log('\n' + '='.repeat(80));

  // Recommendations
  console.log('\nRECOMMENDATIONS:');
  console.log('-'.repeat(80));

  if (successCount === totalTests) {
    console.log('✅ All tests passed! System is production ready.');
  } else {
    console.log('⚠️  Some tests failed. Review errors before deploying.');
  }

  const slowTests = results.filter((r) => r.duration > 5000);
  if (slowTests.length > 0) {
    console.log(
      `⚠️  ${slowTests.length} test(s) exceeded 5s. Consider optimization.`
    );
  }

  console.log('='.repeat(80) + '\n');
}

/**
 * Test Groq API models
 */
async function testGroq() {
  console.log('\n🧪 Testing Groq API...\n');

  // Test Stage 1: Template Generation with Llama 3.3 70B
  console.log('Stage 1: Template Generation (Llama 3.3 70B Versatile)...');
  const templateStart = Date.now();
  try {
    const Groq = (await import('groq-sdk')).default;
    const groq = new Groq({ apiKey: process.env['GROQ_API_KEY'] });

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert brand designer specializing in minimalist logo design.',
        },
        {
          role: 'user',
          content: `Create a detailed logo specification for "${TEST_PROMPT.businessName}" - ${TEST_PROMPT.description}

Industry: ${TEST_PROMPT.industry}
Primary Symbol: ${TEST_PROMPT.symbols.primary}
Secondary Element: ${TEST_PROMPT.symbols.secondary}
Mood: ${TEST_PROMPT.symbols.mood}

Expand this into three layers:

SCENE-LEVEL:
List 3-5 essential visual objects that should appear in the logo.

OBJECT-LEVEL:
For each object, describe its semantic components.

LAYOUT-LEVEL:
Specify exact positioning, relative sizes, color palette (hex codes), and spatial relationships.

Output format:
SCENE: [list objects]
OBJECTS: [component breakdown]
LAYOUT: [detailed specifications]`,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content || '';
    const duration = Date.now() - templateStart;

    results.push({
      provider: 'Groq',
      model: 'llama-3.3-70b-versatile',
      stage: 'Template Generation',
      success: true,
      duration,
      outputLength: response.length,
      quality: response.includes('SCENE') && response.includes('OBJECTS') ? 'Good' : 'Poor',
    });

    console.log(`✅ Success (${duration}ms, ${response.length} chars)`);
    console.log(`Quality: ${response.includes('SCENE') ? '✓' : '✗'} SCENE, ${response.includes('OBJECTS') ? '✓' : '✗'} OBJECTS, ${response.includes('LAYOUT') ? '✓' : '✗'} LAYOUT`);
  } catch (error) {
    const duration = Date.now() - templateStart;
    results.push({
      provider: 'Groq',
      model: 'llama-3.3-70b-versatile',
      stage: 'Template Generation',
      success: false,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log(`❌ Failed: ${error instanceof Error ? error.message : error}`);
  }

  // Test Stage 2: SVG Code Generation with Llama 3.1 8B
  console.log('\nStage 2: SVG Code Generation (Llama 3.1 8B Instant)...');
  const svgStart = Date.now();
  try {
    const Groq = (await import('groq-sdk')).default;
    const groq = new Groq({ apiKey: process.env['GROQ_API_KEY'] });

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert SVG code generator. Generate clean, semantic SVG code with only basic primitives.',
        },
        {
          role: 'user',
          content: `Generate SVG logo code for TechFlow based on this specification:

SCENE: flowing data stream icon, geometric connector nodes, dynamic arrow element
OBJECTS: Stream (curved path with gradient), Nodes (3 circles connected), Arrow (forward-pointing triangle)
LAYOUT: Centered composition, stream flows left-to-right, nodes at intersection points, primary color ${TEST_PROMPT.colors.primary}

Create a professional, minimalist logo using ONLY basic SVG primitives.
Return ONLY the SVG code.`,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 4000,
    });

    const response = completion.choices[0]?.message?.content || '';
    const duration = Date.now() - svgStart;
    const hasSVG = response.includes('<svg') && response.includes('</svg>');
    const svgMatch = response.match(/<svg[\s\S]*<\/svg>/i);

    results.push({
      provider: 'Groq',
      model: 'llama-3.1-8b-instant',
      stage: 'SVG Generation',
      success: hasSVG,
      duration,
      outputLength: response.length,
      quality: hasSVG && svgMatch ? 'Good' : 'Poor',
    });

    console.log(`${hasSVG ? '✅' : '❌'} ${hasSVG ? 'Success' : 'Failed'} (${duration}ms, ${response.length} chars)`);
    if (hasSVG && svgMatch) {
      console.log(`SVG Length: ${svgMatch[0].length} chars`);
    }
  } catch (error) {
    const duration = Date.now() - svgStart;
    results.push({
      provider: 'Groq',
      model: 'llama-3.1-8b-instant',
      stage: 'SVG Generation',
      success: false,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log(`❌ Failed: ${error instanceof Error ? error.message : error}`);
  }

  // Test Stage 3: Quality Review with Llama 3.1 8B
  console.log('\nStage 3: Quality Review (Llama 3.1 8B Instant)...');
  const reviewStart = Date.now();
  try {
    const Groq = (await import('groq-sdk')).default;
    const groq = new Groq({ apiKey: process.env['GROQ_API_KEY'] });

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a professional brand design critic.' },
        {
          role: 'user',
          content: `Review this SVG logo for "TechFlow":

<svg viewBox="0 0 512 512"><circle cx="256" cy="256" r="100" fill="#3B82F6"/></svg>

Rate on a scale of 1-10 and provide feedback.

Output format:
SCORE: [score]/10
FEEDBACK: [2-3 sentences]`,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.5,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content || '';
    const duration = Date.now() - reviewStart;
    const hasScore = response.includes('SCORE');
    const hasFeedback = response.includes('FEEDBACK');

    results.push({
      provider: 'Groq',
      model: 'llama-3.1-8b-instant',
      stage: 'Quality Review',
      success: hasScore && hasFeedback,
      duration,
      outputLength: response.length,
      quality: hasScore && hasFeedback ? 'Good' : 'Poor',
    });

    console.log(`${hasScore && hasFeedback ? '✅' : '❌'} ${hasScore && hasFeedback ? 'Success' : 'Failed'} (${duration}ms)`);
    console.log(`Structure: ${hasScore ? '✓' : '✗'} SCORE, ${hasFeedback ? '✓' : '✗'} FEEDBACK`);
  } catch (error) {
    const duration = Date.now() - reviewStart;
    results.push({
      provider: 'Groq',
      model: 'llama-3.1-8b-instant',
      stage: 'Quality Review',
      success: false,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log(`❌ Failed: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('🚀 Starting API Performance & Quality Tests\n');
  console.log('Testing with:');
  console.log(`  Business: ${TEST_PROMPT.businessName}`);
  console.log(`  Industry: ${TEST_PROMPT.industry}`);
  console.log(`  Description: ${TEST_PROMPT.description}\n`);

  try {
    await testOpenRouter();
    await testGroq();
  } catch (error) {
    console.error('Fatal error during testing:', error);
  }

  printResults();
}

// Run tests
main().catch(console.error);
