// Stripe Webhook Handler Edge Function
// Handles Stripe webhook events for subscription and payment management

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 });
  }

  try {
    const body = await req.text();
    const receivedEvent = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`Received event: ${receivedEvent.type}`);

    // Handle different event types
    switch (receivedEvent.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(receivedEvent.data.object, supabaseAdmin);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(receivedEvent.data.object, supabaseAdmin);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(receivedEvent.data.object, supabaseAdmin);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(receivedEvent.data.object, supabaseAdmin);
        break;

      case 'customer.created':
        await handleCustomerCreated(receivedEvent.data.object, supabaseAdmin);
        break;

      case 'payment_method.attached':
        await handlePaymentMethodAttached(receivedEvent.data.object, supabaseAdmin);
        break;

      default:
        console.log(`Unhandled event type: ${receivedEvent.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(
      JSON.stringify({
        error: 'Webhook Error',
        message: err instanceof Error ? err.message : 'Unknown error',
      }),
      { status: 400 }
    );
  }
});

async function handleSubscriptionUpdate(subscription: any, supabase: any) {
  const { customer, id, status, current_period_start, current_period_end, items, trial_start, trial_end, canceled_at, cancel_at_period_end } = subscription;

  // Get organization by Stripe customer ID
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('stripe_customer_id', customer)
    .single();

  if (orgError || !organization) {
    console.error('Organization not found for customer:', customer);
    return;
  }

  // Get subscription plan by Stripe price ID
  const priceId = items.data[0]?.price.id;
  const { data: plan, error: planError } = await supabase
    .from('subscription_plans')
    .select('id')
    .eq('stripe_price_id', priceId)
    .single();

  if (planError || !plan) {
    console.error('Subscription plan not found for price:', priceId);
    return;
  }

  // Upsert subscription
  const { error: subError } = await supabase.from('subscriptions').upsert(
    {
      organization_id: organization.id,
      subscription_plan_id: plan.id,
      stripe_subscription_id: id,
      stripe_customer_id: customer,
      status,
      current_period_start: new Date(current_period_start * 1000).toISOString(),
      current_period_end: new Date(current_period_end * 1000).toISOString(),
      trial_start: trial_start ? new Date(trial_start * 1000).toISOString() : null,
      trial_end: trial_end ? new Date(trial_end * 1000).toISOString() : null,
      canceled_at: canceled_at ? new Date(canceled_at * 1000).toISOString() : null,
      cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'organization_id' }
  );

  if (subError) {
    console.error('Failed to update subscription:', subError);
    return;
  }

  // Log subscription history
  await supabase.from('subscription_history').insert({
    organization_id: organization.id,
    event_type: status === 'active' ? 'created' : 'updated',
    new_plan_id: plan.id,
    new_status: status,
  });

  console.log(`Subscription ${id} updated for organization ${organization.id}`);
}

async function handleSubscriptionDeleted(subscription: any, supabase: any) {
  const { customer, id } = subscription;

  // Get organization
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('stripe_customer_id', customer)
    .single();

  if (orgError || !organization) {
    console.error('Organization not found for customer:', customer);
    return;
  }

  // Update subscription status
  const { error: subError } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', id);

  if (subError) {
    console.error('Failed to update subscription:', subError);
    return;
  }

  // Log subscription history
  await supabase.from('subscription_history').insert({
    organization_id: organization.id,
    event_type: 'canceled',
    new_status: 'canceled',
  });

  console.log(`Subscription ${id} canceled for organization ${organization.id}`);
}

async function handlePaymentSucceeded(invoice: any, supabase: any) {
  const { customer, id, amount_paid, currency, status, hosted_invoice_url, invoice_pdf, subscription } = invoice;

  // Get organization
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('stripe_customer_id', customer)
    .single();

  if (orgError || !organization) {
    console.error('Organization not found for customer:', customer);
    return;
  }

  // Get subscription record
  const { data: subRecord } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription)
    .single();

  // Create or update invoice
  const { error: invoiceError } = await supabase.from('invoices').upsert(
    {
      organization_id: organization.id,
      subscription_id: subRecord?.id,
      stripe_invoice_id: id,
      invoice_number: invoice.number,
      amount_due_cents: invoice.amount_due,
      amount_paid_cents: amount_paid,
      currency,
      status,
      invoice_date: new Date(invoice.created * 1000).toISOString(),
      paid_at: new Date().toISOString(),
      hosted_invoice_url,
      invoice_pdf_url: invoice_pdf,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_invoice_id' }
  );

  if (invoiceError) {
    console.error('Failed to create invoice:', invoiceError);
    return;
  }

  console.log(`Payment succeeded for invoice ${id}`);
}

async function handlePaymentFailed(invoice: any, supabase: any) {
  const { customer, id, subscription } = invoice;

  // Get organization
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('stripe_customer_id', customer)
    .single();

  if (orgError || !organization) {
    console.error('Organization not found for customer:', customer);
    return;
  }

  // Update subscription status to past_due
  const { error: subError } = await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription);

  if (subError) {
    console.error('Failed to update subscription:', subError);
  }

  // Log subscription history
  await supabase.from('subscription_history').insert({
    organization_id: organization.id,
    event_type: 'payment_failed',
    new_status: 'past_due',
    reason: 'Payment failed',
  });

  console.log(`Payment failed for invoice ${id}`);
}

async function handleCustomerCreated(customer: any, supabase: any) {
  const { id, email, metadata } = customer;

  if (metadata?.organization_id) {
    // Update organization with Stripe customer ID
    const { error } = await supabase
      .from('organizations')
      .update({ stripe_customer_id: id })
      .eq('id', metadata.organization_id);

    if (error) {
      console.error('Failed to update organization:', error);
      return;
    }

    console.log(`Customer ${id} linked to organization ${metadata.organization_id}`);
  }
}

async function handlePaymentMethodAttached(paymentMethod: any, supabase: any) {
  const { id, customer, card, type } = paymentMethod;

  if (type !== 'card') return;

  // Get organization
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('stripe_customer_id', customer)
    .single();

  if (orgError || !organization) {
    console.error('Organization not found for customer:', customer);
    return;
  }

  // Create payment method record
  const { error: pmError } = await supabase.from('payment_methods').insert({
    organization_id: organization.id,
    stripe_payment_method_id: id,
    card_brand: card.brand,
    card_last4: card.last4,
    card_exp_month: card.exp_month,
    card_exp_year: card.exp_year,
    is_default: true, // Assume new payment method is default
  });

  if (pmError) {
    console.error('Failed to create payment method:', pmError);
    return;
  }

  console.log(`Payment method ${id} attached for organization ${organization.id}`);
}
