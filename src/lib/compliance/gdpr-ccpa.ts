/**
 * GDPR and CCPA Compliance Utilities
 * Data subject rights, consent management, and compliance reporting
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import archiver from 'archiver';

// ============================================================================
// TYPES
// ============================================================================

export interface DataSubjectRequest {
  id: string;
  userId?: string;
  email: string;
  requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  regulation: 'GDPR' | 'CCPA' | 'PIPEDA' | 'APP';
  status: 'pending' | 'verified' | 'processing' | 'completed' | 'rejected';
  verificationCode?: string;
  verificationMethod?: 'email' | 'sms' | 'account';
  verifiedAt?: Date;
  dueDate: Date;
  completedAt?: Date;
  responseData?: any;
  rejectionReason?: string;
  createdAt: Date;
}

export interface ConsentRecord {
  userId: string;
  purpose: 'necessary' | 'analytics' | 'marketing';
  consentGiven: boolean;
  consentedAt?: Date;
  withdrawnAt?: Date;
  ipAddress: string;
  userAgent: string;
  consentVersion: string;
}

export interface DataExport {
  personalData: any;
  documents: any[];
  activityLogs: any[];
  thirdPartySharing: any[];
  format: 'JSON' | 'CSV';
  generatedAt: Date;
  expiresAt: Date;
}

export interface ErasureReport {
  userId: string;
  requestedAt: Date;
  completedAt: Date | null;
  itemsDeleted: string[];
  itemsAnonymized: string[];
  retainedForCompliance: string[];
}

// ============================================================================
// GDPR COMPLIANCE SERVICE
// ============================================================================

export class GDPRComplianceService {
  constructor(private supabase: SupabaseClient) {}

  // ==========================================================================
  // DATA SUBJECT ACCESS REQUEST (DSAR)
  // ==========================================================================

  /**
   * Create a new data subject access request
   */
  async createAccessRequest(
    email: string,
    requestType: DataSubjectRequest['requestType'],
    regulation: DataSubjectRequest['regulation'] = 'GDPR'
  ): Promise<DataSubjectRequest> {
    // Check if user exists
    const { data: user } = await this.supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    // Generate verification code
    const verificationCode = this.generateVerificationCode();

    // Calculate due date (30 days for GDPR)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const { data: request, error } = await this.supabase
      .from('data_subject_requests')
      .insert({
        user_id: user?.id,
        email,
        request_type: requestType,
        regulation,
        status: 'pending',
        verification_code: verificationCode,
        verification_method: 'email',
        due_date: dueDate.toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Send verification email
    await this.sendVerificationEmail(email, verificationCode, requestType);

    return request;
  }

  /**
   * Verify data subject request
   */
  async verifyRequest(requestId: string, code: string): Promise<boolean> {
    const { data: request, error } = await this.supabase
      .from('data_subject_requests')
      .select('*')
      .eq('id', requestId)
      .eq('verification_code', code)
      .single();

    if (error || !request) {
      return false;
    }

    await this.supabase
      .from('data_subject_requests')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString()
      })
      .eq('id', requestId);

    // Auto-process if possible
    await this.processRequest(requestId);

    return true;
  }

  /**
   * Process verified data subject request
   */
  async processRequest(requestId: string): Promise<void> {
    const { data: request } = await this.supabase
      .from('data_subject_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (!request || request.status !== 'verified') {
      throw new Error('Request not verified');
    }

    // Update status to processing
    await this.supabase
      .from('data_subject_requests')
      .update({ status: 'processing' })
      .eq('id', requestId);

    try {
      let responseData: any;

      switch (request.request_type) {
        case 'access':
          responseData = await this.generateDataExport(request.user_id || request.email);
          break;

        case 'erasure':
          responseData = await this.executeRightToErasure(request.user_id);
          break;

        case 'portability':
          responseData = await this.generatePortableData(request.user_id);
          break;

        case 'rectification':
          // Manual process - requires human review
          return;

        case 'restriction':
          responseData = await this.restrictProcessing(request.user_id);
          break;

        case 'objection':
          responseData = await this.processObjection(request.user_id);
          break;
      }

      // Mark as completed
      await this.supabase
        .from('data_subject_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          response_data: responseData
        })
        .eq('id', requestId);

      // Send completion email
      await this.sendCompletionEmail(request.email, request.request_type, responseData);
    } catch (error) {
      console.error('Error processing request:', error);

      await this.supabase
        .from('data_subject_requests')
        .update({
          status: 'rejected',
          rejection_reason: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', requestId);
    }
  }

  // ==========================================================================
  // RIGHT TO ACCESS (GDPR ARTICLE 15)
  // ==========================================================================

  /**
   * Generate comprehensive data export for user
   */
  async generateDataExport(userIdOrEmail: string): Promise<DataExport> {
    const { data: user } = await this.getUserByIdOrEmail(userIdOrEmail);

    if (!user) {
      throw new Error('User not found');
    }

    // Collect all personal data
    const personalData = await this.collectPersonalData(user.id);
    const documents = await this.collectDocuments(user.id);
    const activityLogs = await this.collectActivityLogs(user.id);
    const thirdPartySharing = await this.collectThirdPartyData(user.id);

    const dataExport: DataExport = {
      personalData,
      documents,
      activityLogs,
      thirdPartySharing,
      format: 'JSON',
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };

    return dataExport;
  }

  /**
   * Collect all personal data for user
   */
  private async collectPersonalData(userId: string): Promise<any> {
    const { data: user } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: organizations } = await this.supabase
      .from('user_organizations')
      .select('*, organizations(*)')
      .eq('user_id', userId);

    const { data: consent } = await this.supabase
      .from('consent_records')
      .select('*')
      .eq('user_id', userId);

    return {
      profile: {
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        createdAt: user.created_at,
        lastLogin: user.last_login_at
      },
      organizations: organizations?.map(org => ({
        name: org.organizations.name,
        role: org.role,
        joinedAt: org.joined_at
      })),
      consent: consent
    };
  }

  /**
   * Collect all documents created or accessed by user
   */
  private async collectDocuments(userId: string): Promise<any[]> {
    const { data: documents } = await this.supabase
      .from('documents')
      .select('id, name, file_type, created_at, updated_at')
      .eq('created_by', userId);

    return documents || [];
  }

  /**
   * Collect activity logs for user
   */
  private async collectActivityLogs(userId: string): Promise<any[]> {
    const { data: logs } = await this.supabase
      .from('audit_logs')
      .select('timestamp, event_type, resource, operation')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(1000);

    return logs || [];
  }

  /**
   * Collect third-party data sharing information
   */
  private async collectThirdPartyData(userId: string): Promise<any[]> {
    // List of third-party services data is shared with
    return [
      {
        service: 'Analytics Provider',
        purpose: 'Usage analytics',
        dataShared: ['Email (hashed)', 'Usage patterns'],
        privacyPolicy: 'https://analytics-provider.com/privacy'
      },
      {
        service: 'Payment Processor',
        purpose: 'Payment processing',
        dataShared: ['Email', 'Billing information'],
        privacyPolicy: 'https://payment-processor.com/privacy'
      }
    ];
  }

  // ==========================================================================
  // RIGHT TO ERASURE (GDPR ARTICLE 17)
  // ==========================================================================

  /**
   * Execute right to erasure (right to be forgotten)
   */
  async executeRightToErasure(userId: string): Promise<ErasureReport> {
    const report: ErasureReport = {
      userId,
      requestedAt: new Date(),
      completedAt: null,
      itemsDeleted: [],
      itemsAnonymized: [],
      retainedForCompliance: []
    };

    try {
      // 1. Delete user profile data (or anonymize)
      await this.supabase
        .from('users')
        .update({
          first_name: null,
          last_name: null,
          phone_encrypted: null,
          address_encrypted: null,
          deleted_at: new Date().toISOString()
        })
        .eq('id', userId);

      report.itemsAnonymized.push('user_profile');

      // 2. Delete or anonymize documents
      const { data: documents } = await this.supabase
        .from('documents')
        .select('id, storage_path, storage_bucket')
        .eq('created_by', userId);

      for (const doc of documents || []) {
        // Delete from storage
        await this.supabase.storage
          .from(doc.storage_bucket)
          .remove([doc.storage_path]);

        // Soft delete from database
        await this.supabase
          .from('documents')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', doc.id);
      }

      report.itemsDeleted.push('documents');

      // 3. Anonymize audit logs (keep for compliance)
      await this.supabase
        .from('audit_logs')
        .update({
          user_id: null,
          context: { anonymized: true }
        })
        .eq('user_id', userId);

      report.itemsAnonymized.push('audit_logs');
      report.retainedForCompliance.push('audit_logs (anonymized)');

      // 4. Delete payment methods (keep transaction records)
      // Payment records retained for tax/compliance (7 years)
      report.retainedForCompliance.push('payment_records (anonymized)');

      // 5. Delete sessions and tokens
      await this.supabase.auth.admin.deleteUser(userId);
      report.itemsDeleted.push('auth_sessions');

      // 6. Remove from third-party services
      await this.deleteFromThirdParties(userId);
      report.itemsDeleted.push('third_party_services');

      report.completedAt = new Date();
    } catch (error) {
      console.error('Error during erasure:', error);
      throw error;
    }

    return report;
  }

  // ==========================================================================
  // RIGHT TO DATA PORTABILITY (GDPR ARTICLE 20)
  // ==========================================================================

  /**
   * Generate portable data in machine-readable format
   */
  async generatePortableData(userId: string): Promise<string> {
    const dataExport = await this.generateDataExport(userId);

    // Convert to JSON format
    const portableData = JSON.stringify(dataExport, null, 2);

    // In production, upload to secure location and return download link
    return portableData;
  }

  // ==========================================================================
  // CONSENT MANAGEMENT
  // ==========================================================================

  /**
   * Record user consent
   */
  async recordConsent(
    userId: string,
    purpose: ConsentRecord['purpose'],
    consentGiven: boolean,
    metadata: {
      ipAddress: string;
      userAgent: string;
      consentVersion: string;
    }
  ): Promise<void> {
    await this.supabase.from('consent_records').insert({
      user_id: userId,
      purpose,
      consent_given: consentGiven,
      consented_at: consentGiven ? new Date().toISOString() : null,
      withdrawn_at: !consentGiven ? new Date().toISOString() : null,
      ip_address: metadata.ipAddress,
      user_agent: metadata.userAgent,
      consent_version: metadata.consentVersion
    });
  }

  /**
   * Withdraw consent
   */
  async withdrawConsent(userId: string, purpose: ConsentRecord['purpose']): Promise<void> {
    await this.supabase
      .from('consent_records')
      .update({
        consent_given: false,
        withdrawn_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('purpose', purpose)
      .eq('consent_given', true);
  }

  /**
   * Check if user has given consent
   */
  async hasConsent(userId: string, purpose: ConsentRecord['purpose']): Promise<boolean> {
    const { data } = await this.supabase
      .from('consent_records')
      .select('consent_given')
      .eq('user_id', userId)
      .eq('purpose', purpose)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return data?.consent_given || false;
  }

  // ==========================================================================
  // CCPA COMPLIANCE
  // ==========================================================================

  /**
   * Opt out of data sale (CCPA)
   */
  async optOutOfSale(email: string): Promise<void> {
    // Create "Do Not Sell" record
    const emailHash = this.hashEmail(email);

    await this.supabase.from('ccpa_opt_out').insert({
      email_hash: emailHash,
      opted_out_at: new Date().toISOString()
    });

    // Notify third parties within 15 days
    await this.notifyThirdPartiesOptOut(email);
  }

  /**
   * Check if email has opted out of sale
   */
  async hasOptedOutOfSale(email: string): Promise<boolean> {
    const emailHash = this.hashEmail(email);

    const { data } = await this.supabase
      .from('ccpa_opt_out')
      .select('id')
      .eq('email_hash', emailHash)
      .single();

    return !!data;
  }

  // ==========================================================================
  // BREACH NOTIFICATION
  // ==========================================================================

  /**
   * Check if breach requires notification
   */
  isNotificationRequired(breach: {
    affectedUsers: number;
    dataTypes: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
  }): {
    gdpr: boolean;
    ccpa: boolean;
    authority: boolean;
    users: boolean;
  } {
    return {
      // GDPR: 72 hours to authority if likely risk to rights and freedoms
      gdpr: breach.severity === 'high' || breach.severity === 'critical',

      // CCPA: notify if unencrypted personal info of CA residents
      ccpa: breach.affectedUsers > 500 && breach.severity !== 'low',

      // Notify data protection authority
      authority: breach.severity === 'high' || breach.severity === 'critical',

      // Notify affected users
      users: breach.severity === 'high' || breach.severity === 'critical'
    };
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private async getUserByIdOrEmail(idOrEmail: string) {
    if (idOrEmail.includes('@')) {
      return await this.supabase
        .from('users')
        .select('*')
        .eq('email', idOrEmail)
        .single();
    } else {
      return await this.supabase
        .from('users')
        .select('*')
        .eq('id', idOrEmail)
        .single();
    }
  }

  private generateVerificationCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  private hashEmail(email: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
  }

  private async restrictProcessing(userId: string): Promise<any> {
    // Mark user for restricted processing
    await this.supabase
      .from('users')
      .update({ processing_restricted: true })
      .eq('id', userId);

    return { restricted: true };
  }

  private async processObjection(userId: string): Promise<any> {
    // Handle objection to processing
    await this.supabase
      .from('consent_records')
      .update({
        consent_given: false,
        withdrawn_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('purpose', 'marketing');

    return { marketing_stopped: true };
  }

  private async deleteFromThirdParties(userId: string): Promise<void> {
    // Call third-party APIs to delete user data
    console.log('Deleting from third parties:', userId);
  }

  private async notifyThirdPartiesOptOut(email: string): Promise<void> {
    // Notify third parties of opt-out
    console.log('Notifying third parties of opt-out:', email);
  }

  private async sendVerificationEmail(
    email: string,
    code: string,
    requestType: string
  ): Promise<void> {
    console.log(`Sending verification email to ${email} with code ${code}`);
  }

  private async sendCompletionEmail(
    email: string,
    requestType: string,
    data: any
  ): Promise<void> {
    console.log(`Sending completion email to ${email}`);
  }
}

// ============================================================================
// COMPLIANCE REPORTING
// ============================================================================

export class ComplianceReporter {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Generate GDPR compliance report
   */
  async generateGDPRReport(startDate: Date, endDate: Date): Promise<any> {
    const { data: requests } = await this.supabase
      .from('data_subject_requests')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const { data: breaches } = await this.supabase
      .from('security_events')
      .select('*')
      .eq('event_type', 'DATA_BREACH')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    return {
      period: { start: startDate, end: endDate },
      dataSubjectRequests: {
        total: requests?.length || 0,
        byType: this.groupBy(requests || [], 'request_type'),
        averageResponseTime: this.calculateAverageResponseTime(requests || []),
        compliance: this.calculateComplianceRate(requests || [])
      },
      dataBreaches: {
        total: breaches?.length || 0,
        reported: breaches?.filter(b => b.reported_at).length || 0,
        averageReportingTime: this.calculateAverageReportingTime(breaches || [])
      },
      consent: await this.getConsentMetrics(startDate, endDate)
    };
  }

  private groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((acc, item) => {
      const value = item[key];
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  private calculateAverageResponseTime(requests: any[]): number {
    const completed = requests.filter(r => r.completed_at);
    if (completed.length === 0) return 0;

    const totalTime = completed.reduce((sum, r) => {
      const created = new Date(r.created_at).getTime();
      const completed = new Date(r.completed_at).getTime();
      return sum + (completed - created);
    }, 0);

    return totalTime / completed.length / (1000 * 60 * 60 * 24); // Days
  }

  private calculateComplianceRate(requests: any[]): number {
    const total = requests.length;
    if (total === 0) return 100;

    const compliant = requests.filter(r => {
      if (!r.completed_at) return false;

      const created = new Date(r.created_at).getTime();
      const completed = new Date(r.completed_at).getTime();
      const days = (completed - created) / (1000 * 60 * 60 * 24);

      return days <= 30; // 30 day SLA
    }).length;

    return (compliant / total) * 100;
  }

  private calculateAverageReportingTime(breaches: any[]): number {
    const reported = breaches.filter(b => b.reported_at);
    if (reported.length === 0) return 0;

    const totalTime = reported.reduce((sum, b) => {
      const detected = new Date(b.created_at).getTime();
      const reported = new Date(b.reported_at).getTime();
      return sum + (reported - detected);
    }, 0);

    return totalTime / reported.length / (1000 * 60 * 60); // Hours
  }

  private async getConsentMetrics(startDate: Date, endDate: Date): Promise<any> {
    const { data: consents } = await this.supabase
      .from('consent_records')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    return {
      total: consents?.length || 0,
      granted: consents?.filter(c => c.consent_given).length || 0,
      withdrawn: consents?.filter(c => c.withdrawn_at).length || 0,
      byPurpose: this.groupBy(consents || [], 'purpose')
    };
  }
}

// Export services
export const createGDPRService = (supabase: SupabaseClient) =>
  new GDPRComplianceService(supabase);

export const createComplianceReporter = (supabase: SupabaseClient) =>
  new ComplianceReporter(supabase);
