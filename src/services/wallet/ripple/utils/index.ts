/**
 * Utility exports for Ripple services
 */

export {
  RippleErrorHandler,
  RIPPLE_ERROR_CODES,
  handleRippleError,
  createFailureResult,
  createSuccessResult,
  isRetryableError,
  getRetryDelay,
  createUserErrorMessage
} from './ErrorHandler';

export {
  RippleApiClient,
  createRippleApiClient
} from './ApiClient';

export type {
  ApiClientConfig,
  RequestConfig
} from './ApiClient';

export {
  RippleValidator,
  validator,
  validate,
  required,
  stringLength,
  numberRange,
  enumValue,
  email,
  phone,
  url,
  isoDate,
  currencyCode,
  countryCode,
  amount,
  xrpAddress,
  ethAddress,
  uuid,
  custom,
  combine,
  VALIDATION_CODES,
  COMMON_SCHEMAS
} from './Validators';

export type {
  FieldValidator,
  ValidationSchema
} from './Validators';
