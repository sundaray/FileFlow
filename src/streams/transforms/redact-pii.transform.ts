import { Transform } from 'node:stream';
import type { RedactPiiStageConfig } from '../../types/pipeline.types.js';

/**
 * Redact PII Transform
 * Detects and masks personally identifiable information (PII) in string fields.
 * Supports: emails, phone numbers, SSN, and credit card numbers.
 */
export class RedactPiiTransform extends Transform {
  private redactEmails: boolean;
  private redactPhones: boolean;
  private redactSSN: boolean;
  private redactCreditCards: boolean;
  private maskChar: string;
  private visibleChars: number;

  // Regex patterns for PII detection
  private readonly EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  private readonly PHONE_REGEX = /\b(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})\b/g;
  private readonly SSN_REGEX = /\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g;
  private readonly CREDIT_CARD_REGEX = /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g;

  constructor(config: RedactPiiStageConfig) {
    super({ objectMode: true });
    this.redactEmails = config.options.redactEmails;
    this.redactPhones = config.options.redactPhones;
    this.redactSSN = config.options.redactSSN;
    this.redactCreditCards = config.options.redactCreditCards;
    this.maskChar = config.options.maskChar;
    this.visibleChars = config.options.visibleChars;
  }

  _transform(
    chunk: Record<string, unknown>,
    encoding: BufferEncoding,
    callback: (error?: Error | null, data?: Record<string, unknown>) => void
  ): void {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(chunk)) {
      if (typeof value === 'string') {
        result[key] = this.redactString(value);
      } else {
        result[key] = value;
      }
    }

    callback(null, result);
  }

  private redactString(text: string): string {
    let result = text;

    if (this.redactEmails) {
      result = result.replace(this.EMAIL_REGEX, (match) => this.maskValue(match));
    }

    if (this.redactPhones) {
      result = result.replace(this.PHONE_REGEX, (match) => this.maskValue(match));
    }

    if (this.redactSSN) {
      result = result.replace(this.SSN_REGEX, (match) => this.maskValue(match));
    }

    if (this.redactCreditCards) {
      result = result.replace(this.CREDIT_CARD_REGEX, (match) => this.maskValue(match));
    }

    return result;
  }

  private maskValue(value: string): string {
    if (value.length <= this.visibleChars) {
      return this.maskChar.repeat(value.length);
    }

    const visiblePart = value.slice(-this.visibleChars);
    const maskedPart = this.maskChar.repeat(value.length - this.visibleChars);
    return maskedPart + visiblePart;
  }
}
