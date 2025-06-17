/**
 * Custom Playwright reporter for enhanced test reporting
 */

import {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
  TestStatus,
} from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';

interface TestMetrics {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  duration: number;
}

interface TestDetails {
  name: string;
  file: string;
  status: TestStatus;
  duration: number;
  error?: string;
  retries: number;
  annotations: string[];
}

export default class CustomReporter implements Reporter {
  private metrics: TestMetrics = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    flaky: 0,
    duration: 0,
  };

  private testDetails: TestDetails[] = [];
  private startTime = Date.now();
  private config!: FullConfig;

  onBegin(config: FullConfig, suite: Suite) {
    this.config = config;
    console.log(`\n🎭 Starting Playwright test run with ${suite.allTests().length} tests\n`);
  }

  onTestBegin(test: TestCase, result: TestResult) {
    console.log(`  ⏳ ${test.title}`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    this.metrics.total++;
    const status = result.status;
    
    // Update metrics
    switch (status) {
      case 'passed':
        this.metrics.passed++;
        console.log(`  ✅ ${test.title} (${result.duration}ms)`);
        break;
      case 'failed':
        this.metrics.failed++;
        console.log(`  ❌ ${test.title} (${result.duration}ms)`);
        if (result.error) {
          console.log(`     Error: ${result.error.message}`);
        }
        break;
      case 'timedOut':
        this.metrics.failed++;
        console.log(`  ⏱️  ${test.title} - TIMEOUT`);
        break;
      case 'skipped':
        this.metrics.skipped++;
        console.log(`  ⏭️  ${test.title} - SKIPPED`);
        break;
    }

    // Check if test is flaky
    if (result.retry > 0 && status === 'passed') {
      this.metrics.flaky++;
    }

    // Store test details
    this.testDetails.push({
      name: test.title,
      file: test.location.file,
      status,
      duration: result.duration,
      error: result.error?.message,
      retries: result.retry,
      annotations: test.annotations.map(a => `${a.type}: ${a.description}`),
    });
  }

  onEnd(result: FullResult) {
    this.metrics.duration = Date.now() - this.startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 Test Results Summary');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${this.metrics.total}`);
    console.log(`✅ Passed: ${this.metrics.passed}`);
    console.log(`❌ Failed: ${this.metrics.failed}`);
    console.log(`⏭️  Skipped: ${this.metrics.skipped}`);
    console.log(`🔄 Flaky: ${this.metrics.flaky}`);
    console.log(`⏱️  Duration: ${(this.metrics.duration / 1000).toFixed(2)}s`);
    console.log('='.repeat(80) + '\n');

    // Generate reports
    this.generateJSONReport();
    this.generateHTMLReport();
    this.generateSlackMessage();
  }

  private generateJSONReport() {
    const report = {
      summary: this.metrics,
      tests: this.testDetails,
      metadata: {
        timestamp: new Date().toISOString(),
        duration: this.metrics.duration,
        workers: this.config.workers,
        projects: this.config.projects.map(p => p.name),
      },
    };

    const reportPath = path.join('test-results', 'test-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  }

  private generateHTMLReport() {
    const passRate = ((this.metrics.passed / this.metrics.total) * 100).toFixed(2);
    const statusColor = this.metrics.failed === 0 ? '#28a745' : '#dc3545';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test Report - ${new Date().toLocaleDateString()}</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
          }
          .container { max-width: 1200px; margin: 0 auto; }
          .header {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
          }
          .metric {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
          }
          .metric-value {
            font-size: 36px;
            font-weight: bold;
            color: #333;
          }
          .metric-label {
            color: #666;
            margin-top: 5px;
          }
          .test-list {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .test-item {
            padding: 15px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .test-item:last-child { border-bottom: none; }
          .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
          }
          .passed { background: #d4edda; color: #155724; }
          .failed { background: #f8d7da; color: #721c24; }
          .skipped { background: #fff3cd; color: #856404; }
          .error { 
            background: #f8d7da;
            color: #721c24;
            padding: 10px;
            margin-top: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎭 Playwright Test Report</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <div class="summary">
              <div class="metric">
                <div class="metric-value" style="color: ${statusColor}">
                  ${passRate}%
                </div>
                <div class="metric-label">Pass Rate</div>
              </div>
              <div class="metric">
                <div class="metric-value">${this.metrics.total}</div>
                <div class="metric-label">Total Tests</div>
              </div>
              <div class="metric">
                <div class="metric-value" style="color: #28a745">
                  ${this.metrics.passed}
                </div>
                <div class="metric-label">Passed</div>
              </div>
              <div class="metric">
                <div class="metric-value" style="color: #dc3545">
                  ${this.metrics.failed}
                </div>
                <div class="metric-label">Failed</div>
              </div>
              <div class="metric">
                <div class="metric-value">${(this.metrics.duration / 1000).toFixed(1)}s</div>
                <div class="metric-label">Duration</div>
              </div>
            </div>
          </div>

          <div class="test-list">
            <h2>Test Details</h2>
            ${this.testDetails.map(test => `
              <div class="test-item">
                <div>
                  <strong>${test.name}</strong>
                  <div style="color: #666; font-size: 12px; margin-top: 4px">
                    ${test.file} • ${test.duration}ms
                    ${test.retries > 0 ? `• ${test.retries} retries` : ''}
                  </div>
                  ${test.error ? `<div class="error">${test.error}</div>` : ''}
                </div>
                <span class="status-badge ${test.status}">${test.status.toUpperCase()}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </body>
      </html>
    `;

    const reportPath = path.join('test-results', 'test-report.html');
    fs.writeFileSync(reportPath, html);
    console.log(`\n📄 HTML report generated: ${reportPath}`);
  }

  private generateSlackMessage() {
    const passRate = ((this.metrics.passed / this.metrics.total) * 100).toFixed(2);
    const status = this.metrics.failed === 0 ? 'passed' : 'failed';
    const emoji = status === 'passed' ? '✅' : '❌';

    const message = {
      text: `${emoji} Playwright Tests ${status}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} Playwright Test Results`,
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Pass Rate:* ${passRate}%` },
            { type: 'mrkdwn', text: `*Duration:* ${(this.metrics.duration / 1000).toFixed(2)}s` },
            { type: 'mrkdwn', text: `*Total:* ${this.metrics.total}` },
            { type: 'mrkdwn', text: `*Passed:* ${this.metrics.passed}` },
            { type: 'mrkdwn', text: `*Failed:* ${this.metrics.failed}` },
            { type: 'mrkdwn', text: `*Flaky:* ${this.metrics.flaky}` },
          ],
        },
      ],
    };

    if (this.metrics.failed > 0) {
      const failedTests = this.testDetails.filter(t => t.status === 'failed');
      message.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Failed Tests:*\n${failedTests.map(t => `• ${t.name}`).join('\n')}`,
        },
      });
    }

    const slackPath = path.join('test-results', 'slack-message.json');
    fs.writeFileSync(slackPath, JSON.stringify(message, null, 2));
  }
}