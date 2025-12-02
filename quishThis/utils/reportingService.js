// utils/reportingService.js - Service for reporting suspicious URLs
// Implements Observer pattern for notification of report status
import axios from 'axios'; // Uncomment if using axios for HTTP requests
import { API_CONFIG } from '../config';

/**
 * ReportingService - Handles reporting of suspicious/malicious URLs
 * Uses Observer pattern to notify subscribers of report status changes
 */
class ReportingService {
  constructor() {
    this.observers = [];
    this.reportHistory = [];
  }

  /**
   * Subscribe to report status updates
   * @param {function} observer - Callback function for updates
   */
  subscribe(observer) {
    this.observers.push(observer);
  }

  /**
   * Unsubscribe from report status updates
   * @param {function} observer - Observer to remove
   */
  unsubscribe(observer) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  /**
   * Notify all observers of status change
   * @param {object} data - Status data to broadcast
   */
  notify(data) {
    this.observers.forEach(observer => {
      try {
        observer(data);
      } catch (error) {
        console.error('Observer notification error:', error);
      }
    });
  }

  /**
   * Report a suspicious URL to multiple services
   * @param {string} url - URL to report
   * @param {string} category - Category (phishing, malware, etc.)
   * @param {string} description - Description of the threat
   * @returns {Promise<object>} Report result
   */
  async reportURL(url, category = 'phishing', description = '') {
    try {
      const report = {
        url,
        category,
        description,
        timestamp: new Date().toISOString(),
        reportId: this.generateReportId(),
        status: 'pending'
      };

      this.notify({ status: 'submitting', report });

      // Submit to multiple services in parallel
      const submissions = await Promise.allSettled([
        this.logToInternal(report),
        this.prepareManualSubmissions(url)
      ]);

      report.submissions = submissions.map((result, index) => {
        const services = ['Internal Log', 'Manual Submission Info'];
        return {
          service: services[index],
          status: result.status === 'fulfilled' ? 'success' : 'failed',
          data: result.value || result.reason
        };
      });

      report.status = 'completed';
      this.reportHistory.push(report);
      this.notify({ status: 'completed', report });

      return report;

    } catch (error) {
      console.error('Reporting error:', error);
      this.notify({ status: 'error', error: error.message });
      throw error;
    }
  }

  /**
   * Log report to internal storage
   * @param {object} report - Report object
   * @returns {Promise<object>} Log result
   */
  async logToInternal(report) {
    return {
      service: 'Internal Log',
      status: 'success',
      timestamp: new Date().toISOString(),
      reportId: report.reportId,
      message: 'Logged locally for tracking'
    };
  }

  /**
   * Prepare manual submission instructions
   * @param {string} url - URL to report
   * @returns {Promise<object>} Instructions
   */
  async prepareManualSubmissions(url) {
    return {
      service: 'Manual Submissions',
      instructions: this.getManualReportingInstructions(url),
      message: 'Manual submission info prepared'
    };
  }

  /**
   * Get manual reporting instructions for all services
   * @param {string} url - URL to report
   * @returns {object} Detailed instructions
   */
  getManualReportingInstructions(url) {
    return {
      url,
      services: [
        {
          name: 'Google Safe Browsing',
          url: API_CONFIG.REPORT_ENDPOINTS.GOOGLE_SAFE_BROWSING,
          instructions: [
            '1. Visit the Google Safe Browsing report page',
            '2. Enter the suspicious URL',
            '3. Provide additional details about the threat',
            '4. Submit the report'
          ],
          priority: 'high'
        },
        {
          name: 'PhishTank',
          url: API_CONFIG.REPORT_ENDPOINTS.PHISHTANK,
          instructions: [
            '1. Create a PhishTank account (if needed)',
            '2. Visit the PhishTank submission page',
            '3. Enter the phishing URL',
            '4. Describe the phishing attempt',
            '5. Submit for community verification'
          ],
          priority: 'high'
        },
        {
          name: 'Anti-Phishing Working Group (APWG)',
          email: 'reportphishing@apwg.org',
          instructions: [
            '1. Forward phishing email to reportphishing@apwg.org',
            '2. Include all headers and original content',
            '3. APWG will analyze and share with affected parties'
          ],
          priority: 'medium'
        },
        {
          name: 'US-CERT',
          url: 'https://www.cisa.gov/report',
          instructions: [
            '1. Visit the CISA reporting page',
            '2. Fill out the incident report form',
            '3. Provide details about the malicious URL',
            '4. Submit to US-CERT for analysis'
          ],
          priority: 'medium'
        }
      ]
    };
  }

  /**
   * Generate unique report ID
   * @returns {string} Unique identifier
   */
  generateReportId() {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get report history
   * @returns {Array} All reports
   */
  getReportHistory() {
    return this.reportHistory;
  }

  /**
   * Get a specific report by ID
   * @param {string} reportId - Report ID to find
   * @returns {object|null} Report or null
   */
  getReportById(reportId) {
    return this.reportHistory.find(r => r.reportId === reportId) || null;
  }

  /**
   * Clear report history
   */
  clearHistory() {
    this.reportHistory = [];
    this.notify({ status: 'history_cleared' });
  }

  /**
   * Export reports for sharing with authorities
   * @param {string} format - Export format (json or csv)
   * @returns {string} Exported data
   */
  exportReports(format = 'json') {
    if (format === 'json') {
      return JSON.stringify(this.reportHistory, null, 2);
    } else if (format === 'csv') {
      return this.convertToCSV(this.reportHistory);
    }
    return this.reportHistory;
  }

  /**
   * Convert reports to CSV format
   * @param {Array} reports - Reports to convert
   * @returns {string} CSV string
   */
  convertToCSV(reports) {
    if (reports.length === 0) return '';

    const headers = ['Report ID', 'URL', 'Category', 'Timestamp', 'Status', 'Description'];
    const rows = reports.map(report => [
      report.reportId,
      report.url,
      report.category,
      report.timestamp,
      report.status,
      (report.description || '').replace(/,/g, ';') // Escape commas
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csv;
  }

  /**
   * Get statistics about reports
   * @returns {object} Report statistics
   */
  getStatistics() {
    return {
      total: this.reportHistory.length,
      byCategory: this.groupByCategory(),
      byStatus: this.groupByStatus(),
      recentCount: this.getRecentReportsCount(24) // Last 24 hours
    };
  }

  /**
   * Group reports by category
   * @returns {object} Category counts
   */
  groupByCategory() {
    return this.reportHistory.reduce((acc, report) => {
      acc[report.category] = (acc[report.category] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Group reports by status
   * @returns {object} Status counts
   */
  groupByStatus() {
    return this.reportHistory.reduce((acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Get count of recent reports
   * @param {number} hours - Hours to look back
   * @returns {number} Count of recent reports
   */
  getRecentReportsCount(hours = 24) {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.reportHistory.filter(report => {
      return new Date(report.timestamp).getTime() > cutoff;
    }).length;
  }
}

// Singleton instance (Singleton pattern)
export const reportingService = new ReportingService();

export default ReportingService;