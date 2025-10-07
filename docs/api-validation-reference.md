# Validation API Reference

This document provides detailed API reference for the validation and accuracy features in the Cucumber Report Viewer.

## Core Classes

### CucumberJsonValidator

Validates and sanitizes Cucumber JSON reports.

#### Constructor

```javascript
new CucumberJsonValidator(options)
```

**Parameters:**
- `options` (Object, optional)
  - `strictMode` (boolean, default: false) - Enable strict validation mode
  - `generatePlaceholders` (boolean, default: true) - Auto-generate names for null/empty entries
  - `maxErrors` (number, default: 100) - Maximum errors to collect before stopping
  - `logLevel` (string, default: 'warn') - Logging level ('none', 'error', 'warn', 'info', 'debug')

#### Methods

##### validateReport(json, filename)

Validates a complete Cucumber JSON report.

```javascript
const result = validator.validateReport(jsonData, 'report.json');
```

**Parameters:**
- `json` (Array) - Cucumber JSON data (array of features)
- `filename` (string, optional) - Filename for error reporting

**Returns:** ValidationResult object
```javascript
{
  isValid: boolean,
  errors: Array<ValidationError>,
  warnings: Array<ValidationWarning>,
  sanitizedData: Array,
  originalEntryCount: number,
  processedEntryCount: number,
  skippedEntries: Array<SkippedEntry>
}
```

##### sanitizeTestName(name, fallback, type)

Sanitizes test names, handling null/empty values.

```javascript
const cleanName = validator.sanitizeTestName(null, 'Test 1', 'scenario');
// Returns: "Test 1 (auto-generated)"
```

**Parameters:**
- `name` (string) - Original test name
- `fallback` (string) - Fallback name to use
- `type` (string) - Type of test element ('feature', 'scenario', 'step')

**Returns:** string - Sanitized test name

##### handleMalformedEntry(entry, context)

Attempts to recover from malformed test entries.

```javascript
const recovery = validator.handleMalformedEntry(malformedEntry, {
  fallbackName: 'Recovered Test',
  featureIndex: 0,
  scenarioIndex: 1
});
```

**Parameters:**
- `entry` (any) - Malformed entry to recover
- `context` (Object) - Context for recovery

**Returns:** RecoveryResult object
```javascript
{
  recovered: boolean,
  sanitizedEntry: Object,
  errors: Array<string>
}
```

##### generateValidationReport()

Generates comprehensive validation report.

```javascript
const report = validator.generateValidationReport();
```

**Returns:** ValidationReport object
```javascript
{
  summary: {
    totalErrors: number,
    totalWarnings: number,
    processedEntries: number,
    skippedEntries: number,
    successRate: string
  },
  errors: Array<ValidationError>,
  warnings: Array<ValidationWarning>,
  recommendations: Array<string>
}
```

### TestStatusCalculator

Calculates accurate test statuses considering all execution phases.

#### Constructor

```javascript
new TestStatusCalculator(options)
```

**Parameters:**
- `options` (Object, optional)
  - `treatSetupFailuresAsFailed` (boolean, default: true) - Count setup failures as test failures
  - `treatTeardownFailuresAsFailed` (boolean, default: true) - Count teardown failures as test failures
  - `logLevel` (string, default: 'warn') - Logging level

#### Methods

##### calculateScenarioStatus(scenario)

Calculates accurate status for a scenario.

```javascript
const result = calculator.calculateScenarioStatus(scenario);
```

**Parameters:**
- `scenario` (Object) - Cucumber scenario object

**Returns:** StatusResult object
```javascript
{
  status: string, // 'passed', 'failed', 'skipped', 'unknown'
  reason: string,
  details: {
    setupStatus: string,
    executionStatus: string,
    teardownStatus: string,
    hasSteps: boolean,
    hasSetup: boolean,
    hasTeardown: boolean
  }
}
```

##### calculateFeatureStatus(feature)

Calculates status for an entire feature.

```javascript
const result = calculator.calculateFeatureStatus(feature);
```

**Parameters:**
- `feature` (Object) - Cucumber feature object

**Returns:** FeatureStatusResult object
```javascript
{
  status: string,
  reason: string,
  counts: {
    passed: number,
    failed: number,
    skipped: number,
    errors: number,
    total: number
  }
}
```

##### handleSetupFailures(beforeHooks, afterHooks)

Analyzes setup and teardown failures.

```javascript
const result = calculator.handleSetupFailures(beforeHooks, afterHooks);
```

**Parameters:**
- `beforeHooks` (Array) - Array of before hook objects
- `afterHooks` (Array) - Array of after hook objects

**Returns:** SetupFailureResult object
```javascript
{
  setupFailed: boolean,
  teardownFailed: boolean,
  setupError: string,
  teardownError: string,
  shouldFailTest: boolean
}
```

##### extractErrorMessage(item)

Extracts error message from step or hook.

```javascript
const message = calculator.extractErrorMessage(step);
```

**Parameters:**
- `item` (Object) - Step or hook object

**Returns:** string | null - Error message or null if none

### DataIntegrityValidator

Validates data integrity and consistency.

#### Constructor

```javascript
new DataIntegrityValidator(options)
```

**Parameters:**
- `options` (Object, optional)
  - `tolerancePercentage` (number, default: 5) - Tolerance for minor discrepancies
  - `strictMode` (boolean, default: false) - Enable strict validation
  - `logLevel` (string, default: 'warn') - Logging level

#### Methods

##### validateTestCounts(summary, reportData)

Validates test count consistency.

```javascript
const validation = validator.validateTestCounts(summary, reportData);
```

**Parameters:**
- `summary` (Object) - Test count summary
- `reportData` (Array, optional) - Raw report data for cross-validation

**Returns:** CountValidationResult object
```javascript
{
  isValid: boolean,
  issues: Array<ValidationIssue>,
  summary: Object,
  calculatedSummary: Object,
  discrepancies: Array<Discrepancy>
}
```

##### crossValidateResults(parsedData, originalJson, expectedCounts)

Cross-validates results between different parsing methods.

```javascript
const validation = validator.crossValidateResults(parsedData, originalJson, expectedCounts);
```

**Parameters:**
- `parsedData` (Object) - Processed data counts
- `originalJson` (Array) - Original JSON data
- `expectedCounts` (Object, optional) - Expected counts for comparison

**Returns:** CrossValidationResult object
```javascript
{
  isValid: boolean,
  issues: Array<ValidationIssue>,
  comparisons: Array<ComparisonResult>,
  recommendations: Array<Recommendation>
}
```

##### detectInconsistencies(data, context)

Detects data inconsistencies and anomalies.

```javascript
const inconsistencies = validator.detectInconsistencies(data, context);
```

**Parameters:**
- `data` (Object) - Data to analyze
- `context` (Object, optional) - Additional context

**Returns:** Array<Inconsistency>
```javascript
[
  {
    type: string,
    field: string,
    message: string,
    severity: string, // 'error', 'warning', 'info'
    value: any
  }
]
```

##### generateIntegrityReport(data, originalJson, expectedCounts)

Generates comprehensive integrity report.

```javascript
const report = validator.generateIntegrityReport(data, originalJson, expectedCounts);
```

**Parameters:**
- `data` (Object) - Data to analyze
- `originalJson` (Array, optional) - Original JSON for comparison
- `expectedCounts` (Object, optional) - Expected counts

**Returns:** IntegrityReport object
```javascript
{
  timestamp: string,
  overallStatus: string, // 'healthy', 'warning', 'critical', 'error'
  summary: {
    totalIssues: number,
    criticalIssues: number,
    warnings: number,
    recommendations: number
  },
  validations: {
    countValidation: CountValidationResult,
    crossValidation: CrossValidationResult,
    inconsistencyDetection: Array<Inconsistency>
  },
  recommendations: Array<Recommendation>,
  details: Object
}
```

### ErrorHandler

Handles errors and provides detailed logging.

#### Constructor

```javascript
new ErrorHandler(options)
```

**Parameters:**
- `options` (Object, optional)
  - `logLevel` (string, default: 'warn') - Logging level
  - `maxLogEntries` (number, default: 1000) - Maximum log entries to keep
  - `enableConsoleLogging` (boolean, default: true) - Enable console output
  - `enableLocalStorage` (boolean, default: true) - Enable localStorage persistence

#### Methods

##### logError(message, context, error)

Logs an error with context.

```javascript
const logEntry = errorHandler.logError('Validation failed', { filename: 'test.json' }, error);
```

**Parameters:**
- `message` (string) - Error message
- `context` (Object, optional) - Additional context
- `error` (Error, optional) - Original error object

**Returns:** LogEntry object

##### handleJsonParsingError(filename, error, rawData)

Handles JSON parsing errors with recovery.

```javascript
const result = errorHandler.handleJsonParsingError('test.json', error, rawData);
```

**Parameters:**
- `filename` (string) - Filename being parsed
- `error` (Error) - Parsing error
- `rawData` (any, optional) - Raw data for recovery attempts

**Returns:** ErrorHandlingResult object
```javascript
{
  logEntry: LogEntry,
  recovery: RecoveryResult,
  userMessage: string
}
```

##### getErrorSummary()

Gets summary of logged errors and warnings.

```javascript
const summary = errorHandler.getErrorSummary();
```

**Returns:** ErrorSummary object
```javascript
{
  totalErrors: number,
  totalWarnings: number,
  totalInfo: number,
  recentErrors: Array<LogEntry>,
  recentWarnings: Array<LogEntry>,
  lastErrorTime: string,
  lastWarningTime: string
}
```

### DiagnosticTools

Provides comprehensive diagnostic and debugging capabilities.

#### Constructor

```javascript
new DiagnosticTools()
```

#### Methods

##### generateDiagnosticReport(reportData, originalJson, expectedCounts)

Generates comprehensive diagnostic report.

```javascript
const report = diagnosticTools.generateDiagnosticReport(reportData, originalJson, expectedCounts);
```

**Parameters:**
- `reportData` (Array|Object) - Processed report data
- `originalJson` (Array, optional) - Original JSON data
- `expectedCounts` (Object, optional) - Expected counts

**Returns:** DiagnosticReport object
```javascript
{
  timestamp: string,
  reportId: string,
  summary: {
    dataSize: number,
    processingTime: number,
    overallHealth: string
  },
  validation: ValidationAnalysis,
  statusAnalysis: StatusAnalysis,
  integrityCheck: IntegrityReport,
  comparison: ComparisonResult,
  recommendations: Array<Recommendation>,
  debugInfo: Object
}
```

##### compareWithIdeOutput(reportData, ideOutput)

Compares parsed results with IDE output.

```javascript
const comparison = diagnosticTools.compareWithIdeOutput(reportData, ideOutput);
```

**Parameters:**
- `reportData` (Array|Object) - Processed report data
- `ideOutput` (Object) - Parsed IDE output

**Returns:** IdeComparisonResult object
```javascript
{
  timestamp: string,
  source: string,
  matches: Object,
  discrepancies: Array<Discrepancy>,
  confidence: string, // 'high', 'medium', 'low', 'error'
  analysis: {
    possibleCauses: Array<string>,
    recommendations: Array<string>
  }
}
```

##### enableDiagnosticMode(reportData, options)

Enables detailed diagnostic mode with step-by-step logging.

```javascript
const session = diagnosticTools.enableDiagnosticMode(reportData, {
  verboseLogging: true,
  trackPerformance: true,
  validateEachStep: true
});
```

**Parameters:**
- `reportData` (Array|Object) - Data to process
- `options` (Object, optional) - Diagnostic options

**Returns:** DiagnosticSession object
```javascript
{
  sessionId: string,
  startTime: string,
  endTime: string,
  duration: number,
  options: Object,
  logs: Array<LogEntry>,
  metrics: Object,
  results: Object
}
```

## Data Types

### ValidationError

```javascript
{
  type: string,
  location: string,
  message: string,
  context: Object,
  timestamp: string
}
```

### ValidationWarning

```javascript
{
  type: string,
  location: string,
  message: string,
  context: Object,
  timestamp: string
}
```

### Discrepancy

```javascript
{
  type: string,
  field: string,
  expected: any,
  actual: any,
  difference: number,
  tolerance: number
}
```

### Recommendation

```javascript
{
  priority: string, // 'critical', 'high', 'medium', 'low', 'info'
  message: string,
  action: string,
  field: string
}
```

### LogEntry

```javascript
{
  id: string,
  level: string,
  message: string,
  context: Object,
  timestamp: string,
  stack: string,
  userAgent: string
}
```

## Usage Examples

### Basic Validation

```javascript
import CucumberJsonValidator from '@/utils/CucumberJsonValidator';

const validator = new CucumberJsonValidator({
  generatePlaceholders: true,
  logLevel: 'warn'
});

const result = validator.validateReport(jsonData, 'test-report.json');

if (result.isValid) {
  console.log('Validation passed');
  // Use result.sanitizedData
} else {
  console.log('Validation failed:', result.errors);
  // Handle errors
}
```

### Status Calculation

```javascript
import TestStatusCalculator from '@/utils/TestStatusCalculator';

const calculator = new TestStatusCalculator({
  treatSetupFailuresAsFailed: true
});

jsonData.forEach(feature => {
  feature.elements.forEach(scenario => {
    const statusResult = calculator.calculateScenarioStatus(scenario);
    console.log(`${scenario.name}: ${statusResult.status} (${statusResult.reason})`);
  });
});
```

### Integrity Validation

```javascript
import DataIntegrityValidator from '@/utils/DataIntegrityValidator';

const validator = new DataIntegrityValidator({
  tolerancePercentage: 5
});

const summary = { scenarios: 10, passed: 7, failed: 2, skipped: 1 };
const validation = validator.validateTestCounts(summary, jsonData);

if (!validation.isValid) {
  console.log('Integrity issues:', validation.discrepancies);
}
```

### Comprehensive Diagnostics

```javascript
import DiagnosticTools from '@/utils/DiagnosticTools';

const diagnostics = new DiagnosticTools();

const report = diagnostics.generateDiagnosticReport(
  processedData,
  originalJson,
  { scenarios: 52, failed: 2, skipped: 0 }
);

console.log(`Overall health: ${report.summary.overallHealth}`);
console.log(`Recommendations: ${report.recommendations.length}`);
```

## Error Handling

### Try-Catch Patterns

```javascript
try {
  const result = validator.validateReport(jsonData, filename);
  // Process result
} catch (error) {
  errorHandler.logError('Validation failed', { filename }, error);
  // Handle gracefully
}
```

### Graceful Degradation

```javascript
let processedData = jsonData;

try {
  const validationResult = validator.validateReport(jsonData, filename);
  if (validationResult.sanitizedData) {
    processedData = validationResult.sanitizedData;
  }
} catch (error) {
  // Continue with original data, log error
  errorHandler.logError('Validation failed, using original data', { filename }, error);
}
```

## Performance Considerations

### Large Reports

```javascript
// For large reports, consider chunked processing
const validator = new CucumberJsonValidator({
  maxErrors: 50, // Limit error collection
  logLevel: 'error' // Reduce logging overhead
});
```

### Memory Management

```javascript
// Clear caches periodically
reportService.clearCache();
errorHandler.clearLogs();
```

### Async Processing

```javascript
// Use async/await for non-blocking processing
async function processReport(jsonData) {
  const result = await new Promise(resolve => {
    setTimeout(() => {
      resolve(validator.validateReport(jsonData));
    }, 0);
  });
  return result;
}
```