# Validation and Parsing Troubleshooting

This guide helps you troubleshoot common validation and parsing issues in the Cucumber Report Viewer.

## Quick Diagnosis

### 1. Check Report Header

Look for these indicators in the report header:

- ✅ **No warnings**: Report processed successfully
- ⚠️ **Yellow warning banner**: Data quality issues found (recoverable)
- 🔴 **Red error banner**: Critical data integrity issues

### 2. Validation Warning Details

Click "Show Details" on warning banners to see:
- Number of errors and warnings
- Specific locations of issues
- Processing statistics (X of Y entries processed)

### 3. Quick Health Check

Use the Debug Panel's "Run Diagnostics" for instant health assessment:
- **GOOD**: No issues detected
- **FAIR**: Minor issues, results reliable
- **POOR**: Multiple warnings, review recommended
- **CRITICAL**: Significant issues, manual verification needed

## Common Validation Issues

### Issue: "Test name must not be null or empty"

**Symptoms:**
```
IllegalArgumentException: Test name must not be null or empty
```

**Cause:** Test framework generated scenarios with null or empty names

**Solution:**
1. System automatically generates placeholder names
2. Look for tests named like "Scenario 0 (auto-generated)"
3. Fix test framework to provide proper names

**Prevention:**
```java
// Bad
@Test
public void test() { ... }

// Good  
@Test
public void shouldValidateUserInput() { ... }
```

### Issue: "ElementNotInteractableException" Misclassification

**Symptoms:**
- IDE shows test as failed
- Report viewer might show as skipped

**Cause:** Setup failures in before hooks not properly classified

**Solution:**
1. Enhanced status calculator now treats setup failures as test failures
2. Check Status Analysis in Debug Panel for setup failure count
3. Verify before hook error handling

**Example Fix:**
```java
@Before
public void setUp() {
    try {
        driver.get(url);
    } catch (ElementNotInteractableException e) {
        // This will now be properly counted as test failure
        throw e;
    }
}
```

### Issue: Count Discrepancies

**Symptoms:**
- IDE: "Tests run: 52, Failures: 2, Skipped: 0"
- Report: Shows different counts

**Diagnosis Steps:**
1. Open Debug Panel
2. Paste IDE output in comparison field
3. Click "Compare with IDE"
4. Review discrepancies and analysis

**Common Causes:**
- Setup/teardown failures counted differently
- Background scenarios included/excluded
- Test framework counting vs. JSON structure differences

### Issue: "Missing result/status" Warnings

**Symptoms:**
```
Feature 0, Scenario 1, Step 2: Missing result/status
```

**Cause:** Test steps without proper result objects

**Solution:**
1. System adds default result objects automatically
2. Check test framework configuration
3. Ensure all steps generate results

**Test Framework Fix:**
```java
// Ensure step definitions always set results
@Given("I have a test")
public void iHaveATest() {
    // Step implementation
    // Framework should automatically set result status
}
```

## Data Integrity Issues

### Critical Issues

#### Impossible Counts
**Problem:** More passed tests than total tests
```
Total: 10, Passed: 15, Failed: 0
```

**Diagnosis:**
1. Run full diagnostics
2. Check cross-validation results
3. Look for data corruption

**Solutions:**
- Re-generate JSON from test execution
- Check test framework configuration
- Verify JSON file integrity

#### Negative Values
**Problem:** Negative test counts
```
Passed: 5, Failed: -2, Skipped: 3
```

**Cause:** Data corruption or parsing errors

**Solutions:**
1. Re-run test execution
2. Check JSON file for corruption
3. Verify test framework output

### Warning-Level Issues

#### High Scenario-to-Feature Ratio
**Problem:** 1000+ scenarios per feature

**Impact:** May indicate data structure issues

**Solutions:**
- Review feature organization
- Check for duplicate entries
- Verify JSON structure

#### Unusual Duration
**Problem:** Very long average test duration

**Impact:** May indicate performance issues or data errors

**Solutions:**
- Check for timeout issues
- Review test execution environment
- Verify duration calculation

## Debugging Workflow

### Step 1: Initial Assessment

1. **Check validation status** in report header
2. **Note any warning/error banners**
3. **Review basic counts** (features, scenarios, steps)

### Step 2: Detailed Analysis

1. **Open Debug Panel**
2. **Run Diagnostics** for comprehensive analysis
3. **Review Status Analysis** for breakdown
4. **Check Data Integrity** results

### Step 3: IDE Comparison

1. **Copy IDE output** (full test execution summary)
2. **Paste in comparison field**
3. **Run comparison**
4. **Analyze discrepancies**

### Step 4: Export and Review

1. **Export debug data** for offline analysis
2. **Review JSON structure** in exported data
3. **Look for patterns** across multiple reports

## Advanced Troubleshooting

### Custom Validation Rules

For specific environments, you may need custom validation:

```javascript
// Example: Custom tolerance for high-volume testing
const validator = new DataIntegrityValidator({
  tolerancePercentage: 10, // Allow 10% variance
  strictMode: false
});
```

### Performance Issues

If validation is slow:

1. **Check report size** in debug info
2. **Monitor processing time** in diagnostics
3. **Consider chunked processing** for very large reports

### Memory Issues

For large reports:

1. **Check memory usage** in debug panel
2. **Clear cache** if needed
3. **Process reports in smaller batches**

## Error Code Reference

### Validation Error Codes

| Code | Description | Severity | Action |
|------|-------------|----------|---------|
| V001 | Null test name | Warning | Auto-generate placeholder |
| V002 | Empty test name | Warning | Auto-generate placeholder |
| V003 | Missing result object | Warning | Add default result |
| V004 | Invalid JSON structure | Error | Fix JSON format |
| V005 | Malformed scenario | Warning | Skip and log |

### Integrity Error Codes

| Code | Description | Severity | Action |
|------|-------------|----------|---------|
| I001 | Count mismatch | Error | Manual verification |
| I002 | Negative values | Error | Check data source |
| I003 | Cross-validation failure | Warning | Review parsing logic |
| I004 | Impossible ratios | Warning | Check data quality |
| I005 | Missing critical fields | Error | Fix data structure |

## Prevention Strategies

### Test Framework Best Practices

1. **Consistent Naming**: Always provide meaningful test names
2. **Complete Results**: Ensure all steps generate result objects
3. **Proper Error Handling**: Handle setup/teardown failures appropriately
4. **Clean Data**: Avoid null/undefined values in test metadata

### Report Generation Best Practices

1. **Validate Before Upload**: Check JSON structure before processing
2. **Regular Monitoring**: Set up alerts for validation failures
3. **Data Quality Metrics**: Track validation warning trends
4. **Backup Strategy**: Keep original JSON files for re-processing

### Monitoring and Alerting

Set up monitoring for:
- Validation failure rates
- Critical integrity issues
- Processing time increases
- Memory usage spikes

## Getting Help

### Information to Provide

When seeking support, include:

1. **Debug data export** (JSON file from Debug Panel)
2. **IDE output text** (copy/paste from terminal)
3. **Expected vs. actual results**
4. **Steps to reproduce**
5. **Test framework and version**

### Self-Service Resources

1. **Debug Panel**: Built-in diagnostic tools
2. **Validation Details**: Expandable error information
3. **Comparison Tools**: IDE output comparison
4. **Export Features**: Debug data for analysis

### Escalation Path

1. **Level 1**: Use built-in diagnostic tools
2. **Level 2**: Export debug data and review offline
3. **Level 3**: Contact support with debug data and reproduction steps

## FAQ

### Q: Why do my counts not match the IDE?

**A:** Common causes include:
- Setup/teardown failures counted differently
- Background scenarios included/excluded
- Test framework vs. JSON structure differences

Use the IDE comparison tool to identify specific discrepancies.

### Q: Are validation warnings serious?

**A:** Most validation warnings are automatically fixed:
- **Yellow warnings**: Data quality issues, results should be accurate
- **Red errors**: Critical issues, manual verification recommended

### Q: How do I improve data quality?

**A:** Focus on:
- Providing meaningful test names
- Ensuring complete result objects
- Proper error handling in test framework
- Regular validation monitoring

### Q: Can I disable validation?

**A:** Validation cannot be disabled as it ensures result accuracy. However, you can:
- Review and fix underlying data quality issues
- Use tolerance settings for minor discrepancies
- Export debug data for custom processing

### Q: What if diagnostics show "CRITICAL" health?

**A:** This indicates significant data integrity issues:
1. Do not rely on displayed results without verification
2. Compare with IDE output using comparison tool
3. Check for data corruption in source JSON
4. Consider re-generating reports from test execution