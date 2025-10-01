/**
 * Enterprise Features Service
 * Handles custom pricing, volume discounts, and multi-tenant billing
 */

import { supabase } from '../config/supabase.config';
import { stripeService } from './stripe.service';
import { logger } from '../utils/logger';
import type {
  EnterprisePricing,
  VolumeDiscountRule,
  BillingCycle,
} from '../types/billing.types';

export class EnterpriseService {
  /**
   * Create custom enterprise pricing
   */
  async createEnterprisePricing(params: {
    customerId: string;
    basePriceCents: number;
    billingCycle: BillingCycle;
    customLimits?: {
      storageGb?: number;
      apiRequestsPerMonth?: number;
      pdfOverlaysPerMonth?: number;
      teamMembersLimit?: number;
    };
    volumeDiscounts?: VolumeDiscountRule[];
    contractStartDate: Date;
    contractEndDate: Date;
    autoRenew?: boolean;
    supportLevel?: 'enterprise' | 'premium' | 'dedicated';
    notes?: string;
  }): Promise<EnterprisePricing> {
    try {
      const { data: pricing, error } = await supabase
        .from('enterprise_pricing')
        .insert({
          customer_id: params.customerId,
          base_price_cents: params.basePriceCents,
          billing_cycle: params.billingCycle,
          storage_gb: params.customLimits?.storageGb,
          api_requests_per_month: params.customLimits?.apiRequestsPerMonth,
          pdf_overlays_per_month: params.customLimits?.pdfOverlaysPerMonth,
          team_members_limit: params.customLimits?.teamMembersLimit,
          volume_discount_rules: params.volumeDiscounts || [],
          contract_start_date: params.contractStartDate.toISOString().split('T')[0],
          contract_end_date: params.contractEndDate.toISOString().split('T')[0],
          auto_renew: params.autoRenew ?? false,
          support_level: params.supportLevel || 'enterprise',
          notes: params.notes,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info('Enterprise pricing created', {
        customerId: params.customerId,
        pricingId: pricing.id,
      });

      return pricing as EnterprisePricing;
    } catch (error) {
      logger.error('Failed to create enterprise pricing', { error, params });
      throw error;
    }
  }

  /**
   * Update enterprise pricing
   */
  async updateEnterprisePricing(
    pricingId: string,
    updates: Partial<EnterprisePricing>
  ): Promise<EnterprisePricing> {
    try {
      const { data: pricing, error } = await supabase
        .from('enterprise_pricing')
        .update(updates)
        .eq('id', pricingId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info('Enterprise pricing updated', { pricingId });

      return pricing as EnterprisePricing;
    } catch (error) {
      logger.error('Failed to update enterprise pricing', { error, pricingId });
      throw error;
    }
  }

  /**
   * Calculate volume discount
   */
  calculateVolumeDiscount(params: {
    baseAmount: number;
    quantity: number;
    discountRules: VolumeDiscountRule[];
  }): {
    originalAmount: number;
    discountedAmount: number;
    discountPercent: number;
    discountAmount: number;
  } {
    let applicableDiscount = 0;

    // Find the highest applicable discount
    for (const rule of params.discountRules) {
      if (params.quantity >= rule.threshold) {
        applicableDiscount = Math.max(applicableDiscount, rule.discount_percent);
      }
    }

    const discountAmount = Math.round(
      (params.baseAmount * applicableDiscount) / 100
    );
    const discountedAmount = params.baseAmount - discountAmount;

    return {
      originalAmount: params.baseAmount,
      discountedAmount,
      discountPercent: applicableDiscount,
      discountAmount,
    };
  }

  /**
   * Apply volume discount to invoice
   */
  async applyVolumeDiscount(params: {
    customerId: string;
    invoiceId: string;
    quantity: number;
  }): Promise<void> {
    try {
      // Get enterprise pricing
      const { data: pricing } = await supabase
        .from('enterprise_pricing')
        .select('*')
        .eq('customer_id', params.customerId)
        .eq('is_active', true)
        .single();

      if (!pricing || pricing.volume_discount_rules.length === 0) {
        return;
      }

      // Get invoice
      const { data: invoice } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', params.invoiceId)
        .single();

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Calculate discount
      const discount = this.calculateVolumeDiscount({
        baseAmount: invoice.subtotal_cents,
        quantity: params.quantity,
        discountRules: pricing.volume_discount_rules,
      });

      if (discount.discountAmount > 0) {
        // Update invoice with discount
        await supabase
          .from('invoices')
          .update({
            discount_cents: discount.discountAmount,
            total_cents: invoice.subtotal_cents - discount.discountAmount + invoice.tax_cents,
            amount_due_cents: invoice.subtotal_cents - discount.discountAmount + invoice.tax_cents - invoice.amount_paid_cents,
          })
          .eq('id', params.invoiceId);

        // Add discount line item
        await supabase.from('invoice_line_items').insert({
          invoice_id: params.invoiceId,
          description: `Volume discount (${discount.discountPercent}% for ${params.quantity} units)`,
          quantity: 1,
          unit_amount_cents: -discount.discountAmount,
          amount_cents: -discount.discountAmount,
          item_type: 'discount',
        });

        logger.info('Volume discount applied', {
          invoiceId: params.invoiceId,
          discountAmount: discount.discountAmount,
          discountPercent: discount.discountPercent,
        });
      }
    } catch (error) {
      logger.error('Failed to apply volume discount', { error, params });
    }
  }

  /**
   * Get enterprise pricing for customer
   */
  async getEnterprisePricing(customerId: string): Promise<EnterprisePricing | null> {
    try {
      const { data: pricing, error } = await supabase
        .from('enterprise_pricing')
        .select('*')
        .eq('customer_id', customerId)
        .eq('is_active', true)
        .single();

      if (error || !pricing) {
        return null;
      }

      return pricing as EnterprisePricing;
    } catch (error) {
      logger.error('Failed to get enterprise pricing', { error, customerId });
      return null;
    }
  }

  /**
   * Check if contract is expiring soon
   */
  async getExpiringContracts(daysAhead: number = 30): Promise<EnterprisePricing[]> {
    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + daysAhead);

      const { data: contracts, error } = await supabase
        .from('enterprise_pricing')
        .select('*')
        .eq('is_active', true)
        .lte('contract_end_date', expirationDate.toISOString().split('T')[0])
        .gte('contract_end_date', new Date().toISOString().split('T')[0]);

      if (error) {
        throw error;
      }

      return contracts as EnterprisePricing[];
    } catch (error) {
      logger.error('Failed to get expiring contracts', { error });
      return [];
    }
  }

  /**
   * Renew enterprise contract
   */
  async renewContract(params: {
    pricingId: string;
    newEndDate: Date;
    newBasePriceCents?: number;
    updateLimits?: Partial<{
      storageGb: number;
      apiRequestsPerMonth: number;
      pdfOverlaysPerMonth: number;
      teamMembersLimit: number;
    }>;
  }): Promise<EnterprisePricing> {
    try {
      const updates: any = {
        contract_end_date: params.newEndDate.toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      };

      if (params.newBasePriceCents) {
        updates.base_price_cents = params.newBasePriceCents;
      }

      if (params.updateLimits) {
        if (params.updateLimits.storageGb !== undefined) {
          updates.storage_gb = params.updateLimits.storageGb;
        }
        if (params.updateLimits.apiRequestsPerMonth !== undefined) {
          updates.api_requests_per_month = params.updateLimits.apiRequestsPerMonth;
        }
        if (params.updateLimits.pdfOverlaysPerMonth !== undefined) {
          updates.pdf_overlays_per_month = params.updateLimits.pdfOverlaysPerMonth;
        }
        if (params.updateLimits.teamMembersLimit !== undefined) {
          updates.team_members_limit = params.updateLimits.teamMembersLimit;
        }
      }

      const { data: pricing, error } = await supabase
        .from('enterprise_pricing')
        .update(updates)
        .eq('id', params.pricingId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info('Enterprise contract renewed', {
        pricingId: params.pricingId,
        newEndDate: params.newEndDate,
      });

      return pricing as EnterprisePricing;
    } catch (error) {
      logger.error('Failed to renew enterprise contract', { error, params });
      throw error;
    }
  }

  /**
   * Multi-tenant billing: Calculate and split costs
   */
  async calculateMultiTenantBilling(params: {
    parentCustomerId: string;
    tenantUsage: Array<{
      tenantId: string;
      storageGb: number;
      apiRequests: number;
      pdfOverlays: number;
    }>;
  }): Promise<{
    totalAmount: number;
    tenantAllocations: Array<{
      tenantId: string;
      amount: number;
      breakdown: {
        storage: number;
        apiRequests: number;
        pdfOverlays: number;
      };
    }>;
  }> {
    try {
      // Get enterprise pricing
      const pricing = await this.getEnterprisePricing(params.parentCustomerId);

      if (!pricing) {
        throw new Error('Enterprise pricing not found');
      }

      const tenantAllocations: any[] = [];
      let totalAmount = 0;

      // Calculate per-unit costs
      const storageUnitCost = pricing.storage_gb
        ? pricing.base_price_cents / pricing.storage_gb / 100
        : 0;
      const apiUnitCost = pricing.api_requests_per_month
        ? pricing.base_price_cents / pricing.api_requests_per_month / 100
        : 0;
      const overlayUnitCost = pricing.pdf_overlays_per_month
        ? pricing.base_price_cents / pricing.pdf_overlays_per_month / 100
        : 0;

      // Calculate allocation for each tenant
      for (const tenant of params.tenantUsage) {
        const storageAmount = tenant.storageGb * storageUnitCost;
        const apiAmount = tenant.apiRequests * apiUnitCost;
        const overlayAmount = tenant.pdfOverlays * overlayUnitCost;

        const tenantTotal = Math.round(
          (storageAmount + apiAmount + overlayAmount) * 100
        );

        tenantAllocations.push({
          tenantId: tenant.tenantId,
          amount: tenantTotal,
          breakdown: {
            storage: Math.round(storageAmount * 100),
            apiRequests: Math.round(apiAmount * 100),
            pdfOverlays: Math.round(overlayAmount * 100),
          },
        });

        totalAmount += tenantTotal;
      }

      return {
        totalAmount,
        tenantAllocations,
      };
    } catch (error) {
      logger.error('Failed to calculate multi-tenant billing', { error, params });
      throw error;
    }
  }

  /**
   * Generate custom invoice for enterprise customer
   */
  async generateCustomInvoice(params: {
    customerId: string;
    lineItems: Array<{
      description: string;
      quantity: number;
      unitAmountCents: number;
    }>;
    dueDate: Date;
    notes?: string;
  }): Promise<void> {
    try {
      // Calculate totals
      let subtotal = 0;
      for (const item of params.lineItems) {
        subtotal += item.quantity * item.unitAmountCents;
      }

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          customer_id: params.customerId,
          status: 'open',
          subtotal_cents: subtotal,
          tax_cents: 0, // Calculate based on customer location
          discount_cents: 0,
          total_cents: subtotal,
          amount_due_cents: subtotal,
          currency: 'USD',
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: params.dueDate.toISOString().split('T')[0],
          period_start: new Date().toISOString(),
          period_end: params.dueDate.toISOString(),
          metadata: { custom_invoice: true, notes: params.notes },
        })
        .select()
        .single();

      if (invoiceError) {
        throw invoiceError;
      }

      // Add line items
      for (const item of params.lineItems) {
        await supabase.from('invoice_line_items').insert({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_amount_cents: item.unitAmountCents,
          amount_cents: item.quantity * item.unitAmountCents,
          item_type: 'one_time',
        });
      }

      logger.info('Custom invoice generated', {
        customerId: params.customerId,
        invoiceId: invoice.id,
      });
    } catch (error) {
      logger.error('Failed to generate custom invoice', { error, params });
      throw error;
    }
  }
}

export const enterpriseService = new EnterpriseService();
