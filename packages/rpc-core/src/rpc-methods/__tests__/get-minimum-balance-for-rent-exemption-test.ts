import { createHttpTransport, createJsonRpc } from '@solana/rpc-transport';
import type { Rpc } from '@solana/rpc-transport/dist/types/json-rpc-types';
import fetchMock from 'jest-fetch-mock-fork';

import { Commitment } from '../../commitment';
import { createSolanaRpcApi, SolanaRpcMethods } from '../index';

describe('getMinimumBalanceForRentExemption', () => {
    let rpc: Rpc<SolanaRpcMethods>;
    beforeEach(() => {
        fetchMock.resetMocks();
        fetchMock.dontMock();
        rpc = createJsonRpc<SolanaRpcMethods>({
            api: createSolanaRpcApi(),
            transport: createHttpTransport({ url: 'http://127.0.0.1:8899' }),
        });
    });

    (['confirmed', 'finalized', 'processed'] as Commitment[]).forEach(commitment => {
        describe(`when called with \`${commitment}\` commitment`, () => {
            it('returns an expected rent amount', async () => {
                expect.assertions(1);
                const result = await rpc.getMinimumBalanceForRentExemption(BigInt(0), { commitment }).send();
                expect(result).toEqual(BigInt(890880));
            });
        });
    });
});
