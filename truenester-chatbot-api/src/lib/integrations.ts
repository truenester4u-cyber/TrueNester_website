/**
 * Integration Interfaces - WhatsApp & CRM
 * 
 * WHY: Future-ready design for paid service integrations.
 * - Interfaces defined now, implementations pluggable later
 * - Feature flags control activation
 * - No paid services integrated yet
 * - Zero refactoring needed when providers are added
 * 
 * USAGE:
 * 1. Set FEATURE_WHATSAPP_ENABLED=true in .env
 * 2. Implement the provider (e.g., Twilio, MessageBird)
 * 3. Register it with the integration manager
 */

import { logger, type LogContext } from "./logger";

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const featureFlags = {
  whatsappEnabled: process.env.FEATURE_WHATSAPP_ENABLED === "true",
  crmEnabled: process.env.FEATURE_CRM_ENABLED === "true",
  smsEnabled: process.env.FEATURE_SMS_ENABLED === "true",
};

// ============================================================================
// TYPES
// ============================================================================

export interface LeadData {
  conversationId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  intent?: string;
  budget?: string;
  propertyType?: string;
  preferredArea?: string;
  leadScore?: number;
  leadQuality?: string;
  source?: string;
  tags?: string[];
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface IntegrationResult {
  success: boolean;
  provider: string;
  externalId?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// WHATSAPP INTERFACE
// ============================================================================

export interface WhatsAppMessage {
  to: string;           // Phone number with country code
  template?: string;    // Template name for approved messages
  templateParams?: Record<string, string>;
  text?: string;        // For session messages
  mediaUrl?: string;    // Optional media attachment
}

export interface WhatsAppProvider {
  name: string;
  sendMessage(message: WhatsAppMessage): Promise<IntegrationResult>;
  sendTemplate(to: string, templateName: string, params: Record<string, string>): Promise<IntegrationResult>;
}

/**
 * Placeholder WhatsApp provider - logs but doesn't send
 * Replace with actual provider (Twilio, MessageBird, etc.)
 */
class PlaceholderWhatsAppProvider implements WhatsAppProvider {
  name = "placeholder";
  private logContext: LogContext = { channel: "whatsapp-placeholder" };

  async sendMessage(message: WhatsAppMessage): Promise<IntegrationResult> {
    logger.info("WhatsApp message would be sent (placeholder)", {
      ...this.logContext,
      to: message.to,
      hasTemplate: !!message.template,
    });

    return {
      success: true,
      provider: this.name,
      metadata: { placeholder: true, message },
    };
  }

  async sendTemplate(to: string, templateName: string, params: Record<string, string>): Promise<IntegrationResult> {
    logger.info("WhatsApp template would be sent (placeholder)", {
      ...this.logContext,
      to,
      templateName,
    });

    return {
      success: true,
      provider: this.name,
      metadata: { placeholder: true, templateName, params },
    };
  }
}

// ============================================================================
// CRM INTERFACE
// ============================================================================

export interface CRMContact {
  externalId?: string;
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

export interface CRMDeal {
  externalId?: string;
  contactId: string;
  title: string;
  value?: number;
  stage?: string;
  source?: string;
  customFields?: Record<string, unknown>;
}

export interface CRMProvider {
  name: string;
  createContact(contact: CRMContact): Promise<IntegrationResult>;
  updateContact(externalId: string, contact: Partial<CRMContact>): Promise<IntegrationResult>;
  createDeal(deal: CRMDeal): Promise<IntegrationResult>;
  updateDeal(externalId: string, deal: Partial<CRMDeal>): Promise<IntegrationResult>;
}

/**
 * Placeholder CRM provider - logs but doesn't sync
 * Replace with actual provider (HubSpot, Salesforce, Pipedrive, etc.)
 */
class PlaceholderCRMProvider implements CRMProvider {
  name = "placeholder";
  private logContext: LogContext = { channel: "crm-placeholder" };

  async createContact(contact: CRMContact): Promise<IntegrationResult> {
    logger.info("CRM contact would be created (placeholder)", {
      ...this.logContext,
      contactName: contact.name,
    });

    return {
      success: true,
      provider: this.name,
      externalId: `placeholder-${Date.now()}`,
      metadata: { placeholder: true, contact },
    };
  }

  async updateContact(externalId: string, contact: Partial<CRMContact>): Promise<IntegrationResult> {
    logger.info("CRM contact would be updated (placeholder)", {
      ...this.logContext,
      externalId,
    });

    return {
      success: true,
      provider: this.name,
      externalId,
      metadata: { placeholder: true, updates: contact },
    };
  }

  async createDeal(deal: CRMDeal): Promise<IntegrationResult> {
    logger.info("CRM deal would be created (placeholder)", {
      ...this.logContext,
      dealTitle: deal.title,
    });

    return {
      success: true,
      provider: this.name,
      externalId: `placeholder-deal-${Date.now()}`,
      metadata: { placeholder: true, deal },
    };
  }

  async updateDeal(externalId: string, deal: Partial<CRMDeal>): Promise<IntegrationResult> {
    logger.info("CRM deal would be updated (placeholder)", {
      ...this.logContext,
      externalId,
    });

    return {
      success: true,
      provider: this.name,
      externalId,
      metadata: { placeholder: true, updates: deal },
    };
  }
}

// ============================================================================
// INTEGRATION MANAGER
// ============================================================================

class IntegrationManager {
  private whatsappProvider: WhatsAppProvider;
  private crmProvider: CRMProvider;
  private logContext: LogContext = { channel: "integration-manager" };

  constructor() {
    // Initialize with placeholder providers
    this.whatsappProvider = new PlaceholderWhatsAppProvider();
    this.crmProvider = new PlaceholderCRMProvider();
  }

  /**
   * Register a WhatsApp provider
   */
  setWhatsAppProvider(provider: WhatsAppProvider): void {
    this.whatsappProvider = provider;
    logger.info(`WhatsApp provider registered: ${provider.name}`, this.logContext);
  }

  /**
   * Register a CRM provider
   */
  setCRMProvider(provider: CRMProvider): void {
    this.crmProvider = provider;
    logger.info(`CRM provider registered: ${provider.name}`, this.logContext);
  }

  /**
   * Send WhatsApp message to lead
   * Returns early if feature is disabled
   */
  async sendWhatsApp(lead: LeadData, message?: string): Promise<IntegrationResult | null> {
    if (!featureFlags.whatsappEnabled) {
      logger.debug("WhatsApp disabled, skipping", this.logContext);
      return null;
    }

    if (!lead.customerPhone) {
      logger.warn("No phone number for WhatsApp", {
        ...this.logContext,
        conversationId: lead.conversationId,
      });
      return { success: false, provider: this.whatsappProvider.name, error: "No phone number" };
    }

    try {
      // Use template for initial contact
      const result = await this.whatsappProvider.sendTemplate(
        lead.customerPhone,
        "lead_welcome",
        {
          name: lead.customerName,
          intent: lead.intent || "property inquiry",
        }
      );

      logger.info("WhatsApp sent", {
        ...this.logContext,
        conversationId: lead.conversationId,
        success: result.success,
      });

      return result;
    } catch (error) {
      logger.error(
        "WhatsApp send failed",
        error instanceof Error ? error : new Error(String(error)),
        { ...this.logContext, conversationId: lead.conversationId }
      );
      return {
        success: false,
        provider: this.whatsappProvider.name,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Push lead to CRM
   * Returns early if feature is disabled
   */
  async pushToCRM(lead: LeadData): Promise<IntegrationResult | null> {
    if (!featureFlags.crmEnabled) {
      logger.debug("CRM disabled, skipping", this.logContext);
      return null;
    }

    try {
      // Create contact
      const contactResult = await this.crmProvider.createContact({
        name: lead.customerName,
        email: lead.customerEmail,
        phone: lead.customerPhone,
        source: lead.source || "website-chatbot",
        tags: lead.tags,
        customFields: {
          conversationId: lead.conversationId,
          intent: lead.intent,
          budget: lead.budget,
          preferredArea: lead.preferredArea,
          leadScore: lead.leadScore,
          leadQuality: lead.leadQuality,
        },
      });

      if (!contactResult.success) {
        return contactResult;
      }

      // Create deal if we have budget info
      if (lead.budget && contactResult.externalId) {
        const dealResult = await this.crmProvider.createDeal({
          contactId: contactResult.externalId,
          title: `${lead.intent || "Property"} - ${lead.customerName}`,
          stage: lead.leadQuality === "hot" ? "qualified" : "new",
          source: lead.source,
          customFields: {
            budget: lead.budget,
            propertyType: lead.propertyType,
            preferredArea: lead.preferredArea,
          },
        });

        logger.info("CRM deal created", {
          ...this.logContext,
          conversationId: lead.conversationId,
          dealId: dealResult.externalId,
        });
      }

      logger.info("Lead pushed to CRM", {
        ...this.logContext,
        conversationId: lead.conversationId,
        contactId: contactResult.externalId,
      });

      return contactResult;
    } catch (error) {
      logger.error(
        "CRM push failed",
        error instanceof Error ? error : new Error(String(error)),
        { ...this.logContext, conversationId: lead.conversationId }
      );
      return {
        success: false,
        provider: this.crmProvider.name,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

// Singleton instance
export const integrationManager = new IntegrationManager();

// Types are already exported via interface declarations above
