import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import Stripe from "https://esm.sh/stripe@14.16.0?target=deno";

Deno.serve(async (req) => {
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Configurações do sistema ausentes no ambiente da Edge Function.");
    return new Response("Erro interno no servidor", { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2023-10-16",
  });

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Assinatura do Stripe ausente.", { status: 400 });
  }

  try {
    // 1. Obter o corpo bruto da requisição
    const body = await req.text();

    // 2. Construir o evento validando com a assinatura secreta do Stripe
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`[Stripe Webhook] Evento recebido: ${event.type}`);

    // Inicializar o cliente Supabase admin (ignora RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!userId) {
          console.error("[Webhook] Erro: client_reference_id (Supabase User ID) ausente na sessão.");
          break;
        }

        console.log(`[Webhook] Ativando assinatura premium para usuário ${userId}. Customer: ${customerId}, Subscription: ${subscriptionId}`);

        let status = "active";
        let trialEndsAt: Date | null = null;
        if (subscriptionId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            status = sub.status;
            if (sub.trial_end) {
              trialEndsAt = new Date(sub.trial_end * 1000);
            }
          } catch (subErr) {
            console.error("[Webhook] Erro ao buscar detalhes da assinatura do Stripe:", subErr);
          }
        }

        const isPremiumActive = status === "active" || status === "trialing";

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            is_premium: isPremiumActive,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: status,
            trial_ends_at: trialEndsAt ? trialEndsAt.toISOString() : null,
          })
          .eq("id", userId);

        if (error) {
          console.error(`[Webhook] Erro ao atualizar perfil do usuário ${userId}:`, error);
          return new Response("Erro ao atualizar banco", { status: 500 });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const subscriptionId = subscription.id;

        console.log(`[Webhook] Assinatura cancelada/excluída: ${subscriptionId}. Desativando premium do cliente ${customerId}.`);

        // Busca o perfil correspondente a este cliente do Stripe ou ID da assinatura
        const { data: profile, error: findError } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (findError) {
          console.error(`[Webhook] Erro ao buscar perfil para customer ${customerId}:`, findError);
          break;
        }

        if (profile) {
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({
              is_premium: false,
              stripe_subscription_id: null,
              subscription_status: "canceled",
              trial_ends_at: null,
            })
            .eq("id", profile.id);

          if (error) {
            console.error(`[Webhook] Erro ao atualizar perfil do usuário ${profile.id}:`, error);
            return new Response("Erro ao atualizar banco", { status: 500 });
          }
        } else {
          console.warn(`[Webhook] Perfil não encontrado para o Stripe Customer ID: ${customerId}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const subscriptionId = subscription.id;
        const status = subscription.status;

        console.log(`[Webhook] Assinatura atualizada: ${subscriptionId}. Status: ${status}`);

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (profile) {
          const isPremiumActive = status === "active" || status === "trialing";
          let trialEndsAt: Date | null = null;
          if (subscription.trial_end) {
            trialEndsAt = new Date(subscription.trial_end * 1000);
          }
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({
              is_premium: isPremiumActive,
              stripe_subscription_id: isPremiumActive ? subscriptionId : null,
              subscription_status: status,
              trial_ends_at: trialEndsAt ? trialEndsAt.toISOString() : null,
            })
            .eq("id", profile.id);

          if (error) {
            console.error(`[Webhook] Erro ao atualizar perfil do usuário ${profile.id} na atualização de assinatura:`, error);
            return new Response("Erro ao atualizar banco", { status: 500 });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        console.log(`[Webhook] Falha de pagamento de fatura recebida para customer ${customerId}. Desativando premium.`);

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (profile) {
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({
              is_premium: false,
              subscription_status: "past_due",
            })
            .eq("id", profile.id);

          if (error) {
            console.error(`[Webhook] Erro ao desativar premium do usuário ${profile.id} após falha de fatura:`, error);
            return new Response("Erro ao atualizar banco", { status: 500 });
          }
        }
        break;
      }

      default:
        console.log(`[Webhook] Evento não processado explicitamente: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[Webhook] Erro ao processar requisição do Stripe:", err);
    return new Response(`Erro de webhook do Stripe: ${err instanceof Error ? err.message : "Erro desconhecido"}`, {
      status: 400,
    });
  }
});
