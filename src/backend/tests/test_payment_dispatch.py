import asyncio
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch
from uuid import uuid4

import httpx

from src.backend.payment_dispatch import dispatch_event


class DispatchTests(unittest.IsolatedAsyncioTestCase):
    async def publish(self, handler, *, timeout=2):
        settings = SimpleNamespace(cloudflare_account_id='a'*32, cloudflare_queue_id='b'*32,
                                   cloudflare_queue_token='c'*32)
        job_id, record_id, token = uuid4(), uuid4(), uuid4()
        dispatch = Mock()
        dispatch._claim.return_value = ([job_id], token)
        client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        with patch('src.backend.payment_dispatch.InquiryDispatch', return_value=dispatch):
            with patch('src.backend.payment_dispatch.httpx.AsyncClient', return_value=client):
                with patch('src.backend.payment_dispatch.PUBLICATION_TIMEOUT', timeout):
                    await dispatch_event(object(), settings, record_id)
        dispatch._claim.assert_called_once_with(record_id)
        return dispatch, job_id, token

    async def test_records_queue_acceptance_and_sends_only_opaque_job(self):
        import json
        captured = []
        def handler(request):
            captured.append(json.loads(request.content))
            return httpx.Response(200, json={'success': True, 'errors': []})
        dispatch, job_id, token = await self.publish(handler)
        dispatch._record.assert_called_once_with([job_id], token, True)
        self.assertEqual(captured, [{'messages': [{'body': {'job_id': str(job_id),
            'kind': 'payment_event', 'environment': 'production'}, 'content_type': 'json'}]}])

    async def test_timeout_retains_job_for_recovery(self):
        async def handler(request):
            await asyncio.sleep(1)
            return httpx.Response(200, json={'success': True})
        dispatch, job_id, token = await self.publish(handler, timeout=.01)
        dispatch._record.assert_called_once_with([job_id], token, False)

    async def test_rejected_redirect_and_oversized_responses_are_not_acceptance(self):
        for response in (httpx.Response(302, headers={'Location': 'https://example.invalid'}),
                         httpx.Response(200, content=b'x'*16385),
                         httpx.Response(200, json={'success': False})):
            with self.subTest(status=response.status_code, size=len(response.content)):
                dispatch, job_id, token = await self.publish(lambda request: response)
                dispatch._record.assert_called_once_with([job_id], token, False)
