import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { convertMeasurementText } from './measurements.mjs';

describe('Flux measurement conversion', () => {
  it('converts metric tonnes to kilograms using the metric tonne', () => {
    const result = convertMeasurementText('Convert 20 MT TMT steel into kg.');
    assert.equal(result.supported, true);
    assert.equal(result.converted, '20,000 kilograms');
    assert.match(result.formula, /20 × 1000/);
    assert.equal(result.confidence, 'high');
  });

  it('supports compound feet and inches', () => {
    const result = convertMeasurementText('Convert 5 feet 8 inches into cm.');
    assert.equal(result.supported, true);
    assert.equal(result.converted, '172.72 centimetres');
  });

  it('converts Fahrenheit and includes the formula', () => {
    const result = convertMeasurementText('Convert 98.6°F into Celsius.');
    assert.equal(result.supported, true);
    assert.equal(result.converted, '37 degrees Celsius');
    assert.match(result.formula, /°F − 32/);
  });

  it('converts both blood-pressure values and includes the health disclaimer', () => {
    const result = convertMeasurementText('Convert 120/80 mmHg blood pressure into kPa.');
    assert.equal(result.supported, true);
    assert.equal(result.converted, '15.9986864898/10.6657909932 kilopascals');
    assert.equal(result.disclaimer, 'This is general health information, not medical advice.');
  });

  it('converts area, energy, speed, and currency only with an explicit rate', () => {
    assert.equal(convertMeasurementText('Convert 1 acre to square feet.').converted, '43,560 square feet');
    assert.equal(convertMeasurementText('Convert 500 calories to kilojoules.').converted, '2,092 kilojoules');
    assert.equal(convertMeasurementText('Convert 10 km to miles.').converted, '6.21371192237 miles');
    assert.equal(convertMeasurementText('Convert $100 to INR at rate 83.2.').converted, '8,320 INR');
    assert.equal(convertMeasurementText('Convert 20 EUR to JPY at rate 160.2.').converted, '3,204 JPY');
    assert.equal(convertMeasurementText('Convert 1 mcg to kg.').converted, '0.000000001 kilograms');
    assert.equal(convertMeasurementText('Convert 1 US gallon to litres.').converted, '3.785411784 litres');
  });

  it('refuses ambiguous volume, regional area, medicine, and currency conversions', () => {
    const glass = convertMeasurementText('Convert 2 litres into glasses.');
    assert.equal(glass.supported, false);
    assert.match(glass.explanation, /capacity varies/i);

    const bigha = convertMeasurementText('Convert 1 bigha to square feet.');
    assert.equal(bigha.supported, false);
    assert.match(bigha.explanation, /Bigha size varies/i);

    const bags = convertMeasurementText('Convert 10 cement bags to kg.');
    assert.equal(bags.supported, false);
    assert.match(bags.explanation, /Bag weight varies/i);

    const iu = convertMeasurementText('Convert 100 IU to mg.');
    assert.equal(iu.supported, false);
    assert.match(iu.explanation, /depends on the substance/i);
    assert.equal(iu.disclaimer, 'This is general health information, not medical advice.');

    const medicalMismatch = convertMeasurementText('Convert 120 mmHg to metres.');
    assert.equal(medicalMismatch.supported, false);
    assert.equal(medicalMismatch.disclaimer, 'This is general health information, not medical advice.');

    const currency = convertMeasurementText('Convert 100 USD to INR.');
    assert.equal(currency.supported, false);
    assert.match(currency.explanation, /No live exchange rate/i);

    const invalidRate = convertMeasurementText('Convert 100 USD to INR at rate 0.');
    assert.equal(invalidRate.supported, false);
    assert.match(invalidRate.explanation, /positive finite number/i);

    const unspecifiedGallon = convertMeasurementText('Convert 1 gallon to litres.');
    assert.equal(unspecifiedGallon.supported, false);
    assert.match(unspecifiedGallon.explanation, /US, Imperial, and metric/i);

  });

  it('rejects dimensional mismatches and ignores unrelated questions', () => {
    const mismatch = convertMeasurementText('Convert 5 kg to metres.');
    assert.equal(mismatch.supported, false);
    assert.match(mismatch.explanation, /dimensions do not match/i);
    assert.equal(convertMeasurementText('Which invoices are overdue?'), null);
  });
});
