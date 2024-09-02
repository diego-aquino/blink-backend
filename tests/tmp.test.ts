import { expect } from 'chai';
import { describe, it } from 'mocha';

function capitalize(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1).toLowerCase();
}

describe('Capitalize', () => {
  it('should capitalize the first letter of a string', () => {
    expect(capitalize('hello')).equal('Hello');
    expect(capitalize('other')).equal('Other');
  });

  it('should lowercase the rest of the string', () => {
    expect(capitalize('HELLO')).equal('Hello');
    expect(capitalize('OTheR')).equal('Other');
  });

  it('should return the input if it is already capitalized', () => {
    expect(capitalize('Hello')).equal('Hello');
    expect(capitalize('Other')).equal('Other');
  });

  it('should return an empty string if the input is empty', () => {
    expect(capitalize('')).equal('');
  });
});
