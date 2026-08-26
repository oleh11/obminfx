import { calculateBankFeeConversion, evaluateMathExpression, formatCurrencyAmount } from '../services/feeCalculator';

function runTests() {
  console.log('=== Starting Currency Converter & Bank Fee Unit Tests ===\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${detail || ''}`);
    }
  }

  // 1. Test Mastercard compliant Bank Processing Fee calculation (2% Average Bank Rate)
  // 100 EUR -> USD at rate 1.0850 with 2.0% bank fee
  const result2Pct = calculateBankFeeConversion(100, 'EUR', 'USD', 1.0850, 2.0);
  assert(result2Pct.convertedBaseAmount === 108.50, 'Base converted amount is exactly $108.50', `Got ${result2Pct.convertedBaseAmount}`);
  assert(Math.abs(result2Pct.bankFeeAmount - 2.17) < 0.0001, 'Bank 2% fee is exactly $2.17', `Got ${result2Pct.bankFeeAmount}`);
  assert(Math.abs(result2Pct.totalBilledAmount - 110.67) < 0.0001, 'Total card billed amount is $110.67', `Got ${result2Pct.totalBilledAmount}`);
  assert(Math.abs(result2Pct.effectiveRate - 1.1067) < 0.0001, 'Effective rate is 1.1067 USD/EUR', `Got ${result2Pct.effectiveRate}`);

  // 2. Test 0% No-Foreign-Fee Travel Card
  const result0Pct = calculateBankFeeConversion(100, 'EUR', 'USD', 1.0850, 0.0);
  assert(result0Pct.bankFeeAmount === 0, '0% card fee has 0 bank fee', `Got ${result0Pct.bankFeeAmount}`);
  assert(result0Pct.totalBilledAmount === 108.50, '0% card billed matches exact base conversion', `Got ${result0Pct.totalBilledAmount}`);

  // 3. Test 3.0% Standard High-Fee Card
  const result3Pct = calculateBankFeeConversion(250, 'GBP', 'USD', 1.3000, 3.0);
  // Base = 250 * 1.30 = 325.00; Fee = 325 * 0.03 = 9.75; Total = 334.75
  assert(result3Pct.convertedBaseAmount === 325.00, 'Base 250 GBP to USD is $325.00', `Got ${result3Pct.convertedBaseAmount}`);
  assert(Math.abs(result3Pct.bankFeeAmount - 9.75) < 0.0001, '3% Bank fee is $9.75', `Got ${result3Pct.bankFeeAmount}`);
  assert(Math.abs(result3Pct.totalBilledAmount - 334.75) < 0.0001, 'Total billed is $334.75', `Got ${result3Pct.totalBilledAmount}`);

  // 4. Test Calculator Math Expression Parser
  assert(evaluateMathExpression('100 + 50') === 150, 'Arithmetic 100 + 50 = 150');
  assert(evaluateMathExpression('25 × 4') === 100, 'Arithmetic 25 × 4 = 100');
  assert(evaluateMathExpression('150 ÷ 3') === 50, 'Arithmetic 150 ÷ 3 = 50');
  assert(evaluateMathExpression('(50 + 25) * 2') === 150, 'Arithmetic (50 + 25) * 2 = 150');
  assert(evaluateMathExpression('invalid_text') === 0 || evaluateMathExpression('invalid_text') === null, 'Safe fallback on invalid math');

  // 5. Test Formatting
  assert(formatCurrencyAmount(1234.56, 2) === '1,234.56', 'Localized thousand separator format');
  assert(formatCurrencyAmount(0.0000154, 6) === '0.000015', 'Crypto high-precision format');

  console.log(`\n=== Test Results: ${passed}/${total} Passed ===`);
  if (passed === total) {
    console.log('🎉 ALL UNIT TESTS PASSED SUCCESSFULLY!');
  } else {
    throw new Error(`Test failed: only ${passed}/${total} passed`);
  }
}

runTests();
