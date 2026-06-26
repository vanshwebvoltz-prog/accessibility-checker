/**
 * networkCapture.js
 * Captures full network activity (requests, responses, timing, sizes, headers)
 * for a Puppeteer page using the Chrome DevTools Protocol (CDP) directly.
 *
 * Why CDP and not just page.on("request"/"response"):
 * - Puppeteer's high-level events don't expose timing breakdowns (DNS, connect,
 *   SSL, wait, receive) or exact encoded/transferred byte sizes.
 * - CDP's Network domain gives us Network.requestWillBeSent, Network.responseReceived,
 *   Network.loadingFinished, Network.loadingFailed with that level of detail.
 */

async function attachNetworkCapture(page) {
  const client = await page.target().createCDPSession();
  await client.send("Network.enable");

  // requestId -> accumulated record
  const records = new Map();

  client.on("Network.requestWillBeSent", (event) => {
    const { requestId, request, timestamp, type, initiator } = event;

    records.set(requestId, {
      requestId,
      url: request.url,
      method: request.method,
      requestHeaders: request.headers,
      resourceType: type || "Other",
      initiator: initiator?.type || "other",
      requestTimestamp: timestamp,
      status: null,
      statusText: null,
      responseHeaders: null,
      mimeType: null,
      remoteIP: null,
      protocol: null,
      encodedDataLength: 0,
      dataLength: 0,
      timing: null,
      failed: false,
      errorText: null,
      fromCache: false,
      finishedTimestamp: null,
    });
  });

  client.on("Network.responseReceived", (event) => {
    const { requestId, response, timestamp } = event;
    const record = records.get(requestId);
    if (!record) return;

    record.status = response.status;
    record.statusText = response.statusText;
    record.responseHeaders = response.headers;
    record.mimeType = response.mimeType;
    record.remoteIP = response.remoteIPAddress || null;
    record.protocol = response.protocol || null;
    record.fromCache = !!response.fromDiskCache || !!response.fromServiceWorker;
    record.responseTimestamp = timestamp;

    // CDP timing object: dns, connect, ssl, send, wait, receive (relative offsets, ms)
    if (response.timing) {
      const t = response.timing;
      record.timing = {
        dns: diffMs(t.dnsStart, t.dnsEnd),
        connect: diffMs(t.connectStart, t.connectEnd),
        ssl: diffMs(t.sslStart, t.sslEnd),
        send: diffMs(t.sendStart, t.sendEnd),
        wait: diffMs(t.sendEnd, t.receiveHeadersEnd),
        receiveHeadersEnd: t.receiveHeadersEnd,
        requestTime: t.requestTime,
      };
    }
  });

  client.on("Network.dataReceived", (event) => {
    const record = records.get(event.requestId);
    if (!record) return;
    record.encodedDataLength += event.encodedDataLength || 0;
    record.dataLength += event.dataLength || 0;
  });

  client.on("Network.loadingFinished", (event) => {
    const record = records.get(event.requestId);
    if (!record) return;
    record.encodedDataLength = event.encodedDataLength || record.encodedDataLength;
    record.finishedTimestamp = event.timestamp;
  });

  client.on("Network.loadingFailed", (event) => {
    const record = records.get(event.requestId);
    if (!record) return;
    record.failed = true;
    record.errorText = event.errorText;
    record.finishedTimestamp = event.timestamp;
  });

  function diffMs(start, end) {
    if (start == null || end == null || start < 0 || end < 0) return 0;
    return Math.round((end - start) * 100) / 100;
  }

  return {
    client,
    /** Call after page.goto resolves to get the finalized list of records */
    getRecords() {
      return Array.from(records.values()).map((r) => {
        const totalDurationMs =
          r.finishedTimestamp != null && r.requestTimestamp != null
            ? Math.round((r.finishedTimestamp - r.requestTimestamp) * 1000)
            : null;

        return {
          ...r,
          totalDurationMs,
        };
      });
    },
    /** Build summary stats across all captured records */
    getSummary(allRecords) {
      const total = allRecords.length;
      const failed = allRecords.filter((r) => r.failed);
      const byStatus = {};
      const byType = {};
      let totalBytes = 0;
      let slowest = null;

      for (const r of allRecords) {
        const statusBucket = r.status
          ? `${Math.floor(r.status / 100)}xx`
          : "no-response";
        byStatus[statusBucket] = (byStatus[statusBucket] || 0) + 1;

        byType[r.resourceType] = (byType[r.resourceType] || 0) + 1;

        totalBytes += r.encodedDataLength || 0;

        if (
          r.totalDurationMs != null &&
          (!slowest || r.totalDurationMs > slowest.totalDurationMs)
        ) {
          slowest = { url: r.url, totalDurationMs: r.totalDurationMs };
        }
      }

      return {
        totalRequests: total,
        failedRequests: failed.length,
        failedUrls: failed.map((r) => ({ url: r.url, errorText: r.errorText })),
        statusBreakdown: byStatus,
        resourceTypeBreakdown: byType,
        totalTransferredBytes: totalBytes,
        totalTransferredKB: Math.round((totalBytes / 1024) * 100) / 100,
        slowestRequest: slowest,
      };
    },
    async detach() {
      try {
        await client.send("Network.disable");
        await client.detach();
      } catch {
        // session may already be gone if page closed
      }
    },
  };
}

module.exports = { attachNetworkCapture };