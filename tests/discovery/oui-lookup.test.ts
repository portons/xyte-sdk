import { describe, it, expect } from 'vitest';
import { lookupOui } from '../../src/discovery/oui-lookup';

describe('lookupOui', () => {
  it('finds Apple by colon-separated MAC', () => {
    expect(lookupOui('00:03:93:AA:BB:CC')).toBe('Apple');
  });

  it('finds Google by lowercase MAC', () => {
    expect(lookupOui('54:60:09:11:22:33')).toBe('Google');
  });

  it('finds Sonos', () => {
    expect(lookupOui('48:A6:B8:00:00:01')).toBe('Sonos');
  });

  it('finds Espressif for ESP devices', () => {
    expect(lookupOui('24:0A:C4:DE:AD:00')).toBe('Espressif');
  });

  it('handles dash-separated MAC (after normalization)', () => {
    expect(lookupOui('00-03-93-AA-BB-CC')).toBe('Apple');
  });

  it('handles MAC without separators', () => {
    expect(lookupOui('000393AABBCC')).toBe('Apple');
  });

  it('returns undefined for unknown OUI', () => {
    expect(lookupOui('FF:FF:FF:00:00:00')).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(lookupOui('')).toBeUndefined();
  });

  it('returns undefined for too-short MAC', () => {
    expect(lookupOui('00:03')).toBeUndefined();
  });
});
