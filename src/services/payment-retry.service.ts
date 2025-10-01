/**
 * Payment Retry Service
 * Handles failed payment retries with exponential backoff
 */

import Queue from 'bull';
import { supabase } from '../config/supabase.config';
import { stripeService } from './stripe.service';
import { logger } from '../utils/logger';
import { stripeConfig } from '../config/stripe.config';

interface PaymentRetryJob {
  invoiceId: string;
  stripeInvoiceId: string;
  customerId: string;
  attemptNumber: number;
}

export class PaymentRetryService {
  private retryQueue: Queue.Queue<PaymentRetryJob>;

  constructor() {
    // Initialize Bull queue for payment retries
    this.retryQueue = new Queue('payment-retries', process.env.REDIS_URL || 'redis://localhost:6379');

    // Process retry jobs
    this.retryQueue.process(async (job) => {
      return this.processRetry(job.data);
    });

    // Handle completed jobs
    this.retryQueue.on('completed', (job, result) => {
      logger.info('Payment retry completed', { jobId: job.id, result });
    });

    // Handle failed jobs
    this.retryQueue.on('failed', (job, error) => {
      logger.error('Payment retry failed', { jobId: job.id, error });
    });
  }

  /**
   * Schedule payment retry
   */
  async scheduleRetry(params: {
    invoiceId: string;
    stripeInvoiceId: string;
    customerId: string;
    attemptNumber: number;
  }): Promise<void> {
    try {
      const { retryConfiguration } = stripeConfig;

      // Check if max attempts reached
      if (params.attemptNumber >= retryConfiguration.maxAttempts) {
        logger.warn('Max retry attempts reached', {
          invoiceId: params.invoiceId,
          attemptNumber: params.attemptNumber,
        });
        await this.handleMaxAttemptsReached(params.invoiceId);
        return;
      }

      // Calculate delay based on retry schedule
      const delayDays = retryConfiguration.retrySchedule[params.attemptNumber] || 7;
      const delayMs = delayDays * 24 * 60 * 60 * 1000;

      // Add job to queue with delay
      await this.retryQueue.add(
        {
          invoiceId: params.invoiceId,
          stripeInvoiceId: params.stripeInvoiceId,
          customerId: params.customerId,
          attemptNumber: params.attemptNumber,
        },
        {
          delay: delayMs,
          attempts: 3, // Job-level retry attempts
          backoff: {
            type: 'exponential',
            delay: 60000, // 1 minute
          },
        }
      );

      // Update next payment attempt date
      const nextAttempt = new Date(Date.now() + delayMs);
      await supabase
        .from('invoices')
        .update({
          next_payment_attempt: nextAttempt.toISOString(),
        })
        .eq('id', params.invoiceId);

      logger.info('Payment retry scheduled', {
        invoiceId: params.invoiceId,
        attemptNumber: params.attemptNumber,
        nextAttempt,
      });
    } catch (error) {
      logger.error('Failed to schedule payment retry', { error, params });
      throw error;
    }
  }

  /**
   * Process retry attempt
   */
  private async processRetry(job: PaymentRetryJob): Promise<{ success: boolean }> {
    try {
      logger.info('Processing payment retry', {
        invoiceId: job.invoiceId,
        attemptNumber: job.attemptNumber,
      });

      // Get invoice from database
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', job.invoiceId)
        .single();

      if (invoiceError || !invoice) {
        throw new Error('Invoice not found');
      }

      // Check if invoice is still unpaid
      if (invoice.status === 'paid') {
        logger.info('Invoice already paid', { invoiceId: job.invoiceId });
        return { success: true };
      }

      // Attempt payment
      try {
        await stripeService.retryInvoicePayment(job.stripeInvoiceId);

        // Update invoice in database
        await supabase
          .from('invoices')
          .update({
            status: 'paid',
            amount_paid_cents: invoice.total_cents,
            paid_at: new Date().toISOString(),
            payment_failure_reason: null,
            next_payment_attempt: null,
          })
          .eq('id', job.invoiceId);

        // Send success notification
        await this.sendPaymentSuccessNotification(job.customerId, invoice);

        logger.info('Payment retry successful', { invoiceId: job.invoiceId });

        return { success: true };
      } catch (paymentError: any) {
        logger.warn('Payment retry failed', {
          invoiceId: job.invoiceId,
          attemptNumber: job.attemptNumber,
          error: paymentError.message,
        });

        // Update failure reason
        await supabase
          .from('invoices')
          .update({
            payment_failure_reason: paymentError.message,
          })
          .eq('id', job.invoiceId);

        // Schedule next retry
        await this.scheduleRetry({
          invoiceId: job.invoiceId,
          stripeInvoiceId: job.stripeInvoiceId,
          customerId: job.customerId,
          attemptNumber: job.attemptNumber + 1,
        });

        return { success: false };
      }
    } catch (error) {
      logger.error('Error processing payment retry', { error, job });
      throw error;
    }
  }

  /**
   * Handle max attempts reached
   */
  private async handleMaxAttemptsReached(invoiceId: string): Promise<void> {
    try {
      // Get invoice and subscription
      const { data: invoice } = await supabase
        .from('invoices')
        .select('*, subscription:subscriptions(*)')
        .eq('id', invoiceId)
        .single();

      if (!invoice) {
        return;
      }

      // Mark invoice as uncollectible
      await supabase
        .from('invoices')
        .update({
          status: 'uncollectible',
          next_payment_attempt: null,
        })
        .eq('id', invoiceId);

      // Update subscription status to unpaid
      if (invoice.subscription) {
        await supabase
          .from('subscriptions')
          .update({
            status: 'unpaid',
          })
          .eq('id', (invoice.subscription as any).id);
      }

      // Send final notification to customer
      await this.sendMaxAttemptsNotification(
        (invoice.subscription as any)?.customer_id,
        invoice
      );

      logger.warn('Max payment attempts reached, invoice marked uncollectible', {
        invoiceId,
      });
    } catch (error) {
      logger.error('Error handling max attempts reached', { error, invoiceId });
    }
  }

  /**
   * Send payment success notification
   */
  private async sendPaymentSuccessNotification(
    customerId: string,
    invoice: any
  ): Promise<void> {
    // TODO: Implement email notification
    logger.info('Payment success notification sent', { customerId, invoiceId: invoice.id });
  }

  /**
   * Send max attempts notification
   */
  private async sendMaxAttemptsNotification(
    customerId: string,
    invoice: any
  ): Promise<void> {
    // TODO: Implement email notification
    logger.info('Max attempts notification sent', { customerId, invoiceId: invoice.id });
  }

  /**
   * Cancel pending retries for invoice
   */
  async cancelRetries(invoiceId: string): Promise<void> {
    try {
      const jobs = await this.retryQueue.getJobs([
        'waiting',
        'delayed',
        'active',
      ]);

      for (const job of jobs) {
        if (job.data.invoiceId === invoiceId) {
          await job.remove();
          logger.info('Payment retry job canceled', { invoiceId, jobId: job.id });
        }
      }
    } catch (error) {
      logger.error('Failed to cancel payment retries', { error, invoiceId });
    }
  }

  /**
   * Get retry status for invoice
   */
  async getRetryStatus(invoiceId: string): Promise<{
    hasPendingRetry: boolean;
    nextAttempt?: Date;
    attemptNumber?: number;
  }> {
    try {
      const jobs = await this.retryQueue.getJobs(['waiting', 'delayed']);

      for (const job of jobs) {
        if (job.data.invoiceId === invoiceId) {
          return {
            hasPendingRetry: true,
            nextAttempt: new Date(job.processedOn! + job.opts.delay!),
            attemptNumber: job.data.attemptNumber,
          };
        }
      }

      return { hasPendingRetry: false };
    } catch (error) {
      logger.error('Failed to get retry status', { error, invoiceId });
      return { hasPendingRetry: false };
    }
  }

  /**
   * Manually trigger retry
   */
  async manualRetry(invoiceId: string): Promise<void> {
    try {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('*, subscription:subscriptions(customer_id)')
        .eq('id', invoiceId)
        .single();

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.status === 'paid') {
        throw new Error('Invoice is already paid');
      }

      // Cancel existing retries
      await this.cancelRetries(invoiceId);

      // Process retry immediately
      await this.processRetry({
        invoiceId: invoice.id,
        stripeInvoiceId: invoice.stripe_invoice_id,
        customerId: (invoice.subscription as any).customer_id,
        attemptNumber: invoice.attempt_count || 0,
      });
    } catch (error) {
      logger.error('Manual retry failed', { error, invoiceId });
      throw error;
    }
  }

  /**
   * Get retry statistics
   */
  async getRetryStatistics(): Promise<{
    pendingRetries: number;
    successRate: number;
    averageAttemptsToSuccess: number;
  }> {
    try {
      const [waiting, completed, failed] = await Promise.all([
        this.retryQueue.getWaitingCount(),
        this.retryQueue.getCompletedCount(),
        this.retryQueue.getFailedCount(),
      ]);

      const successRate =
        completed + failed > 0 ? (completed / (completed + failed)) * 100 : 0;

      return {
        pendingRetries: waiting,
        successRate: parseFloat(successRate.toFixed(2)),
        averageAttemptsToSuccess: 1.5, // Placeholder - would need to calculate from job data
      };
    } catch (error) {
      logger.error('Failed to get retry statistics', { error });
      return {
        pendingRetries: 0,
        successRate: 0,
        averageAttemptsToSuccess: 0,
      };
    }
  }
}

export const paymentRetryService = new PaymentRetryService();
