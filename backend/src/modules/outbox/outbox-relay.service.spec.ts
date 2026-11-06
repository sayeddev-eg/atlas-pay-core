import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OutboxRelayService } from './outbox-relay.service.js';

describe('OutboxRelayService (Reliable Event Dispatcher)', () => {
  let outboxRelay: OutboxRelayService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $queryRaw: vi.fn(),
      outboxEvent: {
        update: vi.fn(),
      },
    };
    outboxRelay = new OutboxRelayService(mockPrisma);
  });

  it('should return safely if no pending events exist', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([]);

    await outboxRelay.relayPendingEvents();

    expect(mockPrisma.outboxEvent.update).not.toHaveBeenCalled();
  });

  it('should process pending events and mark them as PROCESSED', async () => {
    const pendingEvents = [
      {
        id: 'outbox-1',
        event_type: 'TRANSFER_COMPLETED',
        aggregate_id: 'agg-1',
        payload: { amount: '1000' },
        retry_count: 0,
      },
    ];

    mockPrisma.$queryRaw.mockResolvedValue(pendingEvents);
    mockPrisma.outboxEvent.update.mockResolvedValue({});

    await outboxRelay.relayPendingEvents();

    expect(mockPrisma.outboxEvent.update).toHaveBeenCalledWith({
      where: { id: 'outbox-1' },
      data: {
        status: 'PROCESSED',
        processedAt: expect.any(Date),
      },
    });
  });

  it('should increment retryCount and mark as FAILED when retries reach 3', async () => {
    const failingEvent = {
      id: 'outbox-fail',
      event_type: 'TRANSFER_COMPLETED',
      aggregate_id: 'agg-2',
      payload: {},
      retry_count: 2, // 2 previous failures, this will be 3rd
    };

    mockPrisma.$queryRaw.mockResolvedValue([failingEvent]);
    // Force an error inside the event loop
    mockPrisma.outboxEvent.update
      .mockRejectedValueOnce(new Error('Broker unreachable'))
      .mockResolvedValueOnce({});

    await outboxRelay.relayPendingEvents();

    expect(mockPrisma.outboxEvent.update).toHaveBeenCalledWith({
      where: { id: 'outbox-fail' },
      data: {
        retryCount: 3,
        status: 'FAILED',
      },
    });
  });
});
