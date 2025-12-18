import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendMultiChannelNotification } from "./notifications";

global.fetch = vi.fn();

describe("sendMultiChannelNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_SLACK_WEBHOOK_URL", "https://hooks.slack.com/test");
    vi.stubEnv("VITE_ADMIN_API_URL", "http://localhost:4000");
  });

  it("should send Slack notification successfully", async () => {
    const mockFetch = global.fetch as any;
    mockFetch.mockResolvedValueOnce({
      type: "opaque",
      ok: true,
    });

    const result = await sendMultiChannelNotification({
      customerName: "Test User",
      customerEmail: "test@example.com",
      source: "contact_form",
      subject: "Test Subject",
      message: "Test message",
    });

    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://hooks.slack.com/test",
      expect.objectContaining({
        method: "POST",
        mode: "no-cors",
      })
    );
  });

  it("should fallback to admin API when Slack fails", async () => {
    const mockFetch = global.fetch as any;
    mockFetch.mockRejectedValueOnce(new Error("Slack error"));

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, channels: ["telegram"] }),
    });

    const result = await sendMultiChannelNotification({
      customerName: "Test User",
      customerEmail: "test@example.com",
      source: "contact_form",
      subject: "Test Subject",
      message: "Test message",
    });

    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/notifications/fallback",
      expect.objectContaining({
        method: "POST",
      })
    );
  });

  it("should format contact form Slack message correctly", async () => {
    const mockFetch = global.fetch as any;
    mockFetch.mockResolvedValueOnce({
      type: "opaque",
      ok: true,
    });

    await sendMultiChannelNotification({
      customerName: "John Doe",
      customerEmail: "john@example.com",
      customerPhone: "+971 50 123 4567",
      source: "contact_form",
      subject: "Investment Inquiry",
      message: "Interested in Dubai properties",
      department: "Sales",
    });

    const callArg = mockFetch.mock.calls[0][1];
    const body = JSON.parse(callArg.body);

    expect(body.text).toContain("Contact Form");
    expect(body.blocks[0].text.text).toContain("Contact Form");
    expect(body.blocks[1].fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ text: expect.stringContaining("John Doe") }),
        expect.objectContaining({ text: expect.stringContaining("Sales") }),
      ])
    );
  });

  it("should format property inquiry Slack message correctly", async () => {
    const mockFetch = global.fetch as any;
    mockFetch.mockResolvedValueOnce({
      type: "opaque",
      ok: true,
    });

    await sendMultiChannelNotification({
      customerName: "Jane Smith",
      customerEmail: "jane@example.com",
      source: "property_inquiry",
      propertyTitle: "Luxury 2BR Apartment",
      propertyUrl: "http://localhost:8080/property/123",
      message: "I'd like to schedule a viewing",
    });

    const callArg = mockFetch.mock.calls[0][1];
    const body = JSON.parse(callArg.body);

    expect(body.text).toContain("Property Inquiry");
    expect(body.blocks[0].text.text).toContain("Property Inquiry");
    expect(body.blocks[1].fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: expect.stringContaining("Luxury 2BR Apartment"),
        }),
      ])
    );
    expect(body.blocks[3].elements).toHaveLength(2);
  });

  it("should return failure when all channels fail", async () => {
    const mockFetch = global.fetch as any;
    mockFetch.mockRejectedValue(new Error("Network error"));

    const result = await sendMultiChannelNotification({
      customerName: "Test User",
      source: "contact_form",
      subject: "Test",
      message: "Test",
    });

    expect(result.success).toBe(false);
  });

  it("should skip Slack when not configured", async () => {
    vi.stubEnv("VITE_SLACK_WEBHOOK_URL", "");

    const mockFetch = global.fetch as any;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await sendMultiChannelNotification({
      customerName: "Test User",
      source: "contact_form",
      subject: "Test",
      message: "Test",
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/notifications/fallback",
      expect.any(Object)
    );
  });
});
