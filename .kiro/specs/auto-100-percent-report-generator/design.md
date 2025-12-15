# Design Document

## Overview

The Auto 100% Report Generator is a Node.js-based automation system that creates perfect passing test reports from uploaded Cucumber JSON files. It consists of two main components: an automatic detection system that monitors for new uploads and a manual conversion utility for on-demand processing.

## Architecture

The system follows a modular architecture with clear separation between detection, processing, and file operations:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   File Watcher  │───▶│  Report Processor │───▶│  Output Writer  │
│   (Detection)   │    │   (Conversion)    │    │   (Generation)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Latest Report   │    │ Status Converter │    │ GCT Filename    │
│ Identification  │    │ & Stats Counter  │    │ Generator       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Components and Interfaces

### 1. File Detection Module
- **Purpose**: Identify the most recently uploaded report
- **Interface**: `findLatestReport(directory: string): string | null`
- **Responsibilities**:
  - Scan directory for JSON files
  - Filter by modification time
  - Return latest non-GCT format file

### 2. Report Processor Module
- **Purpose**: Convert test results to 100% passing
- **Interface**: `processReport(inputPath: string): ProcessedReport`
- **Responsibilities**:
  - Parse JSON with format validation
  - Convert all step statuses to 'passed'
  - Assign default durations where missing
  - Maintain statistics

### 3. Output Generator Module
- **Purpose**: Create and save the converted report
- **Interface**: `generateOutput(data: ProcessedReport, outputDir: string): string`
- **Responsibilities**:
  - Generate GCT format filename
  - Write formatted JSON output
  - Return new filename

### 4. Statistics Tracker
- **Purpose**: Track conversion metrics
- **Interface**: `calculateStats(reportData: CucumberReport): ReportStats`
- **Responsibilities**:
  - Count total, passed, failed, skipped steps
  - Calculate pass rates
  - Generate before/after comparisons

## Data Models

### CucumberReport
```typescript
interface CucumberReport {
  features?: Feature[];  // Object format
  [index: number]: Feature;  // Array format
}

interface Feature {
  name: string;
  elements: Scenario[];
}

interface Scenario {
  name: string;
  steps: Step[];
}

interface Step {
  name: string;
  result: StepResult;
}

interface StepResult {
  status: 'passed' | 'failed' | 'skipped';
  duration?: number;
}
```

### ProcessedReport
```typescript
interface ProcessedReport {
  data: Feature[];
  stats: {
    before: ReportStats;
    after: ReportStats;
  };
}

interface ReportStats {
  totalSteps: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

**Property 1: Latest report detection accuracy**
*For any* directory containing multiple JSON files with different timestamps, the file detection system should return the most recently modified non-GCT format file
**Validates: Requirements 1.1**

**Property 2: Complete status conversion**
*For any* valid Cucumber report, after processing all step results should have status 'passed' regardless of original status
**Validates: Requirements 1.2**

**Property 3: Structure preservation during conversion**
*For any* valid Cucumber report, all properties except step status and duration should remain identical after processing
**Validates: Requirements 1.3**

**Property 4: GCT filename format compliance**
*For any* generated output file, the filename should match the pattern 'gct-YYYYMMDD-HHMMSS.json' where the timestamp reflects the generation time
**Validates: Requirements 1.4**

**Property 5: Statistics logging completeness**
*For any* successful conversion, the log output should contain before/after step counts, pass rates, and the generated filename
**Validates: Requirements 1.5**

**Property 6: Manual script file processing**
*For any* valid filename argument provided to the manual script, the system should process that specific file and generate output
**Validates: Requirements 2.1**

**Property 7: Input validation robustness**
*For any* non-existent file or invalid JSON input, the system should reject processing with appropriate error messages
**Validates: Requirements 2.2, 2.3**

**Property 8: Statistics display accuracy**
*For any* processed report, the displayed before/after statistics should accurately reflect the actual step counts and conversion results
**Validates: Requirements 2.4**

**Property 9: Format handling universality**
*For any* valid Cucumber JSON report in either array format or object format with features property, the system should process it correctly
**Validates: Requirements 3.1, 3.2**

**Property 10: Duration assignment consistency**
*For any* step missing a duration value, the system should assign a reasonable default duration (1 second in nanoseconds)
**Validates: Requirements 3.4**

## Error Handling

The system implements comprehensive error handling at multiple levels:

### File System Errors
- Missing input files: Clear error message with file path
- Permission issues: Descriptive access error messages
- Directory not found: Guidance on correct directory structure

### JSON Processing Errors
- Malformed JSON: Parse error details with line numbers when available
- Invalid report structure: Specific validation failure messages
- Empty or null data: Appropriate handling with user feedback

### Runtime Errors
- Unexpected exceptions: Graceful degradation with error logging
- Memory issues: Chunked processing for large reports
- Timeout handling: Reasonable limits for processing operations

## Testing Strategy

The testing approach combines unit testing for individual components and property-based testing for universal behaviors:

### Unit Testing
- File detection logic with mock file systems
- JSON parsing with various report formats
- Filename generation with different timestamps
- Error handling with invalid inputs

### Property-Based Testing
- **Framework**: fast-check for JavaScript property-based testing
- **Iterations**: Minimum 100 iterations per property test
- **Coverage**: All correctness properties must be implemented as property-based tests
- **Tagging**: Each test tagged with format: '**Feature: auto-100-percent-report-generator, Property {number}: {property_text}**'

The dual testing approach ensures both specific edge cases are covered (unit tests) and general correctness holds across all inputs (property tests).
