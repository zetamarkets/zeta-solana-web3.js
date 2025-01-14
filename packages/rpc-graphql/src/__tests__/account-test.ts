import { createSolanaRpcApi, SolanaRpcMethods } from '@solana/rpc-core';
import { createHttpTransport, createJsonRpc } from '@solana/rpc-transport';
import { Rpc } from '@solana/rpc-transport/dist/types/json-rpc-types';
import fetchMock from 'jest-fetch-mock-fork';

import { createRpcGraphQL, RpcGraphQL } from '../rpc';

describe('account', () => {
    let rpc: Rpc<SolanaRpcMethods>;
    let rpcGraphQL: RpcGraphQL;
    beforeEach(() => {
        fetchMock.resetMocks();
        fetchMock.dontMock();
        rpc = createJsonRpc<SolanaRpcMethods>({
            api: createSolanaRpcApi(),
            transport: createHttpTransport({ url: 'http://127.0.0.1:8899' }),
        });
        rpcGraphQL = createRpcGraphQL(rpc);
    });

    describe('basic queries', () => {
        // See scripts/fixtures/spl-token-token-account.json
        const variableValues = {
            address: 'AyGCwnwxQMCqaU4ixReHt8h5W4dwmxU7eM3BEQBdWVca',
            commitment: 'confirmed',
        };
        it("can query an account's lamports balance", async () => {
            expect.assertions(1);
            const source = `
            query testQuery($address: String!) {
                account(address: $address) {
                    lamports
                }
            }
        `;
            const result = await rpcGraphQL.query(source, variableValues);
            expect(result).toMatchObject({
                data: {
                    account: {
                        lamports: 10290815n,
                    },
                },
            });
        });
        it("can query an account's executable value", async () => {
            expect.assertions(1);
            const source = `
            query testQuery($address: String!, $commitment: Commitment) {
                account(address: $address, commitment: $commitment) {
                    executable
                }
            }
        `;
            const result = await rpcGraphQL.query(source, variableValues);
            expect(result).toMatchObject({
                data: {
                    account: {
                        executable: false,
                    },
                },
            });
        });
        it('can query multiple fields', async () => {
            expect.assertions(1);
            const source = `
            query testQuery($address: String!, $commitment: Commitment) {
                account(address: $address, commitment: $commitment) {
                    executable
                    lamports
                    rentEpoch
                }
            }
        `;
            const result = await rpcGraphQL.query(source, variableValues);
            expect(result).toMatchObject({
                data: {
                    account: {
                        executable: false,
                        lamports: 10290815n,
                        rentEpoch: 0n,
                    },
                },
            });
        });
    });
    describe('nested basic queries', () => {
        // See scripts/fixtures/spl-token-token-account.json
        const variableValues = {
            address: 'AyGCwnwxQMCqaU4ixReHt8h5W4dwmxU7eM3BEQBdWVca',
            commitment: 'confirmed',
        };
        it("can perform a nested query for the account's owner", async () => {
            expect.assertions(1);
            const source = `
            query testQuery($address: String!, $commitment: Commitment) {
                account(address: $address, commitment: $commitment) {
                    owner {
                        executable
                        lamports
                        rentEpoch
                    }
                }
            }
        `;
            const result = await rpcGraphQL.query(source, variableValues);
            expect(result).toMatchObject({
                data: {
                    account: {
                        owner: {
                            executable: true,
                            lamports: expect.any(BigInt),
                            rentEpoch: expect.any(BigInt),
                        },
                    },
                },
            });
        });
    });
    describe('double nested basic queries', () => {
        // See scripts/fixtures/spl-token-token-account.json
        const variableValues = {
            address: 'AyGCwnwxQMCqaU4ixReHt8h5W4dwmxU7eM3BEQBdWVca',
            commitment: 'confirmed',
        };
        it("can perform a double nested query for each account's owner", async () => {
            expect.assertions(1);
            const source = `
            query testQuery($address: String!, $commitment: Commitment) {
                account(address: $address, commitment: $commitment) {
                    owner {
                        owner {
                            executable
                            lamports
                            rentEpoch
                        }
                    }
                }
            }
        `;
            const result = await rpcGraphQL.query(source, variableValues);
            expect(result).toMatchObject({
                data: {
                    account: {
                        owner: {
                            owner: {
                                executable: true,
                                lamports: expect.any(BigInt),
                                rentEpoch: expect.any(BigInt),
                            },
                        },
                    },
                },
            });
        });
    });
    describe('account data queries', () => {
        it('can get account data as base58', async () => {
            expect.assertions(1);
            // See scripts/fixtures/gpa1.json
            const variableValues = {
                address: 'CcYNb7WqpjaMrNr7B1mapaNfWctZRH7LyAjWRLBGt1Fk',
                encoding: 'base58',
            };
            const source = `
                query testQuery($address: String!, $encoding: AccountEncoding) {
                    account(address: $address, encoding: $encoding) {
                        ... on AccountBase58 {
                            data
                        }
                    }
                }
            `;
            const result = await rpcGraphQL.query(source, variableValues);
            expect(result).toMatchObject({
                data: {
                    account: {
                        data: '2Uw1bpnsXxu3e',
                    },
                },
            });
        });
        it('can get account data as base64', async () => {
            expect.assertions(1);
            // See scripts/fixtures/gpa1.json
            const variableValues = {
                address: 'CcYNb7WqpjaMrNr7B1mapaNfWctZRH7LyAjWRLBGt1Fk',
                encoding: 'base64',
            };
            const source = `
                query testQuery($address: String!, $encoding: AccountEncoding) {
                    account(address: $address, encoding: $encoding) {
                        ... on AccountBase64 {
                            data
                        }
                    }
                }
            `;
            const result = await rpcGraphQL.query(source, variableValues);
            expect(result).toMatchObject({
                data: {
                    account: {
                        data: 'dGVzdCBkYXRh',
                    },
                },
            });
        });
        it('can get account data as base64+zstd', async () => {
            expect.assertions(1);
            // See scripts/fixtures/gpa1.json
            const variableValues = {
                address: 'CcYNb7WqpjaMrNr7B1mapaNfWctZRH7LyAjWRLBGt1Fk',
                encoding: 'base64Zstd',
            };
            const source = `
                query testQuery($address: String!, $encoding: AccountEncoding) {
                    account(address: $address, encoding: $encoding) {
                        ... on AccountBase64Zstd {
                            data
                        }
                    }
                }
            `;
            const result = await rpcGraphQL.query(source, variableValues);
            expect(result).toMatchObject({
                data: {
                    account: {
                        data: 'KLUv/QBYSQAAdGVzdCBkYXRh',
                    },
                },
            });
        });
    });
    describe('nested account data queries', () => {
        it('can get nested account data as base64', async () => {
            expect.assertions(1);
            // See scripts/fixtures/spl-token-token-account.json
            const variableValues = {
                address: 'AyGCwnwxQMCqaU4ixReHt8h5W4dwmxU7eM3BEQBdWVca',
                encoding: 'base64',
            };
            const source = `
                    query testQuery($address: String!, $encoding: AccountEncoding) {
                        account(address: $address, encoding: $encoding) {
                            ... on AccountBase64 {
                                data
                                owner(encoding: $encoding) {
                                    ... on AccountBase64 {
                                        data
                                    }
                                }
                            }
                        }
                    }
                `;
            const result = await rpcGraphQL.query(source, variableValues);
            expect(result).toMatchObject({
                data: {
                    account: {
                        data: '6Sg5VQll/9TWSsqvRtRd9zGOW09XyQxIfWBiXYKbg3tRbfSo3iE5g7lQFUZzej7dXNBFemsx9mHsHQF64UlEQ+BvnGLyhiMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                        owner: {
                            data: expect.any(String),
                        },
                    },
                },
            });
        });
    });
    describe('specific account type queries', () => {
        it('can get a mint account', async () => {
            expect.assertions(1);
            // See scripts/fixtures/spl-token-mint-account.json
            const variableValues = {
                address: 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr',
            };
            const source = `
                query testQuery($address: String!) {
                    account(address: $address) {
                        ... on MintAccount {
                            data {
                                parsed {
                                    info {
                                        decimals
                                        isInitialized
                                        mintAuthority
                                        supply
                                    }
                                    type
                                }
                                program
                                space
                            }
                        }
                    }
                }
            `;
            const result = await rpcGraphQL.query(source, variableValues);
            expect(result).toMatchObject({
                data: {
                    account: {
                        data: {
                            parsed: {
                                info: {
                                    decimals: expect.any(Number),
                                    isInitialized: expect.any(Boolean),
                                    mintAuthority: expect.any(String),
                                    supply: expect.any(String),
                                },
                                type: 'mint',
                            },
                            program: 'spl-token',
                            space: 82n,
                        },
                    },
                },
            });
        });
        it('can get a token account', async () => {
            expect.assertions(1);
            // See scripts/fixtures/spl-token-token-account.json
            const variableValues = {
                address: 'AyGCwnwxQMCqaU4ixReHt8h5W4dwmxU7eM3BEQBdWVca',
            };
            const source = `
                query testQuery($address: String!) {
                    account(address: $address) {
                        ... on TokenAccount {
                            data {
                                parsed {
                                    info {
                                        isNative
                                        mint
                                        owner
                                        state
                                        tokenAmount {
                                            amount
                                            decimals
                                            uiAmount
                                            uiAmountString
                                        }
                                    }
                                    type
                                }
                                program
                                space
                            }
                        }
                    }
                }
            `;
            const result = await rpcGraphQL.query(source, variableValues);
            expect(result).toMatchObject({
                data: {
                    account: {
                        data: {
                            parsed: {
                                info: {
                                    isNative: expect.any(Boolean),
                                    mint: expect.any(String),
                                    owner: expect.any(String),
                                    state: expect.any(String),
                                    tokenAmount: {
                                        amount: expect.any(String),
                                        decimals: expect.any(Number),
                                        uiAmountString: expect.any(String),
                                    },
                                },
                                type: 'account',
                            },
                            program: 'spl-token',
                            space: 165n,
                        },
                    },
                },
            });
        });
        it('can get a nonce account', async () => {
            expect.assertions(1);
            // See scripts/fixtures/nonce-account.json
            const variableValues = {
                address: 'AiZExP8mK4RxDozh4r57knvqSZgkz86HrzPAMx61XMqU',
            };
            const source = `
                query testQuery($address: String!) {
                    account(address: $address) {
                        ... on NonceAccount {
                            data {
                                parsed {
                                    info {
                                        authority
                                        blockhash
                                        feeCalculator {
                                            lamportsPerSignature
                                        }
                                    }
                                    type
                                }
                                program
                                space
                            }
                        }
                    }
                }
            `;
            const result = await rpcGraphQL.query(source, variableValues);
            expect(result).toMatchObject({
                data: {
                    account: {
                        data: {
                            parsed: {
                                info: {
                                    authority: expect.any(String),
                                    blockhash: expect.any(String),
                                    feeCalculator: {
                                        lamportsPerSignature: expect.any(String),
                                    },
                                },
                                type: 'initialized',
                            },
                            program: 'nonce',
                            space: 80n,
                        },
                    },
                },
            });
        });
        it('can get a stake account', async () => {
            expect.assertions(1);
            // See scripts/fixtures/stake-account.json
            const variableValues = {
                address: 'CSg2vQGbnwWdSyJpwK4i3qGfB6FebaV3xQTx4U1MbixN',
            };
            const source = `
                query testQuery($address: String!) {
                    account(address: $address) {
                        ... on StakeAccount {
                            data {
                                parsed {
                                    info {
                                        meta {
                                            authorized {
                                                staker
                                                withdrawer
                                            }
                                            lockup {
                                                custodian
                                                epoch
                                                unixTimestamp
                                            }
                                            rentExemptReserve
                                        }
                                        stake {
                                            creditsObserved
                                            delegation {
                                                activationEpoch
                                                deactivationEpoch
                                                stake
                                                voter
                                            }
                                        }
                                    }
                                    type
                                }
                                program
                                space
                            }
                        }
                    }
                }
            `;
            const result = await rpcGraphQL.query(source, variableValues);
            expect(result).toMatchObject({
                data: {
                    account: {
                        data: {
                            parsed: {
                                info: {
                                    meta: {
                                        authorized: {
                                            staker: expect.any(String),
                                            withdrawer: expect.any(String),
                                        },
                                        lockup: {
                                            custodian: expect.any(String),
                                            epoch: expect.any(BigInt),
                                            unixTimestamp: expect.any(BigInt),
                                        },
                                        rentExemptReserve: expect.any(String),
                                    },
                                    stake: {
                                        creditsObserved: expect.any(BigInt),
                                        delegation: {
                                            activationEpoch: expect.any(BigInt),
                                            deactivationEpoch: expect.any(BigInt),
                                            stake: expect.any(String),
                                            voter: expect.any(String),
                                        },
                                    },
                                },
                                type: 'delegated',
                            },
                            program: 'stake',
                            space: 200n,
                        },
                    },
                },
            });
        });
        it('can get a vote account', async () => {
            expect.assertions(1);
            // See scripts/fixtures/vote-account.json
            const variableValues = {
                address: '4QUZQ4c7bZuJ4o4L8tYAEGnePFV27SUFEVmC7BYfsXRp',
            };
            const source = `
                query testQuery($address: String!) {
                    account(address: $address) {
                        ... on VoteAccount {
                            data {
                                parsed {
                                    info {
                                        authorizedVoters {
                                            authorizedVoter
                                            epoch
                                        }
                                        authorizedWithdrawer
                                        commission
                                        epochCredits {
                                            credits
                                            epoch
                                            previousCredits
                                        }
                                        lastTimestamp {
                                            slot
                                            timestamp
                                        }
                                        nodePubkey
                                        priorVoters
                                        rootSlot
                                        votes {
                                            confirmationCount
                                            slot
                                        }
                                    }
                                    type
                                }
                                program
                                space
                            }
                        }
                    }
                }
            `;
            const result = await rpcGraphQL.query(source, variableValues);
            expect(result).toMatchObject({
                data: {
                    account: {
                        data: {
                            parsed: {
                                info: {
                                    authorizedVoters: expect.arrayContaining([
                                        {
                                            authorizedVoter: expect.any(String),
                                            epoch: expect.any(BigInt),
                                        },
                                    ]),
                                    authorizedWithdrawer: expect.any(String),
                                    commission: expect.any(Number),
                                    epochCredits: expect.arrayContaining([
                                        {
                                            credits: expect.any(String),
                                            epoch: expect.any(BigInt),
                                            previousCredits: expect.any(String),
                                        },
                                    ]),
                                    lastTimestamp: {
                                        slot: expect.any(BigInt),
                                        timestamp: expect.any(BigInt),
                                    },
                                    nodePubkey: expect.any(String),
                                    priorVoters: expect.any(Array),
                                    rootSlot: expect.any(BigInt),
                                    votes: expect.arrayContaining([
                                        {
                                            confirmationCount: expect.any(Number),
                                            slot: expect.any(BigInt),
                                        },
                                    ]),
                                },
                                type: 'vote',
                            },
                            program: 'vote',
                            space: expect.any(BigInt),
                        },
                    },
                },
            });
        });
        it('can get an address lookup table account', async () => {
            expect.assertions(1);
            // See scripts/fixtures/address-lookup-table-account.json
            const variableValues = {
                address: '2JPQuT3dHtPjrdcbUQyrrT4XYRYaWpWfmAJ54SUapg6n',
            };
            const source = `
                query testQuery($address: String!) {
                    account(address: $address) {
                        ... on LookupTableAccount {
                            data {
                                parsed {
                                    info {
                                        addresses
                                        authority
                                        deactivationSlot
                                        lastExtendedSlot
                                        lastExtendedSlotStartIndex
                                    }
                                    type
                                }
                                program
                                space
                            }
                        }
                    }
                }
            `;
            const result = await rpcGraphQL.query(source, variableValues);
            expect(result).toMatchObject({
                data: {
                    account: {
                        data: {
                            parsed: {
                                info: {
                                    addresses: expect.any(Array),
                                    authority: expect.any(String),
                                    deactivationSlot: expect.any(String),
                                    lastExtendedSlot: expect.any(String),
                                    lastExtendedSlotStartIndex: expect.any(Number),
                                },
                                type: 'lookupTable',
                            },
                            program: 'address-lookup-table',
                            space: 1304n,
                        },
                    },
                },
            });
        });
    });
});
