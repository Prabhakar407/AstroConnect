"""Prompt payment dispatch through the existing queue and SQL delivery jobs."""
import asyncio
import logging

import httpx
from starlette.concurrency import run_in_threadpool

from .inquiry_dispatch import ENVIRONMENT, InquiryDispatch, queue_configured

logger = logging.getLogger(__name__)
PUBLICATION_TIMEOUT = 2


async def dispatch_event(store, settings, record_id):
    # The job is already committed. No payment-provider call occurs in the
    # webhook request. A queue outage leaves the same job available for recovery.
    if not queue_configured(settings):
        return
    dispatch = InquiryDispatch(store, settings, kind='payment_event')
    ids, token = await run_in_threadpool(dispatch._claim, record_id)
    if not ids:
        return
    accepted = False
    try:
        # A total elapsed deadline, including streamed response bytes; a socket
        # timeout alone would let a slow stream exceed Razorpay's ACK window.
        async with asyncio.timeout(PUBLICATION_TIMEOUT):
            async with httpx.AsyncClient(timeout=2, follow_redirects=False) as client:
                url = (f'https://api.cloudflare.com/client/v4/accounts/{settings.cloudflare_account_id}'
                       f'/queues/{settings.cloudflare_queue_id}/messages/batch')
                messages = [{'body': {'job_id': str(job), 'kind': 'payment_event',
                                      'environment': ENVIRONMENT}, 'content_type': 'json'} for job in ids]
                async with client.stream('POST', url,
                        headers={'Authorization': f'Bearer {settings.cloudflare_queue_token}'},
                        json={'messages': messages}) as response:
                    if response.status_code != 200:
                        return
                    raw = bytearray()
                    async for chunk in response.aiter_bytes():
                        raw.extend(chunk)
                        if len(raw) > 16384:
                            return
                    import json
                    result = json.loads(raw)
                    accepted = isinstance(result, dict) and result.get('success') is True and not result.get('errors')
    except (TimeoutError, httpx.HTTPError, ValueError):
        logger.warning('payment_dispatch_pending_recovery')
    finally:
        await run_in_threadpool(dispatch._record, ids, token, accepted)
